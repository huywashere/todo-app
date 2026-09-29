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
public class CreateListRequest {

    private String id;

    @NotBlank(message = "Tên danh sách không được để trống")
    private String name;

    private String emoji;
    private String color;
    private Boolean hasDot;
    private String workspaceId;
}
