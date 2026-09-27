package com.todoapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubTaskRequest {

    @NotBlank(message = "Tiêu đề công việc phụ không được để trống")
    private String title;
}
