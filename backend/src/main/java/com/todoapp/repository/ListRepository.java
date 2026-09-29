package com.todoapp.repository;

import com.todoapp.entity.ListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListRepository extends JpaRepository<ListEntity, String> {
    List<ListEntity> findByOwnerIdOrderByCreatedAtAsc(String ownerId);
    Optional<ListEntity> findByIdAndOwnerId(String id, String ownerId);
}
