package com.todoapp.service;

import com.todoapp.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class RealtimeEventService {
    private final WorkspaceMemberRepository memberRepository;
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(30L * 60L * 1000L);
        emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(ignored -> remove(userId, emitter));
        send(userId, "connected", Map.of("at", Instant.now().toString()));
        return emitter;
    }

    public void workspace(String workspaceId, String event, Object data) {
        memberRepository.findByWorkspaceIdOrderByJoinedAtAsc(workspaceId)
                .forEach(member -> send(member.getUserId(), event, data));
    }

    public void user(String userId, String event, Object data) { send(userId, event, data); }

    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.keySet().forEach(userId -> send(userId, "heartbeat", Map.of("at", Instant.now().toString())));
    }

    private void send(String userId, String event, Object data) {
        var userEmitters = emitters.get(userId);
        if (userEmitters == null) return;
        userEmitters.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event().name(event).data(data).reconnectTime(3000));
                return false;
            } catch (IOException | IllegalStateException exception) {
                emitter.complete();
                return true;
            }
        });
        if (userEmitters.isEmpty()) emitters.remove(userId);
    }

    private void remove(String userId, SseEmitter emitter) {
        var values = emitters.get(userId);
        if (values != null) {
            values.remove(emitter);
            if (values.isEmpty()) emitters.remove(userId);
        }
    }
}
