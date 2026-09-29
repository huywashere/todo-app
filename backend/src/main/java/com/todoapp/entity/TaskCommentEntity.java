package com.todoapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "task_comments")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskCommentEntity {
    @Id @Column(length = 64) private String id;
    @Column(nullable = false, length = 64) private String taskId;
    @Column(nullable = false, length = 64) private String authorId;
    @Column(nullable = false, length = 2000) private String body;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(nullable = false) private LocalDateTime updatedAt;
    @PrePersist void onCreate() { LocalDateTime now = LocalDateTime.now(); if (createdAt == null) createdAt = now; if (updatedAt == null) updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
