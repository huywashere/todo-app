package com.todoapp.repository;

import com.todoapp.entity.TaskNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskNotificationRepository extends JpaRepository<TaskNotificationEntity, String> {
    List<TaskNotificationEntity> findTop50ByOwnerIdOrderByCreatedAtDesc(String ownerId);
    Optional<TaskNotificationEntity> findByIdAndOwnerId(String id, String ownerId);
    long countByOwnerIdAndReadAtIsNull(String ownerId);
}
