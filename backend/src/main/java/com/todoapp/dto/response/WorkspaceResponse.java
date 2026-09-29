package com.todoapp.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record WorkspaceResponse(
        String id, String name, String ownerId, String currentUserRole,
        LocalDateTime createdAt, List<WorkspaceMemberResponse> members) {}
