package com.todoapp.repository;

import com.todoapp.entity.AccountTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountTokenRepository extends JpaRepository<AccountTokenEntity, String> {
    Optional<AccountTokenEntity> findByTokenHashAndTokenTypeAndUsedAtIsNull(String tokenHash, String tokenType);
    void deleteByUserIdAndTokenType(String userId, String tokenType);
}
