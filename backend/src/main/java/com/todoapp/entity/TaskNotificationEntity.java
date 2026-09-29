package com.todoapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskNotificationEntity {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 64)
    private String ownerId;
    @Column(length = 64)
    private String taskId;
    @Column(nullable = false, length = 255)
    private String title;
    @Column(nullable = false, length = 500)
    private String message;
    private LocalDateTime readAt;
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
