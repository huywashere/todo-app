package com.todoapp.controller;

import com.todoapp.dto.request.CreateWorkspaceRequest;
import com.todoapp.dto.request.InviteMemberRequest;
import com.todoapp.dto.request.UpdateMemberRoleRequest;
import com.todoapp.dto.response.ActivityResponse;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.WorkspaceResponse;
import com.todoapp.service.ActivityService;
import com.todoapp.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {
    private final WorkspaceService workspaceService;
    private final ActivityService activityService;

    @GetMapping public ApiResponse<List<WorkspaceResponse>> list() { return ApiResponse.success(workspaceService.list()); }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> create(@Valid @RequestBody CreateWorkspaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workspaceService.create(request.name())));
    }

    @PostMapping("/{workspaceId}/members")
    public ApiResponse<WorkspaceResponse> invite(@PathVariable String workspaceId, @Valid @RequestBody InviteMemberRequest request) {
        return ApiResponse.success(workspaceService.invite(workspaceId, request));
    }

    @PatchMapping("/{workspaceId}/members/{userId}")
    public ApiResponse<WorkspaceResponse> updateRole(@PathVariable String workspaceId, @PathVariable String userId,
                                                     @Valid @RequestBody UpdateMemberRoleRequest request) {
        return ApiResponse.success(workspaceService.updateRole(workspaceId, userId, request.role()));
    }

    @DeleteMapping("/{workspaceId}/members/{userId}")
    public ApiResponse<Void> remove(@PathVariable String workspaceId, @PathVariable String userId) {
        workspaceService.removeMember(workspaceId, userId);
        return ApiResponse.success("Đã xóa thành viên", null);
    }

    @GetMapping("/{workspaceId}/activities")
    public ApiResponse<List<ActivityResponse>> activities(@PathVariable String workspaceId, @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.success(activityService.forWorkspace(workspaceId, limit));
    }
}
