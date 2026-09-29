package com.todoapp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InviteMemberRequest(
        @NotBlank @Email String email,
        @Pattern(regexp = "ADMIN|MEMBER|VIEWER") String role) {}
