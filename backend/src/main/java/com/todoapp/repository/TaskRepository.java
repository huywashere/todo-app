package com.todoapp.repository;

import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, String> {

    List<TaskEntity> findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(String ownerId);

    List<TaskEntity> findByWorkspaceIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(String workspaceId);

    List<TaskEntity> findByWorkspaceIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(String workspaceId);

    List<TaskEntity> findByWorkspaceIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(String workspaceId, String listId);

    List<TaskEntity> findByWorkspaceIdAndStatusAndDeletedAtIsNullOrderBySortOrderAsc(String workspaceId, TaskStatus status);

    Page<TaskEntity> findByOwnerIdAndDeletedAtIsNull(String ownerId, Pageable pageable);

    Page<TaskEntity> findByWorkspaceIdAndDeletedAtIsNull(String workspaceId, Pageable pageable);

    List<TaskEntity> findByOwnerIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(String ownerId, String listId);

    List<TaskEntity> findByOwnerIdAndStatusAndDeletedAtIsNullOrderBySortOrderAsc(String ownerId, TaskStatus status);

    List<TaskEntity> findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(String ownerId);

    Optional<TaskEntity> findByIdAndOwnerId(String id, String ownerId);

    Optional<TaskEntity> findByOwnerIdAndClientRequestId(String ownerId, String clientRequestId);

    @Query("SELECT t FROM TaskEntity t WHERE t.ownerId = :ownerId AND t.deletedAt IS NULL AND (" +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY t.sortOrder ASC")
    List<TaskEntity> searchTasks(@Param("ownerId") String ownerId, @Param("query") String query);

    @Query("SELECT t FROM TaskEntity t WHERE t.workspaceId = :workspaceId AND t.deletedAt IS NULL AND (" +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY t.sortOrder ASC")
    List<TaskEntity> searchWorkspaceTasks(@Param("workspaceId") String workspaceId, @Param("query") String query);

    long countByOwnerIdAndStatusAndDeletedAtIsNull(String ownerId, TaskStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<TaskEntity> findTop100ByDeletedAtIsNullAndStatusNotAndReminderAtLessThanEqualAndReminderSentFalseOrderByReminderAtAsc(
            TaskStatus status, LocalDateTime reminderAt);
}
