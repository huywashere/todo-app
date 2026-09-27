package com.todoapp.controller;

import com.todoapp.dto.request.CreateListRequest;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.ListResponse;
import com.todoapp.service.ListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lists")
@RequiredArgsConstructor
@Tag(name = "Lists API", description = "Quản lý danh mục và thư mục công việc")
public class ListController {

    private final ListService listService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách danh mục công việc")
    public ResponseEntity<ApiResponse<List<ListResponse>>> getAllLists() {
        List<ListResponse> lists = listService.getAllLists();
        return ResponseEntity.ok(ApiResponse.success(lists));
    }

    @PostMapping
    @Operation(summary = "Tạo danh mục công việc mới")
    public ResponseEntity<ApiResponse<ListResponse>> createList(@Valid @RequestBody CreateListRequest request) {
        ListResponse created = listService.createList(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục thành công", created));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa một danh mục")
    public ResponseEntity<ApiResponse<Void>> deleteList(@PathVariable String id) {
        listService.deleteList(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }
}
