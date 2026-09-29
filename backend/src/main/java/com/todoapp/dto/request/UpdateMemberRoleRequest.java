package com.todoapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateMemberRoleRequest(@NotBlank @Pattern(regexp = "ADMIN|MEMBER|VIEWER") String role) {}
