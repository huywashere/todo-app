package com.todoapp.controller;

import com.todoapp.dto.request.CreateCommentRequest;
import com.todoapp.dto.response.ApiResponse;
import com.todoapp.dto.response.AttachmentResponse;
import com.todoapp.dto.response.CommentResponse;
import com.todoapp.service.CollaborationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks/{taskId}")
@RequiredArgsConstructor
public class CollaborationController {
    private final CollaborationService service;

    @GetMapping("/comments")
    public ApiResponse<List<CommentResponse>> comments(@PathVariable String taskId) {
        return ApiResponse.success(service.comments(taskId));
    }

    @PostMapping("/comments")
    public ApiResponse<CommentResponse> addComment(@PathVariable String taskId, @Valid @RequestBody CreateCommentRequest request) {
        return ApiResponse.success("Đã thêm bình luận", service.addComment(taskId, request.body()));
    }

    @DeleteMapping("/comments/{commentId}")
    public ApiResponse<Void> deleteComment(@PathVariable String taskId, @PathVariable String commentId) {
        service.deleteComment(taskId, commentId);
        return ApiResponse.success("Đã xóa bình luận", null);
    }

    @GetMapping("/attachments")
    public ApiResponse<List<AttachmentResponse>> attachments(@PathVariable String taskId) {
        return ApiResponse.success(service.attachments(taskId));
    }

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AttachmentResponse> upload(@PathVariable String taskId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.success("Đã tải tệp lên", service.upload(taskId, file));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<ByteArrayResource> download(@PathVariable String taskId, @PathVariable String attachmentId) {
        CollaborationService.DownloadedAttachment file = service.download(taskId, attachmentId);
        String encoded = java.net.URLEncoder.encode(file.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType() == null ? "application/octet-stream" : file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentLength(file.bytes().length)
                .body(new ByteArrayResource(file.bytes()));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ApiResponse<Void> deleteAttachment(@PathVariable String taskId, @PathVariable String attachmentId) {
        service.deleteAttachment(taskId, attachmentId);
        return ApiResponse.success("Đã xóa tệp", null);
    }
}
