package com.todoapp.dto.response;

public record UserResponse(
        String id,
        String email,
        String displayName,
        String role,
        String timezone,
        boolean emailVerified) {
}
