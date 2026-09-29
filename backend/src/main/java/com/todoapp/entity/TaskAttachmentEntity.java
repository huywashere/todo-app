package com.todoapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "task_attachments")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskAttachmentEntity {
    @Id @Column(length = 64) private String id;
    @Column(nullable = false, length = 64) private String taskId;
    @Column(length = 64) private String uploaderId;
    @Column(nullable = false, length = 255) private String fileName;
    @Column(length = 160) private String contentType;
    @Column(nullable = false) private long sizeBytes;
    @Column(nullable = false, unique = true, length = 500) private String storageKey;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
