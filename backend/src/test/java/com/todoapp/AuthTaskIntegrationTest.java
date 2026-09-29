package com.todoapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.todoapp.service.NotificationService;

import static org.hamcrest.Matchers.hasItem;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthTaskIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired NotificationService notificationService;

    @Test
    void authenticationOwnershipAndSoftDeleteFlow() throws Exception {
        String ownerToken = register("Owner", "owner@example.com");

        String createBody = mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"task-12345678","title":"Ship portfolio","priority":"HIGH","listId":"inbox"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Ship portfolio"))
                .andReturn().getResponse().getContentAsString();
        String taskId = objectMapper.readTree(createBody).path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"task-12345678","title":"Duplicate retry","priority":"HIGH","listId":"inbox"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(taskId))
                .andExpect(jsonPath("$.data.title").value("Ship portfolio"));

        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(put("/api/v1/tasks/{id}", taskId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Ship portfolio v2\",\"version\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").value(1));
        mockMvc.perform(put("/api/v1/tasks/{id}", taskId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Stale edit\",\"version\":0}"))
                .andExpect(status().isConflict());

        String otherToken = register("Other", "other@example.com");
        mockMvc.perform(get("/api/v1/tasks/{id}", taskId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/tasks/{id}", taskId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/tasks?listId=trash").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].deletedAt").isNotEmpty());
        mockMvc.perform(patch("/api/v1/tasks/{id}/restore", taskId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deletedAt").isEmpty());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        register("First", "duplicate@example.com");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"Second","email":"duplicate@example.com","password":"SecurePass123"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void recurrenceReminderFocusAndAccountFlow() throws Exception {
        String token = register("Productive User", "productivity@example.com");

        String created = mockMvc.perform(post("/api/v1/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientId":"task-recurring-1234","title":"Daily review","priority":"MEDIUM","listId":"inbox","dueDate":"2026-09-29","recurrenceRule":"DAILY","reminderAt":"2020-01-01T08:00:00"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.recurrenceSeriesId").value("task-recurring-1234"))
                .andReturn().getResponse().getContentAsString();
        String taskId = objectMapper.readTree(created).path("data").path("id").asText();

        notificationService.dispatchDueReminders();
        mockMvc.perform(get("/api/v1/notifications").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].taskId").value(taskId));

        mockMvc.perform(patch("/api/v1/tasks/{id}/toggle", taskId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.status == 'TODO')].dueDate").value(hasItem("2026-09-30")));

        mockMvc.perform(post("/api/v1/focus-sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\":\"" + taskId + "\",\"durationSeconds\":1500}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.durationSeconds").value(1500));

        String verification = mockMvc.perform(post("/api/v1/auth/email-verification/request")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String verificationToken = objectMapper.readTree(verification).path("data").path("developmentToken").asText();
        mockMvc.perform(post("/api/v1/auth/email-verification/confirm")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TokenPayload(verificationToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailVerified").value(true));

        mockMvc.perform(patch("/api/v1/auth/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Updated User\",\"timezone\":\"Asia/Ho_Chi_Minh\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.displayName").value("Updated User"));

        String recovery = mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"productivity@example.com\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String recoveryToken = objectMapper.readTree(recovery).path("data").path("developmentToken").asText();
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + recoveryToken + "\",\"newPassword\":\"NewSecurePass123\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"productivity@example.com\",\"password\":\"NewSecurePass123\"}"))
                .andExpect(status().isOk());
    }

    private String register(String name, String email) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterPayload(name, email, "SecurePass123"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.path("data").path("accessToken").asText();
    }

    private record RegisterPayload(String displayName, String email, String password) {}
    private record TokenPayload(String token) {}
}
