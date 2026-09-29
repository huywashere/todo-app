package com.todoapp.repository;

import com.todoapp.entity.WorkspaceMemberEntity;
import com.todoapp.entity.WorkspaceMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMemberEntity, WorkspaceMemberId> {
    List<WorkspaceMemberEntity> findByUserIdOrderByJoinedAtAsc(String userId);
    List<WorkspaceMemberEntity> findByWorkspaceIdOrderByJoinedAtAsc(String workspaceId);
    Optional<WorkspaceMemberEntity> findByWorkspaceIdAndUserId(String workspaceId, String userId);
    boolean existsByWorkspaceIdAndUserId(String workspaceId, String userId);
}
