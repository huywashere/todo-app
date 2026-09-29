package com.todoapp.service;

import com.todoapp.dto.response.ActivityResponse;
import com.todoapp.entity.TaskActivityEntity;
import com.todoapp.repository.TaskActivityRepository;
import com.todoapp.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final TaskActivityRepository repository;
    private final WorkspaceAccessService accessService;
    private final CurrentUser currentUser;
    private final RealtimeEventService realtimeEventService;

    @Transactional
    public void record(String workspaceId, String taskId, String action, String details) {
        if (workspaceId == null) return;
        TaskActivityEntity saved = repository.save(TaskActivityEntity.builder()
                .id("act-" + UUID.randomUUID()).workspaceId(workspaceId).taskId(taskId)
                .actorId(currentUser.id()).action(action).details(details).build());
        realtimeEventService.workspace(workspaceId, "workspace.activity", toResponse(saved));
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> forWorkspace(String workspaceId, int limit) {
        accessService.requireMember(workspaceId);
        return repository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, PageRequest.of(0, Math.min(Math.max(limit, 1), 100)))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> forTask(String taskId, int limit) {
        return repository.findByTaskIdOrderByCreatedAtDesc(taskId, PageRequest.of(0, Math.min(Math.max(limit, 1), 100)))
                .stream().map(this::toResponse).toList();
    }

    private ActivityResponse toResponse(TaskActivityEntity value) {
        return new ActivityResponse(value.getId(), value.getWorkspaceId(), value.getTaskId(), value.getActorId(),
                value.getAction(), value.getDetails(), value.getCreatedAt());
    }
}
