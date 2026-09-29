package com.todoapp.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record AuthResponse(
        String accessToken,
        @JsonIgnore
        String refreshToken,
        long expiresInSeconds,
        UserResponse user) {
}
