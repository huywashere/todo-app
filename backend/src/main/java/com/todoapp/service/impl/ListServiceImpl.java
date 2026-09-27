package com.todoapp.service.impl;

import com.todoapp.dto.request.CreateListRequest;
import com.todoapp.dto.response.ListResponse;
import com.todoapp.entity.ListEntity;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.service.ListService;
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

    @Override
    @Transactional(readOnly = true)
    public List<ListResponse> getAllLists() {
        return listRepository.findAll().stream().map(list -> {
            long taskCount = taskRepository.findByListIdOrderBySortOrderAsc(list.getId())
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
        String id = request.getId() != null && !request.getId().trim().isEmpty() ?
                request.getId().trim() : "list-" + UUID.randomUUID().toString().substring(0, 8);

        ListEntity entity = ListEntity.builder()
                .id(id)
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
        ListEntity entity = listRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
        listRepository.delete(entity);
    }
}
