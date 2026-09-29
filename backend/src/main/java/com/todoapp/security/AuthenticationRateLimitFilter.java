package com.todoapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class AuthenticationRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS = 12;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
        return !(path.endsWith("/auth/login") || path.endsWith("/auth/register")
                || path.endsWith("/auth/forgot-password") || path.endsWith("/auth/reset-password")
                || path.endsWith("/auth/refresh"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = Instant.now().getEpochSecond();
        String key = clientIp(request) + ':' + request.getRequestURI();
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt >= WINDOW_SECONDS) return new Window(now);
            current.count.incrementAndGet();
            return current;
        });
        if (window.count.get() > MAX_REQUESTS) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, WINDOW_SECONDS - (now - window.startedAt))));
            response.getWriter().write("{\"success\":false,\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau\"}");
            return;
        }
        if (windows.size() > 10_000) windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt > WINDOW_SECONDS * 2);
        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }

    private static final class Window {
        private final long startedAt;
        private final AtomicInteger count = new AtomicInteger(1);

        private Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }
}
