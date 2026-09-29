package com.todoapp.repository;

import com.todoapp.entity.TaskCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskCommentRepository extends JpaRepository<TaskCommentEntity, String> {
    List<TaskCommentEntity> findByTaskIdOrderByCreatedAtAsc(String taskId);
    Optional<TaskCommentEntity> findByIdAndAuthorId(String id, String authorId);
}
