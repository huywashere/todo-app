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

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, String> {

    List<TaskEntity> findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(String ownerId);

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

    long countByOwnerIdAndStatusAndDeletedAtIsNull(String ownerId, TaskStatus status);

    List<TaskEntity> findTop100ByDeletedAtIsNullAndStatusNotAndReminderAtLessThanEqualAndReminderSentFalseOrderByReminderAtAsc(
            TaskStatus status, LocalDateTime reminderAt);
}
