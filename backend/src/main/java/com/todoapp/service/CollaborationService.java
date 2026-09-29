package com.todoapp.service;

import com.todoapp.dto.response.AttachmentResponse;
import com.todoapp.dto.response.CommentResponse;
import com.todoapp.entity.TaskAttachmentEntity;
import com.todoapp.entity.TaskCommentEntity;
import com.todoapp.entity.TaskEntity;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.TaskAttachmentRepository;
import com.todoapp.repository.TaskCommentRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.repository.UserRepository;
import com.todoapp.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CollaborationService {
    private static final Set<String> BLOCKED_TYPES = Set.of("application/x-msdownload", "application/x-sh", "application/java-archive");
    private final TaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final TaskAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final WorkspaceAccessService accessService;
    private final ActivityService activityService;
    private final ObjectStorage objectStorage;
    private final CurrentUser currentUser;
    @Value("${app.storage.max-file-size-bytes:10485760}") private long maxFileSize;

    @Transactional(readOnly = true)
    public List<CommentResponse> comments(String taskId) {
        TaskEntity task = task(taskId, false);
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId()).stream().map(this::commentResponse).toList();
    }

    public CommentResponse addComment(String taskId, String body) {
        TaskEntity task = task(taskId, true);
        TaskCommentEntity saved = commentRepository.save(TaskCommentEntity.builder()
                .id("comment-" + UUID.randomUUID()).taskId(taskId).authorId(currentUser.id()).body(body.trim()).build());
        activityService.record(task.getWorkspaceId(), taskId, "COMMENT_ADDED", body.trim().substring(0, Math.min(120, body.trim().length())));
        return commentResponse(saved);
    }

    public void deleteComment(String taskId, String commentId) {
        TaskEntity task = task(taskId, true);
        TaskCommentEntity comment = commentRepository.findByIdAndAuthorId(commentId, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận hoặc bạn không phải tác giả"));
        commentRepository.delete(comment);
        activityService.record(task.getWorkspaceId(), taskId, "COMMENT_DELETED", commentId);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> attachments(String taskId) {
        task(taskId, false);
        return attachmentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream().map(this::attachmentResponse).toList();
    }

    public AttachmentResponse upload(String taskId, MultipartFile file) {
        TaskEntity task = task(taskId, true);
        if (file.isEmpty()) throw new IllegalArgumentException("Tệp không được để trống");
        if (file.getSize() > maxFileSize) throw new IllegalArgumentException("Tệp vượt quá giới hạn 10 MB");
        String type = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (BLOCKED_TYPES.contains(type)) throw new IllegalArgumentException("Loại tệp không được phép");
        String cleanName = file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._ -]", "_");
        String id = "att-" + UUID.randomUUID();
        String key = task.getWorkspaceId() + "/" + taskId + "/" + id;
        try { objectStorage.put(key, file.getBytes(), type); }
        catch (IOException exception) { throw new IllegalStateException("Không thể đọc tệp tải lên", exception); }
        TaskAttachmentEntity saved = attachmentRepository.save(TaskAttachmentEntity.builder().id(id).taskId(taskId)
                .uploaderId(currentUser.id()).fileName(cleanName).contentType(type).sizeBytes(file.getSize()).storageKey(key).build());
        activityService.record(task.getWorkspaceId(), taskId, "ATTACHMENT_ADDED", cleanName);
        return attachmentResponse(saved);
    }

    @Transactional(readOnly = true)
    public DownloadedAttachment download(String taskId, String attachmentId) {
        task(taskId, false);
        TaskAttachmentEntity value = attachmentRepository.findById(attachmentId)
                .filter(item -> taskId.equals(item.getTaskId()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tệp đính kèm"));
        ObjectStorage.StoredObject object = objectStorage.get(value.getStorageKey());
        return new DownloadedAttachment(value.getFileName(), object.contentType(), object.bytes());
    }

    public void deleteAttachment(String taskId, String attachmentId) {
        TaskEntity task = task(taskId, true);
        TaskAttachmentEntity value = attachmentRepository.findById(attachmentId)
                .filter(item -> taskId.equals(item.getTaskId()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tệp đính kèm"));
        objectStorage.delete(value.getStorageKey());
        attachmentRepository.delete(value);
        activityService.record(task.getWorkspaceId(), taskId, "ATTACHMENT_DELETED", value.getFileName());
    }

    private TaskEntity task(String taskId, boolean edit) {
        TaskEntity task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc"));
        if (edit) accessService.requireTaskEditor(task); else accessService.requireTaskViewer(task);
        return task;
    }

    private CommentResponse commentResponse(TaskCommentEntity value) {
        String name = userRepository.findById(value.getAuthorId()).map(user -> user.getDisplayName()).orElse("Deleted user");
        return new CommentResponse(value.getId(), value.getTaskId(), value.getAuthorId(), name, value.getBody(), value.getCreatedAt(), value.getUpdatedAt());
    }

    private AttachmentResponse attachmentResponse(TaskAttachmentEntity value) {
        return new AttachmentResponse(value.getId(), value.getTaskId(), value.getFileName(), value.getContentType(), value.getSizeBytes(), value.getCreatedAt());
    }

    public record DownloadedAttachment(String fileName, String contentType, byte[] bytes) {}
}
