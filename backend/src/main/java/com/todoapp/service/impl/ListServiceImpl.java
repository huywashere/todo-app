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

    @Override
    @Transactional(readOnly = true)
    public List<ListResponse> getAllLists() {
        String ownerId = currentUser.id();
        return listRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId).stream().map(list -> {
            long taskCount = taskRepository.findByOwnerIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(ownerId, list.getId())
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
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public ListResponse createList(CreateListRequest request) {
        String ownerId = currentUser.id();
        String id = request.getId() != null && request.getId().matches("list-[a-zA-Z0-9-]{8,58}") ?
                request.getId().trim() : "list-" + UUID.randomUUID();

        ListEntity entity = ListEntity.builder()
                .id(id)
                .ownerId(ownerId)
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
                .build();
    }

    @Override
    public void deleteList(String id) {
        String ownerId = currentUser.id();
        ListEntity entity = listRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
        taskRepository.findByOwnerIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(ownerId, id)
                .forEach(task -> task.setListId("inbox"));
        listRepository.delete(entity);
    }
}
