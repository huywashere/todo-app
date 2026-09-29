package com.todoapp.service;

import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.WorkspaceMemberEntity;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.WorkspaceMemberRepository;
import com.todoapp.repository.WorkspaceRepository;
import com.todoapp.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkspaceAccessService {
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final CurrentUser currentUser;

    public WorkspaceMemberEntity requireMember(String workspaceId) {
        workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy workspace"));
        return memberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Bạn không có quyền truy cập workspace này"));
    }

    public WorkspaceMemberEntity requireEditor(String workspaceId) {
        WorkspaceMemberEntity member = requireMember(workspaceId);
        if ("VIEWER".equals(member.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Workspace đang ở chế độ chỉ xem");
        }
        return member;
    }

    public void requireAdmin(String workspaceId) {
        WorkspaceMemberEntity member = requireMember(workspaceId);
        if (!("OWNER".equals(member.getRole()) || "ADMIN".equals(member.getRole()))) {
            throw new org.springframework.security.access.AccessDeniedException("Cần quyền quản trị workspace");
        }
    }

    public void requireTaskViewer(TaskEntity task) {
        if (task.getWorkspaceId() != null) requireMember(task.getWorkspaceId());
        else if (!currentUser.id().equals(task.getOwnerId())) throw new ResourceNotFoundException("Không tìm thấy công việc");
    }

    public void requireTaskEditor(TaskEntity task) {
        if (task.getWorkspaceId() != null) requireEditor(task.getWorkspaceId());
        else if (!currentUser.id().equals(task.getOwnerId())) throw new ResourceNotFoundException("Không tìm thấy công việc");
    }
}
