package com.todoapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailDeliveryService implements EmailDeliveryService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.email.enabled:false}")
    private boolean enabled;

    @Value("${app.email.from:no-reply@focusflow.local}")
    private String from;

    @Value("${app.frontend-url:http://localhost:8080}")
    private String frontendUrl;

    @Override
    public void sendVerification(String recipient, String displayName, String rawToken) {
        send(recipient, "Verify your FocusFlow email",
                "Hello " + displayName + ",\n\nVerify your email: " + frontendUrl + "/?verify=" + rawToken
                        + "\n\nThis link expires in 30 minutes.");
    }

    @Override
    public void sendPasswordReset(String recipient, String displayName, String rawToken) {
        send(recipient, "Reset your FocusFlow password",
                "Hello " + displayName + ",\n\nReset your password: " + frontendUrl + "/?reset=" + rawToken
                        + "\n\nThis link expires in 30 minutes. Ignore this email if you did not request it.");
    }

    @Override
    public void sendTaskReminder(String recipient, String taskTitle, String dueAt) {
        send(recipient, "FocusFlow reminder: " + taskTitle,
                "Your task \"" + taskTitle + "\" is due" + (dueAt == null ? "." : " at " + dueAt + "."));
    }

    private void send(String recipient, String subject, String body) {
        if (!enabled) {
            log.info("Email delivery disabled; skipped '{}' for {}", subject, recipient);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) throw new IllegalStateException("EMAIL_ENABLED=true nhưng SMTP chưa được cấu hình");
        mailSender.send(message);
    }
}
