package com.todoapp.dto.request;

import com.todoapp.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    private String clientId;

    @NotBlank(message = "Tiêu đề công việc không được để trống")
    private String title;

    private String description;
    private TaskPriority priority;
    private String listId;
    private String time;
    private String dueDate;
    private String dateLabel;
    private List<String> tags;
    private String recurrenceRule;
    private LocalDateTime reminderAt;
    private String assigneeEmail;
    private String workspaceId;
    private Integer recurrenceInterval;
    private String recurrenceEndDate;
}
