package com.todoapp.controller;

import com.todoapp.dto.request.*;
import com.todoapp.dto.response.AccountTokenResponse;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.AuthResponse;
import com.todoapp.dto.response.UserResponse;
import com.todoapp.dto.response.SessionResponse;
import com.todoapp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE = "focusflow_refresh";

    private final AuthService authService;

    @Value("${app.security.refresh-token-days:30}")
    private long refreshTokenDays;

    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.security.cookie-domain:}")
    private String cookieDomain;

    @Value("${app.security.cookie-same-site:Lax}")
    private String cookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        AuthResponse session = authService.register(request, deviceName(httpRequest), httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        return withRefreshCookie(HttpStatus.CREATED, "Đăng ký thành công", session);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse session = authService.login(request, deviceName(httpRequest), httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        return withRefreshCookie(HttpStatus.OK, "Đăng nhập thành công", session);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(value = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpRequest) {
        String token = resolveRefreshToken(cookieToken, request);
        AuthResponse session = authService.refresh(token, deviceName(httpRequest), httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        return withRefreshCookie(HttpStatus.OK, "Phiên đăng nhập đã được làm mới", session);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(value = REFRESH_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request) {
        authService.logout(resolveRefreshToken(cookieToken, request));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<SessionResponse>> sessions(
            @CookieValue(value = REFRESH_COOKIE, required = false) String cookieToken) {
        return ApiResponse.success(authService.sessions(cookieToken));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ApiResponse<Void> revokeSession(@org.springframework.web.bind.annotation.PathVariable String sessionId) {
        authService.revokeSession(sessionId);
        return ApiResponse.success("Phiên đăng nhập đã bị thu hồi", null);
    }

    @DeleteMapping("/sessions")
    public ResponseEntity<ApiResponse<Void>> revokeAllSessions() {
        authService.revokeAllSessions();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body(ApiResponse.success("Đã đăng xuất khỏi mọi thiết bị", null));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.success(authService.me());
    }

    @PatchMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success("Đã cập nhật hồ sơ", authService.updateProfile(request));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request.currentPassword(), request.newPassword());
        return ApiResponse.success("Đã đổi mật khẩu", null);
    }

    @PostMapping("/email-verification/request")
    public ApiResponse<AccountTokenResponse> requestEmailVerification() {
        return ApiResponse.success(authService.requestEmailVerification());
    }

    @PostMapping("/email-verification/confirm")
    public ApiResponse<UserResponse> verifyEmail(@Valid @RequestBody TokenRequest request) {
        return ApiResponse.success("Email đã được xác minh", authService.verifyEmail(request.token()));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<AccountTokenResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.success(authService.forgotPassword(request.email()));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ApiResponse.success("Đã đặt lại mật khẩu", null);
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        authService.deleteAccount(request.password());
        return ApiResponse.success("Tài khoản đã được xóa", null);
    }

    private ResponseEntity<ApiResponse<AuthResponse>> withRefreshCookie(HttpStatus status, String message, AuthResponse session) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken()).toString())
                .body(ApiResponse.success(message, session));
    }

    private ResponseCookie refreshCookie(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(Duration.ofDays(refreshTokenDays));
        if (cookieDomain != null && !cookieDomain.isBlank()) builder.domain(cookieDomain);
        return builder.build();
    }

    private ResponseCookie clearRefreshCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true).secure(cookieSecure).sameSite("Lax").path("/api/v1/auth").maxAge(Duration.ZERO);
        if (cookieDomain != null && !cookieDomain.isBlank()) builder.domain(cookieDomain);
        return builder.build();
    }

    private String resolveRefreshToken(String cookieToken, RefreshRequest request) {
        String token = cookieToken != null && !cookieToken.isBlank()
                ? cookieToken
                : request == null ? null : request.refreshToken();
        if (token == null || token.isBlank()) throw new com.todoapp.exception.UnauthorizedException("Thiếu refresh token");
        return token;
    }

    private String deviceName(HttpServletRequest request) {
        String explicit = request.getHeader("X-Device-Name");
        if (explicit != null && !explicit.isBlank()) return explicit;
        String agent = request.getHeader("User-Agent");
        if (agent == null) return "Unknown device";
        if (agent.contains("Mobile")) return "Mobile browser";
        return "Desktop browser";
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }
}
