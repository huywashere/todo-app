package com.todoapp.service;

import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.entity.TaskEntity;
import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.security.CurrentUser;
import com.todoapp.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskServiceImpl unit tests")
class TaskServiceImplTest {

    @Mock TaskRepository taskRepository;
    @Mock ListRepository listRepository;
    @Mock CurrentUser currentUser;
    @Mock WorkspaceAccessService workspaceAccessService;
    @Mock ActivityService activityService;

    @InjectMocks TaskServiceImpl taskService;

    private static final String OWNER_ID = "user-abc";
    private static final String TASK_ID  = "task-xyz";

    private TaskEntity sampleTask() {
        return TaskEntity.builder()
                .id(TASK_ID)
                .ownerId(OWNER_ID)
                .title("Write unit tests")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .sortOrder(0)
                .subtasks(new ArrayList<>())
                .tags("")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @BeforeEach
    void setUp() {
        given(currentUser.id()).willReturn(OWNER_ID);
    }

    // ── getTasks ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTasks")
    class GetTasksTests {

        @Test
        @DisplayName("returns all non-deleted tasks for the current user")
        void returnsUserTasks() {
            given(taskRepository.findByOwnerIdAndDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc(OWNER_ID))
                    .willReturn(List.of(sampleTask()));

            List<TaskResponse> result = taskService.getTasks(null, null, null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo("Write unit tests");
        }

        @Test
        @DisplayName("returns trash tasks when listId is 'trash'")
        void returnsTrashTasks() {
            TaskEntity deleted = sampleTask();
            deleted.setDeletedAt(LocalDateTime.now());
            given(taskRepository.findByOwnerIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(OWNER_ID))
                    .willReturn(List.of(deleted));

            List<TaskResponse> result = taskService.getTasks("trash", null, null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("returns tasks filtered by listId")
        void returnsTasksByListId() {
            given(taskRepository.findByOwnerIdAndListIdAndDeletedAtIsNullOrderBySortOrderAsc(OWNER_ID, "list-1"))
                    .willReturn(List.of(sampleTask()));

            List<TaskResponse> result = taskService.getTasks("list-1", null, null, null);

            assertThat(result).hasSize(1);
        }
    }

    // ── getTaskById ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTaskById")
    class GetTaskByIdTests {

        @Test
        @DisplayName("returns task when found and owned by current user")
        void returnsTask() {
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(sampleTask()));

            TaskResponse result = taskService.getTaskById(TASK_ID);

            assertThat(result.getId()).isEqualTo(TASK_ID);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when task not found")
        void throwsWhenNotFound() {
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTaskById(TASK_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws when task belongs to a different owner")
        void throwsWhenWrongOwner() {
            TaskEntity other = sampleTask();
            other.setOwnerId("other-user");
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(other));

            assertThatThrownBy(() -> taskService.getTaskById(TASK_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── createTask ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTask")
    class CreateTaskTests {

        @Test
        @DisplayName("creates and returns a new task")
        void createsTask() {
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTitle("New task");
            request.setClientId("client-001");

            TaskEntity saved = sampleTask();
            saved.setTitle("New task");

            given(taskRepository.findByOwnerIdAndClientRequestId(OWNER_ID, "client-001"))
                    .willReturn(Optional.empty());
            given(taskRepository.save(any(TaskEntity.class))).willReturn(saved);

            TaskResponse result = taskService.createTask(request);

            assertThat(result.getTitle()).isEqualTo("New task");
            then(taskRepository).should().save(any(TaskEntity.class));
        }

        @Test
        @DisplayName("returns existing task on duplicate clientId (idempotency)")
        void returnsExistingOnDuplicateClientId() {
            CreateTaskRequest request = new CreateTaskRequest();
            request.setTitle("Duplicate");
            request.setClientId("client-001");

            given(taskRepository.findByOwnerIdAndClientRequestId(OWNER_ID, "client-001"))
                    .willReturn(Optional.of(sampleTask()));

            TaskResponse result = taskService.createTask(request);

            assertThat(result.getId()).isEqualTo(TASK_ID);
            then(taskRepository).should(never()).save(any());
        }
    }

    // ── deleteTask / restoreTask ─────────────────────────────────────────────

    @Nested
    @DisplayName("deleteTask and restoreTask")
    class DeleteRestoreTests {

        @Test
        @DisplayName("soft-deletes task by setting deletedAt")
        void softDeletesTask() {
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(sampleTask()));
            given(taskRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            taskService.deleteTask(TASK_ID);

            then(taskRepository).should().save(argThat(t -> t.getDeletedAt() != null));
        }

        @Test
        @DisplayName("restores a soft-deleted task")
        void restoresTask() {
            TaskEntity deleted = sampleTask();
            deleted.setDeletedAt(LocalDateTime.now());
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(deleted));
            given(taskRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            TaskResponse result = taskService.restoreTask(TASK_ID);

            assertThat(result.getDeletedAt()).isNull();
        }

        @Test
        @DisplayName("permanently deletes task from database")
        void permanentlyDeletesTask() {
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(sampleTask()));

            taskService.permanentlyDeleteTask(TASK_ID);

            then(taskRepository).should().delete(any(TaskEntity.class));
        }
    }

    // ── toggleTaskStatus ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("toggleTaskStatus")
    class ToggleStatusTests {

        @Test
        @DisplayName("marks a TODO task as COMPLETED")
        void completesTask() {
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(sampleTask()));
            given(taskRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            TaskResponse result = taskService.toggleTaskStatus(TASK_ID);

            assertThat(result.getStatus()).isEqualTo("completed");
        }

        @Test
        @DisplayName("reverts a COMPLETED task back to TODO")
        void revertsCompletedTask() {
            TaskEntity completed = sampleTask();
            completed.setStatus(TaskStatus.COMPLETED);
            given(taskRepository.findById(TASK_ID)).willReturn(Optional.of(completed));
            given(taskRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            TaskResponse result = taskService.toggleTaskStatus(TASK_ID);

            assertThat(result.getStatus()).isEqualTo("todo");
        }
    }
}
