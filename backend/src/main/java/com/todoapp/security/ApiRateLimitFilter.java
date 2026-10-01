package com.todoapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple token-bucket rate limiter applied to all /api/ endpoints.
 *
 * Each unique IP address gets its own bucket.
 * Defaults: 60 requests / 60 s (configurable via application properties).
 *
 * This is intentionally lightweight — for production you would replace this
 * with Redis-backed Bucket4j or a gateway-level policy.
 */
@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.max-requests:60}")
    private int maxRequests;

    @Value("${rate-limit.window-seconds:60}")
    private int windowSeconds;

    private record Bucket(long windowStart, int count) {}

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only rate-limit API calls; let static assets pass through freely.
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String ip = resolveClientIp(request);
        long now = Instant.now().getEpochSecond();

        Bucket bucket = buckets.compute(ip, (key, existing) -> {
            if (existing == null || now - existing.windowStart() >= windowSeconds) {
                return new Bucket(now, 1);
            }
            return new Bucket(existing.windowStart(), existing.count() + 1);
        });

        int remaining = Math.max(0, maxRequests - bucket.count());
        long resetAt   = bucket.windowStart() + windowSeconds;

        response.setHeader("X-RateLimit-Limit",     String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
        response.setHeader("X-RateLimit-Reset",     String.valueOf(resetAt));

        if (bucket.count() > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"success":false,"message":"Too many requests. Please slow down and try again later."}
                    """);
            return;
        }

        chain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
