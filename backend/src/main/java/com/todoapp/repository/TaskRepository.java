package com.todoapp.repository;

import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, String> {

    List<TaskEntity> findAllByOrderBySortOrderAscCreatedAtDesc();

    List<TaskEntity> findByListIdOrderBySortOrderAsc(String listId);

    List<TaskEntity> findByStatusOrderBySortOrderAsc(TaskStatus status);

    @Query("SELECT t FROM TaskEntity t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY t.sortOrder ASC")
    List<TaskEntity> searchTasks(@Param("query") String query);

    long countByStatus(TaskStatus status);
}
