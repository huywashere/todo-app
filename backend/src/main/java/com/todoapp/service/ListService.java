package com.todoapp.service;

import com.todoapp.dto.request.CreateListRequest;
import com.todoapp.dto.response.ListResponse;
import java.util.List;

public interface ListService {

    List<ListResponse> getAllLists();

    ListResponse createList(CreateListRequest request);

    void deleteList(String id);
}
