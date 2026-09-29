package com.todoapp.repository;

import com.todoapp.entity.TaskActivityEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskActivityRepository extends JpaRepository<TaskActivityEntity, String> {
    List<TaskActivityEntity> findByWorkspaceIdOrderByCreatedAtDesc(String workspaceId, Pageable pageable);
    List<TaskActivityEntity> findByTaskIdOrderByCreatedAtDesc(String taskId, Pageable pageable);
}
