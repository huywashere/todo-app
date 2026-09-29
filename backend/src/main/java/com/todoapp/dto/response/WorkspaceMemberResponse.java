package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record WorkspaceMemberResponse(String userId, String email, String displayName, String role, LocalDateTime joinedAt) {}
