package com.todoapp.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todoapp.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final ObjectMapper objectMapper;

    @Value("${app.security.jwt-secret}")
    private String jwtSecret;

    @Value("${app.security.access-token-seconds:900}")
    private long accessTokenSeconds;

    public String createAccessToken(UserEntity user) {
        try {
            Instant now = Instant.now();
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.getId());
            payload.put("email", user.getEmail());
            payload.put("name", user.getDisplayName());
            payload.put("role", user.getRole());
            payload.put("iat", now.getEpochSecond());
            payload.put("exp", now.plusSeconds(accessTokenSeconds).getEpochSecond());
            String unsigned = encodeJson(header) + "." + encodeJson(payload);
            return unsigned + "." + sign(unsigned);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo access token", exception);
        }
    }

    public AuthenticatedUser parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token");
            }
            String unsigned = parts[0] + "." + parts[1];
            if (!java.security.MessageDigest.isEqual(
                    sign(unsigned).getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Invalid signature");
            }
            Map<String, Object> claims = objectMapper.readValue(
                    DECODER.decode(parts[1]), new TypeReference<>() {});
            Number expiration = (Number) claims.get("exp");
            if (expiration == null || expiration.longValue() <= Instant.now().getEpochSecond()) {
                throw new IllegalArgumentException("Expired token");
            }
            return new AuthenticatedUser(
                    String.valueOf(claims.get("sub")),
                    String.valueOf(claims.get("email")),
                    String.valueOf(claims.get("name")),
                    String.valueOf(claims.get("role")));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Access token không hợp lệ", exception);
        }
    }

    public long getAccessTokenSeconds() {
        return accessTokenSeconds;
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
}
