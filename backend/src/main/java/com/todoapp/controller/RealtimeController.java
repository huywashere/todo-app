package com.todoapp.controller;

import com.todoapp.security.CurrentUser;
import com.todoapp.service.RealtimeEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class RealtimeController {
    private final RealtimeEventService realtime;
    private final CurrentUser currentUser;

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() { return realtime.subscribe(currentUser.id()); }
}
