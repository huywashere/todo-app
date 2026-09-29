package com.todoapp.service.impl;

import com.todoapp.dto.request.CreateListRequest;
import com.todoapp.dto.response.ListResponse;
import com.todoapp.entity.ListEntity;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.service.ListService;
import com.todoapp.security.CurrentUser;
import com.todoapp.service.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ListServiceImpl implements ListService {

    private final ListRepository listRepository;
    private final TaskRepository taskRepository;
    private final CurrentUser currentUser;
    private final WorkspaceAccessService workspaceAccessService;

    @Override
    @Transactional(readOnly = true)
    public List<ListResponse> getAllLists(String workspaceId) {
        String ownerId = currentUser.id();
        String resolvedWorkspace = workspaceId == null || workspaceId.isBlank() ? null : workspaceId;
        List<ListEntity> source;
        if (resolvedWorkspace != null) {
            workspaceAccessService.requireMember(resolvedWorkspace);
            source = listRepository.findByWorkspaceIdOrderByCreatedAtAsc(resolvedWorkspace);
        } else {
            source = listRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId);
        }
        return source.stream().map(list -> {
            long taskCount = taskRepository.findByWorkspaceIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(list.getWorkspaceId(), list.getId())
                    .stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .count();

            return ListResponse.builder()
                    .id(list.getId())
                    .name(list.getName())
                    .emoji(list.getEmoji())
                    .color(list.getColor())
                    .hasDot(list.getHasDot())
                    .taskCount(taskCount)
                    .createdAt(list.getCreatedAt())
                    .workspaceId(list.getWorkspaceId())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public ListResponse createList(CreateListRequest request) {
        String ownerId = currentUser.id();
        String workspaceId = request.getWorkspaceId() == null || request.getWorkspaceId().isBlank()
                ? "personal-" + ownerId : request.getWorkspaceId();
        workspaceAccessService.requireEditor(workspaceId);
        String id = request.getId() != null && request.getId().matches("list-[a-zA-Z0-9-]{8,58}") ?
                request.getId().trim() : "list-" + UUID.randomUUID();

        ListEntity entity = ListEntity.builder()
                .id(id)
                .ownerId(ownerId)
                .workspaceId(workspaceId)
                .name(request.getName().trim())
                .emoji(request.getEmoji() != null ? request.getEmoji() : "📁")
                .color(request.getColor() != null ? request.getColor() : "#4772FA")
                .hasDot(request.getHasDot() != null ? request.getHasDot() : true)
                .build();

        ListEntity saved = listRepository.save(entity);

        return ListResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .emoji(saved.getEmoji())
                .color(saved.getColor())
                .hasDot(saved.getHasDot())
                .taskCount(0)
                .createdAt(saved.getCreatedAt())
                .workspaceId(saved.getWorkspaceId())
                .build();
    }

    @Override
    public void deleteList(String id) {
        String ownerId = currentUser.id();
        ListEntity entity = listRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
        workspaceAccessService.requireEditor(entity.getWorkspaceId());
        taskRepository.findByWorkspaceIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(entity.getWorkspaceId(), id)
                .forEach(task -> task.setListId("inbox"));
        listRepository.delete(entity);
    }
}
