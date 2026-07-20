package com.homestayManagement.homestayManagement.service.event;

import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class StayAccessEmailListenerTest {

    @Test
    void sendsResponsiveHtmlEmailWithRoomAndActivationButton() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        StayAccessEmailListener listener = new StayAccessEmailListener(
                mailSender,
                "home@example.com",
                "https://stay.example.com"
        );

        listener.sendStayAccessEmail(new StayAccessEmailEvent(
                "guest@example.com",
                "Nguyễn Văn A",
                "101",
                "BK_TEST",
                LocalDateTime.of(2026, 7, 7, 12, 0),
                "activation-token"
        ));

        verify(mailSender).send(message);
        String content = extractText(message);

        assertTrue(content.contains("<!doctype html>"));
        assertTrue(content.contains("Phòng 101"));
        assertTrue(content.contains("/stay/activate?token=activation-token"));
        assertTrue(content.contains("Đặt mật khẩu và kích hoạt tài khoản"));
    }

    private String extractText(Part part) throws Exception {
        Object content = part.getContent();
        if (content instanceof String text) {
            return text;
        }
        if (content instanceof Multipart multipart) {
            StringBuilder result = new StringBuilder();
            for (int index = 0; index < multipart.getCount(); index++) {
                result.append(extractText(multipart.getBodyPart(index)));
            }
            return result.toString();
        }
        return "";
    }
}
