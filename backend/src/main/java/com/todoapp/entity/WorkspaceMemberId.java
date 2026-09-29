package com.todoapp.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class WorkspaceMemberId implements Serializable {
    private String workspaceId;
    private String userId;
}
