package com.todoapp.repository;

import com.todoapp.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByTokenHashAndRevokedFalse(String tokenHash);

    List<RefreshTokenEntity> findByUserIdAndRevokedFalseOrderByCreatedAtDesc(String userId);

    Optional<RefreshTokenEntity> findByIdAndUserIdAndRevokedFalse(String id, String userId);
    void deleteByUserId(String userId);
}
