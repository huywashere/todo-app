package com.todoapp.repository;

import com.todoapp.entity.TaskAttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachmentEntity, String> {
    List<TaskAttachmentEntity> findByTaskIdOrderByCreatedAtAsc(String taskId);
}
