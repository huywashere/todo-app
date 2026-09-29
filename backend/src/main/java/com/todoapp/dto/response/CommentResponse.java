package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record CommentResponse(
        String id, String taskId, String authorId, String authorName,
        String body, LocalDateTime createdAt, LocalDateTime updatedAt) {}
