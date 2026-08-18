package com.homestayManagement.homestayManagement.service.event;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailLine;
import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.service.CheckoutInvoiceEmailService;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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

    @Test
    void sendsStyledCheckoutInvoiceEmailWithVatAndLineItems() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        CheckoutInvoiceEmailService invoiceEmailService = mock(CheckoutInvoiceEmailService.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        when(invoiceEmailService.buildSnapshot(1L)).thenReturn(new CheckoutInvoiceEmailSnapshot(
                1L,
                "HÓA ĐƠN DỊCH VỤ LƯU TRÚ",
                "HD/HMS",
                "01HMS",
                "HD01",
                "Nguyễn Văn A",
                "Thạch Hòa, Thạch Thất, Hà Nội",
                "MST001",
                "Khách hàng",
                "guest@example.com",
                "Hà Nội",
                "BK_TEST",
                LocalDateTime.of(2026, 8, 18, 10, 30),
                "MST01",
                BigDecimal.valueOf(1_000_000),
                BigDecimal.valueOf(80_000),
                BigDecimal.ZERO,
                BigDecimal.valueOf(1_000_000),
                new BigDecimal("0.08"),
                BigDecimal.valueOf(80_000),
                BigDecimal.valueOf(1_080_000),
                List.of(
                        new CheckoutInvoiceEmailLine(
                                "Phòng",
                                "Phòng 101",
                                "Deluxe | 18/08/2026 14:00 - 19/08/2026 12:00 | Theo ngày",
                                1,
                                BigDecimal.valueOf(1_000_000),
                                BigDecimal.valueOf(1_000_000)
                        ),
                        new CheckoutInvoiceEmailLine(
                                "Dịch vụ phát sinh",
                                "Bữa sáng",
                                "Phòng 101",
                                2,
                                BigDecimal.valueOf(40_000),
                                BigDecimal.valueOf(80_000)
                        )
                )
        ));
        CheckoutInvoiceEmailListener listener = new CheckoutInvoiceEmailListener(
                mailSender,
                invoiceEmailService,
                "home@example.com"
        );

        listener.sendCheckoutInvoiceEmail(new CheckoutInvoiceEmailEvent(1L));

        verify(mailSender).send(message);
        String content = extractText(message);
        assertTrue(content.contains("<!doctype html>"));
        assertTrue(content.contains("HD01"));
        assertTrue(content.contains("MST001"));
        assertTrue(content.contains("MST01"));
        assertTrue(content.contains("Thuế GTGT 8%"));
        assertTrue(content.contains("Phòng 101"));
        assertTrue(content.contains("Bữa sáng"));
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
