package com.todoapp.dto.response;

import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private String id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private String listId;
    private String time;
    private String dueDate;
    private String dateLabel;
    private List<String> tags;
    private List<SubTaskResponse> subtasks;
    private Integer order;
    private Long version;
    private String recurrenceRule;
    private LocalDateTime reminderAt;
    private String assigneeEmail;
    private String recurrenceSeriesId;
    private String recurrenceParentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime deletedAt;
}
