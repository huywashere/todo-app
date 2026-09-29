package com.todoapp.service;

public interface EmailDeliveryService {
    void sendVerification(String recipient, String displayName, String rawToken);
    void sendPasswordReset(String recipient, String displayName, String rawToken);
    void sendTaskReminder(String recipient, String taskTitle, String dueAt);
}
