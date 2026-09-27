package com.todoapp.controller;

import com.todoapp.dto.request.CreateSubTaskRequest;
import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.request.UpdateTaskRequest;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.dto.response.TaskStatsResponse;
import com.todoapp.entity.TaskStatus;
import com.todoapp.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks API", description = "Quản lý công việc, tiến độ và checklist subtasks")
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "Lấy danh sách công việc", description = "Hỗ trợ lọc theo listId, trạng thái hoặc tìm kiếm từ khóa")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
            @RequestParam(required = false) String listId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) TaskStatus status) {
        List<TaskResponse> tasks = taskService.getTasks(listId, query, status);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một công việc")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable String id) {
        TaskResponse task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success(task));
    }

    @PostMapping
    @Operation(summary = "Tạo công việc mới")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskResponse created = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo công việc thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin công việc")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable String id,
            @RequestBody UpdateTaskRequest request) {
        TaskResponse updated = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Đảo trạng thái hoàn thành công việc (Hoàn thành / Chưa hoàn thành)")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleStatus(@PathVariable String id) {
        TaskResponse updated = taskService.toggleTaskStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Đổi trạng thái thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa công việc")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa công việc thành công", null));
    }

    @PostMapping("/{id}/subtasks")
    @Operation(summary = "Thêm mục kiểm tra con (Subtask)")
    public ResponseEntity<ApiResponse<TaskResponse>> addSubTask(
            @PathVariable String id,
            @Valid @RequestBody CreateSubTaskRequest request) {
        TaskResponse updated = taskService.addSubTask(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mục con thành công", updated));
    }

    @PatchMapping("/{id}/subtasks/{subTaskId}/toggle")
    @Operation(summary = "Đảo trạng thái hoàn thành của mục con")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleSubTask(
            @PathVariable String id,
            @PathVariable String subTaskId) {
        TaskResponse updated = taskService.toggleSubTask(id, subTaskId);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{id}/subtasks/{subTaskId}")
    @Operation(summary = "Xóa mục con khỏi công việc")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteSubTask(
            @PathVariable String id,
            @PathVariable String subTaskId) {
        TaskResponse updated = taskService.deleteSubTask(id, subTaskId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa mục con", updated));
    }

    @GetMapping("/stats")
    @Operation(summary = "Lấy thống kê tổng quan các công việc")
    public ResponseEntity<ApiResponse<TaskStatsResponse>> getStats() {
        TaskStatsResponse stats = taskService.getTaskStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
