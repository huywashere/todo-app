package com.todoapp.service.impl;

import com.todoapp.dto.request.CreateSubTaskRequest;
import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.request.UpdateTaskRequest;
import com.todoapp.dto.response.SubTaskResponse;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.dto.response.TaskStatsResponse;
import com.todoapp.entity.SubTaskEntity;
import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.TaskRepository;
import com.todoapp.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(String listId, String query, TaskStatus status) {
        List<TaskEntity> tasks;

        if (query != null && !query.trim().isEmpty()) {
            tasks = taskRepository.searchTasks(query.trim());
        } else if (listId != null && !listId.trim().isEmpty()) {
            tasks = taskRepository.findByListIdOrderBySortOrderAsc(listId.trim());
        } else if (status != null) {
            tasks = taskRepository.findByStatusOrderBySortOrderAsc(status);
        } else {
            tasks = taskRepository.findAllByOrderBySortOrderAscCreatedAtDesc();
        }

        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(String id) {
        TaskEntity task = findTaskOrThrow(id);
        return mapToResponse(task);
    }

    @Override
    public TaskResponse createTask(CreateTaskRequest request) {
        String taskId = "task-" + UUID.randomUUID().toString().substring(0, 8);
        TaskEntity task = TaskEntity.builder()
                .id(taskId)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.NONE)
                .listId(request.getListId() != null ? request.getListId() : "inbox")
                .time(request.getTime())
                .dueDate(request.getDueDate())
                .dateLabel(request.getDateLabel() != null ? request.getDateLabel() : "Today")
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .sortOrder(0)
                .build();

        TaskEntity saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    public TaskResponse updateTask(String id, UpdateTaskRequest request) {
        TaskEntity task = findTaskOrThrow(id);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getListId() != null) task.setListId(request.getListId());
        if (request.getTime() != null) task.setTime(request.getTime());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getDateLabel() != null) task.setDateLabel(request.getDateLabel());
        if (request.getTags() != null) task.setTags(request.getTags());
        if (request.getOrder() != null) task.setSortOrder(request.getOrder());

        if (request.getStatus() != null) {
            if (request.getStatus() == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (request.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(null);
            }
            task.setStatus(request.getStatus());
        }

        TaskEntity updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    @Override
    public TaskResponse toggleTaskStatus(String id) {
        TaskEntity task = findTaskOrThrow(id);
        boolean isNowCompleted = task.getStatus() != TaskStatus.COMPLETED;

        task.setStatus(isNowCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO);
        task.setCompletedAt(isNowCompleted ? LocalDateTime.now() : null);

        TaskEntity updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    @Override
    public void deleteTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        taskRepository.delete(task);
    }

    @Override
    public TaskResponse addSubTask(String taskId, CreateSubTaskRequest request) {
        TaskEntity task = findTaskOrThrow(taskId);
        String subTaskId = "st-" + UUID.randomUUID().toString().substring(0, 8);

        SubTaskEntity subTask = SubTaskEntity.builder()
                .id(subTaskId)
                .title(request.getTitle())
                .completed(false)
                .build();

        task.addSubTask(subTask);
        TaskEntity updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    @Override
    public TaskResponse toggleSubTask(String taskId, String subTaskId) {
        TaskEntity task = findTaskOrThrow(taskId);
        SubTaskEntity subTask = task.getSubtasks().stream()
                .filter(s -> s.getId().equals(subTaskId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy việc phụ với id: " + subTaskId));

        subTask.setCompleted(!subTask.isCompleted());
        TaskEntity updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    @Override
    public TaskResponse deleteSubTask(String taskId, String subTaskId) {
        TaskEntity task = findTaskOrThrow(taskId);
        SubTaskEntity subTask = task.getSubtasks().stream()
                .filter(s -> s.getId().equals(subTaskId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy việc phụ với id: " + subTaskId));

        task.removeSubTask(subTask);
        TaskEntity updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskStatsResponse getTaskStats() {
        List<TaskEntity> all = taskRepository.findAll();
        long total = all.size();
        long completed = all.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        long inProgress = all.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long todo = all.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();

        String todayStr = LocalDate.now().toString();
        long todayCount = all.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED &&
                        (todayStr.equals(t.getDueDate()) || (t.getDateLabel() != null && t.getDateLabel().toLowerCase().contains("today"))))
                .count();

        long inboxCount = all.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && ("inbox".equals(t.getListId()) || t.getListId() == null))
                .count();

        return TaskStatsResponse.builder()
                .total(total)
                .completed(completed)
                .inProgress(inProgress)
                .todo(todo)
                .todayCount(todayCount)
                .inboxCount(inboxCount)
                .build();
    }

    private TaskEntity findTaskOrThrow(String id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với id: " + id));
    }

    private TaskResponse mapToResponse(TaskEntity entity) {
        List<SubTaskResponse> subtaskResponses = entity.getSubtasks() != null ?
                entity.getSubtasks().stream().map(s -> SubTaskResponse.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .completed(s.isCompleted())
                        .build()).collect(Collectors.toList()) : new ArrayList<>();

        return TaskResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .listId(entity.getListId())
                .time(entity.getTime())
                .dueDate(entity.getDueDate())
                .dateLabel(entity.getDateLabel())
                .tags(entity.getTags())
                .subtasks(subtaskResponses)
                .order(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .completedAt(entity.getCompletedAt())
                .build();
    }
}
