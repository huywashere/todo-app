package com.todoapp.controller;

import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.NotificationResponse;
import com.todoapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list() {
        return ApiResponse.success(notificationService.list());
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable String id) {
        return ApiResponse.success(notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead();
        return ApiResponse.success("Đã đọc tất cả thông báo", null);
    }
}
