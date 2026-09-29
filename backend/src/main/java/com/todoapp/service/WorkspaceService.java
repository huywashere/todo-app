package com.todoapp.service;

import com.todoapp.dto.request.InviteMemberRequest;
import com.todoapp.dto.response.WorkspaceMemberResponse;
import com.todoapp.dto.response.WorkspaceResponse;
import com.todoapp.entity.ListEntity;
import com.todoapp.entity.UserEntity;
import com.todoapp.entity.WorkspaceEntity;
import com.todoapp.entity.WorkspaceMemberEntity;
import com.todoapp.entity.WorkspaceMemberId;
import com.todoapp.exception.ConflictException;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.UserRepository;
import com.todoapp.repository.WorkspaceMemberRepository;
import com.todoapp.repository.WorkspaceRepository;
import com.todoapp.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceService {
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ListRepository listRepository;
    private final CurrentUser currentUser;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> list() {
        return memberRepository.findByUserIdOrderByJoinedAtAsc(currentUser.id()).stream()
                .map(member -> workspaceRepository.findById(member.getWorkspaceId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(this::toResponse).toList();
    }

    public WorkspaceResponse create(String name) {
        String id = "ws-" + UUID.randomUUID();
        WorkspaceEntity workspace = workspaceRepository.save(WorkspaceEntity.builder()
                .id(id).name(name.trim()).ownerId(currentUser.id()).build());
        memberRepository.save(WorkspaceMemberEntity.builder()
                .workspaceId(id).userId(currentUser.id()).role("OWNER").build());
        listRepository.save(ListEntity.builder().id("list-" + UUID.randomUUID()).ownerId(currentUser.id())
                .workspaceId(id).name("Inbox").emoji("📥").color("#4772FA").hasDot(true).build());
        return toResponse(workspace);
    }

    public WorkspaceResponse invite(String workspaceId, InviteMemberRequest request) {
        accessService.requireAdmin(workspaceId);
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng cần đăng ký trước khi được mời"));
        if (memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
            throw new ConflictException("Người dùng đã thuộc workspace");
        }
        memberRepository.save(WorkspaceMemberEntity.builder().workspaceId(workspaceId).userId(user.getId())
                .role(request.role() == null ? "MEMBER" : request.role()).build());
        return toResponse(workspaceRepository.findById(workspaceId).orElseThrow());
    }

    public WorkspaceResponse updateRole(String workspaceId, String userId, String role) {
        accessService.requireAdmin(workspaceId);
        WorkspaceEntity workspace = workspaceRepository.findById(workspaceId).orElseThrow();
        if (workspace.getOwnerId().equals(userId)) throw new ConflictException("Không thể thay đổi vai trò owner");
        WorkspaceMemberEntity member = memberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên"));
        member.setRole(role);
        memberRepository.save(member);
        return toResponse(workspace);
    }

    public void removeMember(String workspaceId, String userId) {
        accessService.requireAdmin(workspaceId);
        WorkspaceEntity workspace = workspaceRepository.findById(workspaceId).orElseThrow();
        if (workspace.getOwnerId().equals(userId)) throw new ConflictException("Không thể xóa owner khỏi workspace");
        memberRepository.deleteById(new WorkspaceMemberId(workspaceId, userId));
    }

    private WorkspaceResponse toResponse(WorkspaceEntity workspace) {
        WorkspaceMemberEntity current = memberRepository.findByWorkspaceIdAndUserId(workspace.getId(), currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Bạn không có quyền truy cập workspace"));
        List<WorkspaceMemberResponse> members = memberRepository.findByWorkspaceIdOrderByJoinedAtAsc(workspace.getId()).stream()
                .map(member -> {
                    UserEntity user = userRepository.findById(member.getUserId()).orElse(null);
                    return new WorkspaceMemberResponse(member.getUserId(), user == null ? "deleted" : user.getEmail(),
                            user == null ? "Deleted user" : user.getDisplayName(), member.getRole(), member.getJoinedAt());
                }).toList();
        return new WorkspaceResponse(workspace.getId(), workspace.getName(), workspace.getOwnerId(), current.getRole(), workspace.getCreatedAt(), members);
    }
}
