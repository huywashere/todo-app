package com.todoapp.service;

import com.todoapp.dto.request.CreateSubTaskRequest;
import com.todoapp.dto.request.CreateTaskRequest;
import com.todoapp.dto.request.UpdateTaskRequest;
import com.todoapp.dto.response.TaskResponse;
import com.todoapp.dto.response.TaskStatsResponse;
import com.todoapp.entity.TaskStatus;

import java.util.List;

public interface TaskService {

    List<TaskResponse> getTasks(String listId, String query, TaskStatus status);

    TaskResponse getTaskById(String id);

    TaskResponse createTask(CreateTaskRequest request);

    TaskResponse updateTask(String id, UpdateTaskRequest request);

    TaskResponse toggleTaskStatus(String id);

    void deleteTask(String id);

    TaskResponse addSubTask(String taskId, CreateSubTaskRequest request);

    TaskResponse toggleSubTask(String taskId, String subTaskId);

    TaskResponse deleteSubTask(String taskId, String subTaskId);

    TaskStatsResponse getTaskStats();
}
