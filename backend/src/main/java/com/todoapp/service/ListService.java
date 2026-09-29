package com.todoapp.service;

import com.todoapp.dto.request.CreateListRequest;
import com.todoapp.dto.response.ListResponse;
import java.util.List;

public interface ListService {

    List<ListResponse> getAllLists(String workspaceId);

    ListResponse createList(CreateListRequest request);

    void deleteList(String id);
}
