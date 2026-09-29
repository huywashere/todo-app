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
@Table(name = "focus_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusSessionEntity {
    @Id
    @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 64)
    private String ownerId;
    @Column(length = 64)
    private String taskId;
    @Column(nullable = false)
    private Integer durationSeconds;
    @Column(nullable = false, updatable = false)
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        if (completedAt == null) completedAt = LocalDateTime.now();
    }
}
