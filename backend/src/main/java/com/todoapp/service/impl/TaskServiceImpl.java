package com.todoapp.service.impl;

import com.todoapp.dto.request.CreateSubTaskRequest;
import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.request.UpdateTaskRequest;
import com.todoapp.dto.response.SubTaskResponse;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.dto.response.TaskStatsResponse;
import com.todoapp.dto.response.PageResponse;
import com.todoapp.dto.request.BulkTaskRequest;
import com.todoapp.entity.SubTaskEntity;
import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.TaskRepository;
import com.todoapp.repository.ListRepository;
import com.todoapp.security.CurrentUser;
import com.todoapp.service.TaskService;
import com.todoapp.service.WorkspaceAccessService;
import com.todoapp.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ListRepository listRepository;
    private final CurrentUser currentUser;
    private final WorkspaceAccessService workspaceAccessService;
    private final ActivityService activityService;

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(String listId, String query, TaskStatus status, String workspaceId) {
        String ownerId = currentUser.id();
        List<TaskEntity> tasks;

        if (workspaceId != null && !workspaceId.isBlank()) {
            workspaceAccessService.requireMember(workspaceId);
            if (query != null && !query.trim().isEmpty()) {
                tasks = taskRepository.searchWorkspaceTasks(workspaceId, query.trim());
            } else if ("trash".equalsIgnoreCase(listId)) {
                tasks = taskRepository.findByWorkspaceIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(workspaceId);
            } else if (listId != null && !listId.trim().isEmpty()) {
                tasks = taskRepository.findByWorkspaceIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(workspaceId, listId.trim());
            } else if (status != null) {
                tasks = taskRepository.findByWorkspaceIdAndStatusAndDeletedAtIsNullOrderBySortOrderAsc(workspaceId, status);
            } else {
                tasks = taskRepository.findByWorkspaceIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(workspaceId);
            }
            return tasks.stream().map(this::mapToResponse).toList();
        }

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
    public PageResponse<TaskResponse> getTaskPage(int page, int size, String workspaceId) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "sortOrder")
                .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        org.springframework.data.domain.Page<TaskEntity> result;
        if (workspaceId != null && !workspaceId.isBlank()) {
            workspaceAccessService.requireMember(workspaceId);
            result = taskRepository.findByWorkspaceIdAndDeletedAtIsNull(workspaceId, pageable);
        } else {
            result = taskRepository.findByOwnerIdAndDeletedAtIsNull(currentUser.id(), pageable);
        }
        return new PageResponse<>(result.getContent().stream().map(this::mapToResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Override
    public List<TaskResponse> bulkUpdate(BulkTaskRequest request) {
        List<TaskResponse> changed = new ArrayList<>();
        for (String taskId : request.taskIds()) {
            TaskEntity task = findTaskOrThrow(taskId);
            if (request.delete()) task.setDeletedAt(LocalDateTime.now());
            if (request.status() != null) {
                task.setStatus(request.status());
                task.setCompletedAt(request.status() == TaskStatus.COMPLETED ? LocalDateTime.now() : null);
            }
            if (request.priority() != null) task.setPriority(request.priority());
            if (request.listId() != null) {
                validateListAccess(request.listId(), task.getWorkspaceId());
                task.setListId(request.listId());
            }
            TaskEntity saved = taskRepository.saveAndFlush(task);
            activityService.record(saved.getWorkspaceId(), saved.getId(), "TASK_BULK_UPDATED", saved.getTitle());
            changed.add(mapToResponse(saved));
        }
        return changed;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportCalendar(String workspaceId) {
        List<TaskEntity> tasks;
        if (workspaceId != null && !workspaceId.isBlank()) {
            workspaceAccessService.requireMember(workspaceId);
            tasks = taskRepository.findByWorkspaceIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(workspaceId);
        } else {
            tasks = taskRepository.findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(currentUser.id());
        }
        StringBuilder ics = new StringBuilder("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//FocusFlow//Tasks//EN\r\nCALSCALE:GREGORIAN\r\n");
        tasks.stream().filter(task -> task.getDueDate() != null).forEach(task -> {
            LocalDate date;
            try { date = LocalDate.parse(task.getDueDate()); } catch (Exception ignored) { return; }
            ics.append("BEGIN:VEVENT\r\nUID:").append(task.getId()).append("@focusflow\r\n")
                    .append("DTSTART;VALUE=DATE:").append(date.toString().replace("-", "")).append("\r\n")
                    .append("DTEND;VALUE=DATE:").append(date.plusDays(1).toString().replace("-", "")).append("\r\n")
                    .append("SUMMARY:").append(escapeIcs(task.getTitle())).append("\r\n")
                    .append("DESCRIPTION:").append(escapeIcs(task.getDescription())).append("\r\nEND:VEVENT\r\n");
        });
        return ics.append("END:VCALENDAR\r\n").toString();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(String id) {
        TaskEntity task = findTaskForView(id);
        return mapToResponse(task);
    }

    @Override
    public TaskResponse createTask(CreateTaskRequest request) {
        String ownerId = currentUser.id();
        String workspaceId = request.getWorkspaceId() == null || request.getWorkspaceId().isBlank()
                ? "personal-" + ownerId : request.getWorkspaceId().trim();
        workspaceAccessService.requireEditor(workspaceId);
        if (request.getClientId() != null && !request.getClientId().isBlank()) {
            var existing = taskRepository.findByOwnerIdAndClientRequestId(ownerId, request.getClientId().trim());
            if (existing.isPresent()) {
                return mapToResponse(existing.get());
            }
        }
        String taskId = validClientId(request.getClientId())
                ? request.getClientId().trim()
                : "task-" + UUID.randomUUID();
        validateListAccess(request.getListId(), workspaceId);
        String recurrence = normalizeRecurrence(request.getRecurrenceRule());
        TaskEntity task = TaskEntity.builder()
                .id(taskId)
                .ownerId(ownerId)
                .workspaceId(workspaceId)
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
                .recurrenceInterval(normalizeRecurrenceInterval(request.getRecurrenceInterval()))
                .recurrenceEndDate(normalizeDate(request.getRecurrenceEndDate()))
                .recurrenceSeriesId("NONE".equals(recurrence) ? null : taskId)
                .reminderAt(request.getReminderAt())
                .reminderSent(false)
                .assigneeEmail(normalizeAssignee(request.getAssigneeEmail()))
                .sortOrder(0)
                .build();

        TaskEntity saved = taskRepository.save(task);
        activityService.record(workspaceId, saved.getId(), "TASK_CREATED", saved.getTitle());
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
            validateListAccess(request.getListId(), task.getWorkspaceId());
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
        if (request.getRecurrenceInterval() != null) task.setRecurrenceInterval(normalizeRecurrenceInterval(request.getRecurrenceInterval()));
        if (request.getRecurrenceEndDate() != null) task.setRecurrenceEndDate(normalizeDate(request.getRecurrenceEndDate()));
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
        activityService.record(updated.getWorkspaceId(), updated.getId(), "TASK_UPDATED", updated.getTitle());
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
        activityService.record(updated.getWorkspaceId(), updated.getId(), isNowCompleted ? "TASK_COMPLETED" : "TASK_REOPENED", updated.getTitle());
        return mapToResponse(updated);
    }

    @Override
    public void deleteTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
        activityService.record(task.getWorkspaceId(), task.getId(), "TASK_DELETED", task.getTitle());
    }

    @Override
    public TaskResponse restoreTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        task.setDeletedAt(null);
        TaskEntity restored = taskRepository.saveAndFlush(task);
        activityService.record(restored.getWorkspaceId(), restored.getId(), "TASK_RESTORED", restored.getTitle());
        return mapToResponse(restored);
    }

    @Override
    public void permanentlyDeleteTask(String id) {
        TaskEntity task = findTaskOrThrow(id);
        activityService.record(task.getWorkspaceId(), task.getId(), "TASK_PURGED", task.getTitle());
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
        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với id: " + id));
        workspaceAccessService.requireTaskEditor(task);
        return task;
    }

    private TaskEntity findTaskForView(String id) {
        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với id: " + id));
        workspaceAccessService.requireTaskViewer(task);
        return task;
    }

    private String escapeIcs(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
                .replace("\r", "").replace("\n", "\\n");
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
                .workspaceId(entity.getWorkspaceId())
                .recurrenceInterval(entity.getRecurrenceInterval())
                .recurrenceEndDate(entity.getRecurrenceEndDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .completedAt(entity.getCompletedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    private void validateListAccess(String listId, String workspaceId) {
        if (listId == null || listId.isBlank() || "inbox".equals(listId)) {
            return;
        }
        if (listRepository.findByIdAndWorkspaceId(listId, workspaceId).isEmpty()) {
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
            case "NONE", "DAILY", "WEEKLY", "MONTHLY", "WEEKDAYS", "MONTHLY_LAST_DAY" -> normalized;
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
        int interval = source.getRecurrenceInterval() == null ? 1 : Math.max(1, source.getRecurrenceInterval());
        LocalDate nextDate = switch (source.getRecurrenceRule()) {
            case "DAILY" -> baseDate.plusDays(interval);
            case "WEEKLY" -> baseDate.plusWeeks(interval);
            case "MONTHLY" -> baseDate.plusMonths(interval);
            case "WEEKDAYS" -> nextWeekday(baseDate, interval);
            case "MONTHLY_LAST_DAY" -> baseDate.plusMonths(interval).withDayOfMonth(baseDate.plusMonths(interval).lengthOfMonth());
            default -> null;
        };
        if (nextDate == null) return;
        if (source.getRecurrenceEndDate() != null && nextDate.isAfter(LocalDate.parse(source.getRecurrenceEndDate()))) return;

        String nextId = "task-" + UUID.randomUUID();
        TaskEntity next = TaskEntity.builder()
                .id(nextId)
                .ownerId(source.getOwnerId())
                .workspaceId(source.getWorkspaceId())
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
                .recurrenceInterval(interval)
                .recurrenceEndDate(source.getRecurrenceEndDate())
                .recurrenceSeriesId(source.getRecurrenceSeriesId() == null ? source.getId() : source.getRecurrenceSeriesId())
                .recurrenceParentId(source.getId())
                .assigneeEmail(source.getAssigneeEmail())
                .reminderAt(shiftReminder(source.getReminderAt(), source.getDueDate(), nextDate))
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

    private LocalDateTime shiftReminder(LocalDateTime reminder, String previousDueDate, LocalDate nextDate) {
        if (reminder == null) return null;
        try {
            LocalDate previous = previousDueDate == null ? reminder.toLocalDate() : LocalDate.parse(previousDueDate);
            return reminder.plusDays(java.time.temporal.ChronoUnit.DAYS.between(previous, nextDate));
        } catch (Exception ignored) { return reminder; }
    }

    private int normalizeRecurrenceInterval(Integer interval) {
        if (interval == null) return 1;
        if (interval < 1 || interval > 365) throw new IllegalArgumentException("Khoảng lặp phải từ 1 đến 365");
        return interval;
    }

    private String normalizeDate(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value.trim()).toString();
    }

    private LocalDate nextWeekday(LocalDate base, int count) {
        LocalDate result = base;
        int remaining = count;
        while (remaining > 0) {
            result = result.plusDays(1);
            if (result.getDayOfWeek().getValue() <= 5) remaining--;
        }
        return result;
    }
}
