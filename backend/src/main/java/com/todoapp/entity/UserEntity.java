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
@Table(name = "app_users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String role = "USER";

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Asia/Ho_Chi_Minh";

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    private LocalDateTime lockedUntil;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
