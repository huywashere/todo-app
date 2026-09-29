package com.todoapp.controller;

import com.todoapp.dto.request.CreateFocusSessionRequest;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.FocusSessionResponse;
import com.todoapp.entity.FocusSessionEntity;
import com.todoapp.repository.FocusSessionRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/focus-sessions")
@RequiredArgsConstructor
public class FocusSessionController {
    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;
    private final CurrentUser currentUser;

    @GetMapping
    public ApiResponse<List<FocusSessionResponse>> list() {
        List<FocusSessionResponse> items = focusSessionRepository
                .findTop100ByOwnerIdOrderByCompletedAtDesc(currentUser.id())
                .stream().map(this::map).toList();
        return ApiResponse.success(items);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FocusSessionResponse> create(@Valid @RequestBody CreateFocusSessionRequest request) {
        if (request.taskId() != null && !request.taskId().isBlank()) {
            taskRepository.findByIdAndOwnerId(request.taskId(), currentUser.id())
                    .orElseThrow(() -> new IllegalArgumentException("Công việc không hợp lệ"));
        }
        FocusSessionEntity saved = focusSessionRepository.save(FocusSessionEntity.builder()
                .id(UUID.randomUUID().toString())
                .ownerId(currentUser.id())
                .taskId(request.taskId())
                .durationSeconds(request.durationSeconds())
                .build());
        return ApiResponse.success("Đã lưu phiên tập trung", map(saved));
    }

    private FocusSessionResponse map(FocusSessionEntity item) {
        return new FocusSessionResponse(item.getId(), item.getTaskId(), item.getDurationSeconds(), item.getCompletedAt());
    }
}
