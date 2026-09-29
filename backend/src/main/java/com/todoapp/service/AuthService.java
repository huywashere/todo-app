package com.todoapp.service;

import com.todoapp.dto.request.LoginRequest;
import com.todoapp.dto.request.RegisterRequest;
import com.todoapp.dto.request.UpdateProfileRequest;
import com.todoapp.dto.response.AuthResponse;
import com.todoapp.dto.response.AccountTokenResponse;
import com.todoapp.dto.response.UserResponse;
import com.todoapp.dto.response.SessionResponse;
import com.todoapp.entity.AccountTokenEntity;
import com.todoapp.entity.ListEntity;
import com.todoapp.entity.RefreshTokenEntity;
import com.todoapp.entity.UserEntity;
import com.todoapp.entity.WorkspaceEntity;
import com.todoapp.entity.WorkspaceMemberEntity;
import com.todoapp.exception.ConflictException;
import com.todoapp.exception.UnauthorizedException;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.AccountTokenRepository;
import com.todoapp.repository.RefreshTokenRepository;
import com.todoapp.repository.UserRepository;
import com.todoapp.repository.WorkspaceRepository;
import com.todoapp.repository.WorkspaceMemberRepository;
import com.todoapp.security.AuthenticatedUser;
import com.todoapp.security.CurrentUser;
import com.todoapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final AccountTokenRepository accountTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ListRepository listRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUser currentUser;
    private final EmailDeliveryService emailDeliveryService;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.security.refresh-token-days:30}")
    private long refreshTokenDays;

    @Value("${app.security.expose-development-tokens:true}")
    private boolean exposeDevelopmentTokens;

    @Value("${app.security.login-max-attempts:5}")
    private int loginMaxAttempts;

    @Value("${app.security.login-lock-minutes:15}")
    private long loginLockMinutes;

    public AuthResponse register(RegisterRequest request) {
        return register(request, "Browser", null, null);
    }

    public AuthResponse register(RegisterRequest request, String deviceName, String userAgent, String ipAddress) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email đã được sử dụng");
        }
        UserEntity user = userRepository.save(UserEntity.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .displayName(request.displayName().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build());
        createStarterLists(user.getId());
        return issueTokens(user, deviceName, userAgent, ipAddress);
    }

    public AuthResponse login(LoginRequest request) {
        return login(request, "Browser", null, null);
    }

    public AuthResponse login(LoginRequest request, String deviceName, String userAgent, String ipAddress) {
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(UserEntity::isEnabled)
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không đúng"));
        LocalDateTime now = LocalDateTime.now();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new UnauthorizedException("Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            int failed = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failed);
            if (failed >= loginMaxAttempts) {
                user.setLockedUntil(now.plusMinutes(loginLockMinutes));
                user.setFailedLoginAttempts(0);
            }
            userRepository.save(user);
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        return issueTokens(user, deviceName, userAgent, ipAddress);
    }

    public AuthResponse refresh(String rawRefreshToken) {
        return refresh(rawRefreshToken, "Browser", null, null);
    }

    public AuthResponse refresh(String rawRefreshToken, String deviceName, String userAgent, String ipAddress) {
        String tokenHash = hash(rawRefreshToken);
        RefreshTokenEntity existing = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn"));
        existing.setRevoked(true);
        existing.setLastUsedAt(LocalDateTime.now());
        UserEntity user = userRepository.findById(existing.getUserId())
                .filter(UserEntity::isEnabled)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không còn hoạt động"));
        return issueTokens(user, deviceName, userAgent, ipAddress);
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(rawRefreshToken))
                .ifPresent(token -> token.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> sessions(String currentRawToken) {
        UserEntity user = requireCurrentUser();
        String currentHash = currentRawToken == null || currentRawToken.isBlank() ? null : hash(currentRawToken);
        return refreshTokenRepository.findByUserIdAndRevokedFalseOrderByCreatedAtDesc(user.getId()).stream()
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(token -> new SessionResponse(
                        token.getId(), token.getDeviceName(), token.getIpAddress(), token.getCreatedAt(),
                        token.getLastUsedAt(), token.getExpiresAt(), currentHash != null && currentHash.equals(token.getTokenHash())))
                .toList();
    }

    public void revokeSession(String sessionId) {
        UserEntity user = requireCurrentUser();
        refreshTokenRepository.findByIdAndUserIdAndRevokedFalse(sessionId, user.getId())
                .ifPresent(token -> token.setRevoked(true));
    }

    public void revokeAllSessions() {
        refreshTokenRepository.deleteByUserId(requireCurrentUser().getId());
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return toResponse(requireCurrentUser());
    }

    public UserResponse updateProfile(UpdateProfileRequest request) {
        UserEntity user = requireCurrentUser();
        ZoneId.of(request.timezone());
        user.setDisplayName(request.displayName().trim());
        user.setTimezone(request.timezone());
        return toResponse(userRepository.save(user));
    }

    public void changePassword(String currentPassword, String newPassword) {
        UserEntity user = requireCurrentUser();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Mật khẩu hiện tại không đúng");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    public void deleteAccount(String password) {
        UserEntity user = requireCurrentUser();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Mật khẩu không đúng");
        }
        userRepository.delete(user);
    }

    public AccountTokenResponse requestEmailVerification() {
        UserEntity user = requireCurrentUser();
        if (user.isEmailVerified()) {
            return new AccountTokenResponse("Email đã được xác minh", null);
        }
        AccountTokenResponse response = issueAccountToken(user, "EMAIL_VERIFICATION", "Hướng dẫn xác minh đã được gửi");
        String token = response.developmentToken();
        if (token != null) emailDeliveryService.sendVerification(user.getEmail(), user.getDisplayName(), token);
        return exposeDevelopmentTokens ? response : new AccountTokenResponse(response.message(), null);
    }

    public UserResponse verifyEmail(String rawToken) {
        AccountTokenEntity token = consumeAccountToken(rawToken, "EMAIL_VERIFICATION");
        UserEntity user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        user.setEmailVerified(true);
        return toResponse(userRepository.save(user));
    }

    public AccountTokenResponse forgotPassword(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .filter(UserEntity::isEnabled)
                .map(user -> {
                    AccountTokenResponse response = issueAccountToken(user, "PASSWORD_RESET", "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi");
                    if (response.developmentToken() != null) {
                        emailDeliveryService.sendPasswordReset(user.getEmail(), user.getDisplayName(), response.developmentToken());
                    }
                    return exposeDevelopmentTokens ? response : new AccountTokenResponse(response.message(), null);
                })
                .orElseGet(() -> new AccountTokenResponse("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được tạo", null));
    }

    public void resetPassword(String rawToken, String newPassword) {
        AccountTokenEntity token = consumeAccountToken(rawToken, "PASSWORD_RESET");
        UserEntity user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    private AuthResponse issueTokens(UserEntity user, String deviceName, String userAgent, String ipAddress) {
        byte[] random = new byte[48];
        secureRandom.nextBytes(random);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        refreshTokenRepository.save(RefreshTokenEntity.builder()
                .id(UUID.randomUUID().toString())
                .tokenHash(hash(rawRefreshToken))
                .userId(user.getId())
                .deviceName(deviceName == null || deviceName.isBlank() ? "Browser" : deviceName.substring(0, Math.min(120, deviceName.length())))
                .userAgent(userAgent == null ? null : userAgent.substring(0, Math.min(500, userAgent.length())))
                .ipAddress(ipAddress == null ? null : ipAddress.substring(0, Math.min(64, ipAddress.length())))
                .lastUsedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenDays))
                .build());
        return new AuthResponse(
                jwtService.createAccessToken(user),
                rawRefreshToken,
                jwtService.getAccessTokenSeconds(),
                toResponse(user));
    }

    private void createStarterLists(String userId) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String workspaceId = "personal-" + userId;
        UserEntity user = userRepository.findById(userId).orElseThrow();
        workspaceRepository.save(WorkspaceEntity.builder().id(workspaceId)
                .name(user.getDisplayName() + "'s Workspace").ownerId(userId).build());
        workspaceMemberRepository.save(WorkspaceMemberEntity.builder()
                .workspaceId(workspaceId).userId(userId).role("OWNER").build());
        listRepository.saveAll(List.of(
                ListEntity.builder().id("personal-" + suffix).ownerId(userId).workspaceId(workspaceId).name("Personal").emoji("🏡").color("#10B981").hasDot(true).build(),
                ListEntity.builder().id("work-" + suffix).ownerId(userId).workspaceId(workspaceId).name("Work").emoji("💼").color("#F59E0B").hasDot(false).build(),
                ListEntity.builder().id("goals-" + suffix).ownerId(userId).workspaceId(workspaceId).name("Goals").emoji("🎯").color("#8B5CF6").hasDot(false).build()));
    }

    private UserResponse toResponse(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.getTimezone(),
                user.isEmailVerified());
    }

    private UserEntity requireCurrentUser() {
        AuthenticatedUser authenticated = currentUser.get();
        return userRepository.findById(authenticated.id())
                .filter(UserEntity::isEnabled)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không còn hoạt động"));
    }

    private AccountTokenResponse issueAccountToken(UserEntity user, String type, String message) {
        accountTokenRepository.deleteByUserIdAndTokenType(user.getId(), type);
        String rawToken = randomToken();
        accountTokenRepository.save(AccountTokenEntity.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .tokenHash(hash(rawToken))
                .tokenType(type)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());
        return new AccountTokenResponse(message, rawToken);
    }

    private AccountTokenEntity consumeAccountToken(String rawToken, String type) {
        AccountTokenEntity token = accountTokenRepository
                .findByTokenHashAndTokenTypeAndUsedAtIsNull(hash(rawToken), type)
                .filter(value -> value.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Mã xác nhận không hợp lệ hoặc đã hết hạn"));
        token.setUsedAt(LocalDateTime.now());
        return token;
    }

    private String randomToken() {
        byte[] random = new byte[32];
        secureRandom.nextBytes(random);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể bảo vệ refresh token", exception);
        }
    }
}
