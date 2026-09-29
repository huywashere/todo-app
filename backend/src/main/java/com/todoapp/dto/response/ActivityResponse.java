package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record ActivityResponse(
        String id, String workspaceId, String taskId, String actorId,
        String action, String details, LocalDateTime createdAt) {}
