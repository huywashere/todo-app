package com.todoapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 64)
    private String ownerId;

    @Column(length = 64)
    private String workspaceId;

    @Column(length = 120)
    private String clientRequestId;

    @Version
    private Long version;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TaskPriority priority;

    @Column(length = 64)
    private String listId;

    @Column(length = 32)
    private String time;

    @Column(length = 32)
    private String dueDate;

    @Column(length = 64)
    private String dateLabel;

    @Column(length = 32)
    private String recurrenceRule;

    @Column(nullable = false)
    @Builder.Default
    private Integer recurrenceInterval = 1;

    @Column(length = 32)
    private String recurrenceEndDate;

    private LocalDateTime reminderAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean reminderSent = false;

    @Column(length = 190)
    private String assigneeEmail;

    @Column(length = 64)
    private String recurrenceSeriesId;

    @Column(length = 64, unique = true)
    private String recurrenceParentId;

    @Column(nullable = false)
    @Builder.Default
    private boolean nextOccurrenceGenerated = false;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag", length = 64)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubTaskEntity> subtasks = new ArrayList<>();

    private Integer sortOrder;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = TaskStatus.TODO;
        }
        if (this.priority == null) {
            this.priority = TaskPriority.NONE;
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addSubTask(SubTaskEntity subTask) {
        subtasks.add(subTask);
        subTask.setTask(this);
    }

    public void removeSubTask(SubTaskEntity subTask) {
        subtasks.remove(subTask);
        subTask.setTask(null);
    }
}
