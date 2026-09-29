package com.todoapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "task_activities")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskActivityEntity {
    @Id @Column(length = 64) private String id;
    @Column(nullable = false, length = 64) private String workspaceId;
    @Column(length = 64) private String taskId;
    @Column(length = 64) private String actorId;
    @Column(nullable = false, length = 80) private String action;
    @Column(length = 1000) private String details;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
