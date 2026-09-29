package com.todoapp.security;

public record AuthenticatedUser(String id, String email, String displayName, String role) {
}
