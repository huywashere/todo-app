package com.todoapp.service;

import com.todoapp.dto.request.CreateSubTaskRequest;
import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.request.UpdateTaskRequest;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.dto.response.TaskStatsResponse;
import com.todoapp.entity.TaskStatus;

import java.util.List;
import com.todoapp.dto.request.BulkTaskRequest;
import com.todoapp.dto.response.PageResponse;

public interface TaskService {

    List<TaskResponse> getTasks(String listId, String query, TaskStatus status, String workspaceId);

    PageResponse<TaskResponse> getTaskPage(int page, int size, String workspaceId);

    List<TaskResponse> bulkUpdate(BulkTaskRequest request);

    String exportCalendar(String workspaceId);

    TaskResponse getTaskById(String id);

    TaskResponse createTask(CreateTaskRequest request);

    TaskResponse updateTask(String id, UpdateTaskRequest request);

    TaskResponse toggleTaskStatus(String id);

    void deleteTask(String id);

    TaskResponse restoreTask(String id);

    void permanentlyDeleteTask(String id);

    TaskResponse addSubTask(String taskId, CreateSubTaskRequest request);

    TaskResponse toggleSubTask(String taskId, String subTaskId);

    TaskResponse deleteSubTask(String taskId, String subTaskId);

    TaskStatsResponse getTaskStats();
}
