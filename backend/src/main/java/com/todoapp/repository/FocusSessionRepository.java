package com.todoapp.repository;

import com.todoapp.entity.FocusSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSessionEntity, String> {
    List<FocusSessionEntity> findTop100ByOwnerIdOrderByCompletedAtDesc(String ownerId);
}
