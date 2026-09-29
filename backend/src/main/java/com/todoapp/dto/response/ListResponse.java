package com.todoapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListResponse {
    private String id;
    private String name;
    private String emoji;
    private String color;
    private Boolean hasDot;
    private long taskCount;
    private LocalDateTime createdAt;
    private String workspaceId;
}
