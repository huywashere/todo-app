package com.todoapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_members")
@IdClass(WorkspaceMemberId.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class WorkspaceMemberEntity {
    @Id @Column(name = "workspace_id", length = 64)
    private String workspaceId;
    @Id @Column(name = "user_id", length = 64)
    private String userId;
    @Column(nullable = false, length = 32)
    private String role;
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    void onCreate() { if (joinedAt == null) joinedAt = LocalDateTime.now(); }
}
