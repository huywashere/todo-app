package com.todoapp.dto.request;

import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BulkTaskRequest(
        @NotEmpty @Size(max = 100) List<String> taskIds,
        TaskStatus status,
        TaskPriority priority,
        String listId,
        boolean delete) {}
