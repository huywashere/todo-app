package com.todoapp.dto.request;

import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {

    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private String listId;
    private String time;
    private String dueDate;
    private String dateLabel;
    private List<String> tags;
    private Integer order;
}
