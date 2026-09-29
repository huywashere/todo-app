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
import com.todoapp.repository.ListRepository;
import com.todoapp.security.CurrentUser;
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
    private final ListRepository listRepository;
    private final CurrentUser currentUser;

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(String listId, String query, TaskStatus status) {
        String ownerId = currentUser.id();
        List<TaskEntity> tasks;

        if (query != null && !query.trim().isEmpty()) {
            tasks = taskRepository.searchTasks(ownerId, query.trim());
        } else if ("trash".equalsIgnoreCase(listId)) {
            tasks = taskRepository.findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(ownerId);
        } else if (listId != null && !listId.trim().isEmpty()) {
            tasks = taskRepository.findByOwnerIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(ownerId, listId.trim());
        } else if (status != null) {
            tasks = taskRepository.findByOwnerIdAndStatusAndDeletedAtIsNullOrderBySortOrderAsc(ownerId, status);
        } else {
            tasks = taskRepository.findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(ownerId);
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
        String ownerId = currentUser.id();
        if (request.getClientId() != null && !request.getClientId().isBlank()) {
            var existing = taskRepository.findByOwnerIdAndClientRequestId(ownerId, request.getClientId().trim());
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }
        String taskId = validClientId(request.getClientId())
                ? request.getClientId().trim()
                : "task-" + UUID.randomUUID();
        validateListOwnership(request.getListId(), ownerId);
        String recurrence = normalizeRecurrence(request.getRecurrenceRule());
        TaskEntity task = TaskEntity.builder()
                .id(taskId)
                .ownerId(ownerId)
                .clientRequestId(request.getClientId() == null ? null : request.getClientId().trim())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .status(TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.NONE)
                .listId(request.getListId() != null ? request.getListId() : "inbox")
                .time(request.getTime())
                .dueDate(request.getDueDate())
                .dateLabel(request.getDateLabel() != null ? request.getDateLabel() : "Today")
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .recurrenceRule(recurrence)
                .recurrenceSeriesId("NONE".equals(recurrence) ? null : taskId)
                .reminderAt(request.getReminderAt())
                .reminderSent(false)
                .assigneeEmail(normalizeAssignee(request.getAssigneeEmail()))
                .sortOrder(0)
                .build();

        TaskEntity saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    @Override
    public TaskResponse updateTask(String id, UpdateTaskRequest request) {
        TaskEntity task = findTaskOrThrow(id);

        if (request.getVersion() != null && !request.getVersion().equals(task.getVersion())) {
            throw new com.todoapp.exception.ConflictException("Công việc đã được cập nhật ở thiết bị khác. Hãy đồng bộ lại.");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) task.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getListId() != null) {
            validateListOwnership(request.getListId(), currentUser.id());
            task.setListId(request.getListId());
        }
        if (request.getTime() != null) task.setTime(request.getTime());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getDateLabel() != null) task.setDateLabel(request.getDateLabel());
        if (request.getTags() != null) task.setTags(request.getTags());
        if (request.getOrder() != null) task.setSortOrder(request.getOrder());
        if (request.getRecurrenceRule() != null) {
            task.setRecurrenceRule(normalizeRecurrence(request.getRecurrenceRule()));
            if (!"NONE".equals(task.getRecurrenceRule()) && task.getRecurrenceSeriesId() == null) {
                task.setRecurrenceSeriesId(task.getId());
            }
        }
        if (Boolean.TRUE.equals(request.getClearReminder())) {
            task.setReminderAt(null);
            task.setReminderSent(false);
        } else if (request.getReminderAt() != null) {
            task.setReminderAt(request.getReminderAt());
            task.setReminderSent(false);
        }
        if (request.getAssigneeEmail() != null) task.setAssigneeEmail(normalizeAssignee(request.getAssigneeEmail()));

        boolean becameCompleted = false;
        if (request.getStatus() != null) {
            if (request.getStatus() == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
                becameCompleted = true;
            } else if (request.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(null);
            }
            task.setStatus(request.getStatus());
        }

        // Flush before mapping so the response contains the database-generated
        // optimistic-lock version that clients must send with their next write.
        TaskEntity updated = taskRepository.saveAndFlush(task);
        if (becameCompleted) createNextOccurrence(updated);
        return mapToResponse(updated);
    }

    @Override
    public TaskResponse toggleTaskStatus(String id) {
        TaskEntity task = findTaskOrThrow(id);
        boolean isNowCompleted = task.getStatus() != TaskStatus.COMPLETED;

        task.setStatus(isNowCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO);
        task.setCompletedAt(isNowCompleted ? LocalDateTime.now() : null);

        TaskEntity updated = taskRepository.saveAndFlush(task);
        if (isNowCompleted) createNextOccurrence(updated);
        return mapToResponse(updated);
    }

    @Override
    public void deleteTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Override
    public TaskResponse restoreTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        task.setDeletedAt(null);
        return mapToResponse(taskRepository.saveAndFlush(task));
    }

    @Override
    public void permanentlyDeleteTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        taskRepository.delete(task);
    }

    @Override
    public TaskResponse addSubTask(String taskId, CreateSubTaskRequest request) {
        TaskEntity task = findTaskOrThrow(taskId);
        String subTaskId = request.getClientId() != null && request.getClientId().matches("st-[a-zA-Z0-9-]{8,58}")
                ? request.getClientId()
                : "st-" + UUID.randomUUID();

        if (task.getSubtasks().stream().anyMatch(item -> item.getId().equals(subTaskId))) {
            return mapToResponse(task);
        }

        SubTaskEntity subTask = SubTaskEntity.builder()
                .id(subTaskId)
                .title(request.getTitle())
                .completed(false)
                .build();

        task.addSubTask(subTask);
        TaskEntity updated = taskRepository.saveAndFlush(task);
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
        TaskEntity updated = taskRepository.saveAndFlush(task);
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
        TaskEntity updated = taskRepository.saveAndFlush(task);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskStatsResponse getTaskStats() {
        List<TaskEntity> all = taskRepository.findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(currentUser.id());
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

        long overdue = all.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getDueDate() != null && t.getDueDate().compareTo(todayStr) < 0)
                .count();
        long urgent = all.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getPriority() == TaskPriority.URGENT)
                .count();

        return TaskStatsResponse.builder()
                .total(total)
                .completed(completed)
                .inProgress(inProgress)
                .todo(todo)
                .todayCount(todayCount)
                .inboxCount(inboxCount)
                .overdue(overdue)
                .urgentCount(urgent)
                .build();
    }

    private TaskEntity findTaskOrThrow(String id) {
        return taskRepository.findByIdAndOwnerId(id, currentUser.id())
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
                .tags(entity.getTags() == null ? new ArrayList<>() : new ArrayList<>(entity.getTags()))
                .subtasks(subtaskResponses)
                .order(entity.getSortOrder())
                .version(entity.getVersion())
                .recurrenceRule(entity.getRecurrenceRule())
                .reminderAt(entity.getReminderAt())
                .assigneeEmail(entity.getAssigneeEmail())
                .recurrenceSeriesId(entity.getRecurrenceSeriesId())
                .recurrenceParentId(entity.getRecurrenceParentId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .completedAt(entity.getCompletedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    private void validateListOwnership(String listId, String ownerId) {
        if (listId == null || listId.isBlank() || "inbox".equals(listId)) {
            return;
        }
        if (listRepository.findByIdAndOwnerId(listId, ownerId).isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy danh sách với id: " + listId);
        }
    }

    private boolean validClientId(String clientId) {
        return clientId != null && clientId.matches("task-[a-zA-Z0-9-]{8,58}");
    }

    private String normalizeRecurrence(String recurrence) {
        if (recurrence == null || recurrence.isBlank()) {
            return "NONE";
        }
        String normalized = recurrence.trim().toUpperCase();
        return switch (normalized) {
            case "NONE", "DAILY", "WEEKLY", "MONTHLY" -> normalized;
            default -> throw new IllegalArgumentException("Quy tắc lặp không hợp lệ");
        };
    }

    private String normalizeAssignee(String assigneeEmail) {
        if (assigneeEmail == null || assigneeEmail.isBlank()) {
            return currentUser.get().email().toLowerCase(java.util.Locale.ROOT);
        }
        return assigneeEmail.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private void createNextOccurrence(TaskEntity source) {
        if (source.isNextOccurrenceGenerated()
                || source.getRecurrenceRule() == null
                || "NONE".equals(source.getRecurrenceRule())) {
            return;
        }

        LocalDate baseDate;
        try {
            baseDate = source.getDueDate() == null ? LocalDate.now() : LocalDate.parse(source.getDueDate());
        } catch (Exception ignored) {
            baseDate = LocalDate.now();
        }
        LocalDate nextDate = switch (source.getRecurrenceRule()) {
            case "DAILY" -> baseDate.plusDays(1);
            case "WEEKLY" -> baseDate.plusWeeks(1);
            case "MONTHLY" -> baseDate.plusMonths(1);
            default -> null;
        };
        if (nextDate == null) return;

        String nextId = "task-" + UUID.randomUUID();
        TaskEntity next = TaskEntity.builder()
                .id(nextId)
                .ownerId(source.getOwnerId())
                .title(source.getTitle())
                .description(source.getDescription())
                .status(TaskStatus.TODO)
                .priority(source.getPriority())
                .listId(source.getListId())
                .time(source.getTime())
                .dueDate(nextDate.toString())
                .dateLabel(nextDate.toString())
                .tags(source.getTags() == null ? new ArrayList<>() : new ArrayList<>(source.getTags()))
                .recurrenceRule(source.getRecurrenceRule())
                .recurrenceSeriesId(source.getRecurrenceSeriesId() == null ? source.getId() : source.getRecurrenceSeriesId())
                .recurrenceParentId(source.getId())
                .assigneeEmail(source.getAssigneeEmail())
                .reminderAt(shiftReminder(source.getReminderAt(), source.getRecurrenceRule()))
                .reminderSent(false)
                .sortOrder(source.getSortOrder())
                .build();
        if (source.getSubtasks() != null) {
            source.getSubtasks().forEach(item -> next.addSubTask(SubTaskEntity.builder()
                    .id("st-" + UUID.randomUUID())
                    .title(item.getTitle())
                    .completed(false)
                    .build()));
        }
        source.setNextOccurrenceGenerated(true);
        taskRepository.save(source);
        taskRepository.save(next);
    }

    private LocalDateTime shiftReminder(LocalDateTime reminder, String recurrence) {
        if (reminder == null) return null;
        return switch (recurrence) {
            case "DAILY" -> reminder.plusDays(1);
            case "WEEKLY" -> reminder.plusWeeks(1);
            case "MONTHLY" -> reminder.plusMonths(1);
            default -> null;
        };
    }
}
