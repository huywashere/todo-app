package com.todoapp.service;

import com.todoapp.dto.response.NotificationResponse;
import com.todoapp.entity.TaskNotificationEntity;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.TaskNotificationRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    private final TaskRepository taskRepository;
    private final TaskNotificationRepository notificationRepository;
    private final CurrentUser currentUser;

    @Scheduled(fixedDelayString = "${app.reminders.poll-ms:30000}")
    public void dispatchDueReminders() {
        taskRepository
                .findTop100ByDeletedAtIsNullAndStatusNotAndReminderAtLessThanEqualAndReminderSentFalseOrderByReminderAtAsc(
                        TaskStatus.COMPLETED, LocalDateTime.now(Clock.systemUTC()))
                .forEach(task -> {
                    notificationRepository.save(TaskNotificationEntity.builder()
                            .id(UUID.randomUUID().toString())
                            .ownerId(task.getOwnerId())
                            .taskId(task.getId())
                            .title(task.getTitle())
                            .message("Đến giờ thực hiện công việc" + (task.getTime() == null ? "" : " lúc " + task.getTime()))
                            .build());
                    task.setReminderSent(true);
                    taskRepository.save(task);
                });
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list() {
        return notificationRepository.findTop50ByOwnerIdOrderByCreatedAtDesc(currentUser.id())
                .stream().map(this::map).toList();
    }

    public NotificationResponse markRead(String id) {
        TaskNotificationEntity item = notificationRepository.findByIdAndOwnerId(id, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if (item.getReadAt() == null) item.setReadAt(LocalDateTime.now());
        return map(item);
    }

    public void markAllRead() {
        notificationRepository.findTop50ByOwnerIdOrderByCreatedAtDesc(currentUser.id())
                .stream().filter(item -> item.getReadAt() == null)
                .forEach(item -> item.setReadAt(LocalDateTime.now()));
    }

    private NotificationResponse map(TaskNotificationEntity item) {
        return new NotificationResponse(item.getId(), item.getTaskId(), item.getTitle(), item.getMessage(), item.getReadAt(), item.getCreatedAt());
    }
}
