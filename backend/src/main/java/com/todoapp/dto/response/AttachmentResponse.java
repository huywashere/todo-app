package com.todoapp.dto.response;

import java.time.LocalDateTime;

public record AttachmentResponse(
        String id, String taskId, String fileName, String contentType,
        long sizeBytes, LocalDateTime createdAt) {}
