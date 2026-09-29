package com.todoapp.repository;

import com.todoapp.entity.WorkspaceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, String> {
    List<WorkspaceEntity> findByOwnerIdOrderByCreatedAtAsc(String ownerId);
}
