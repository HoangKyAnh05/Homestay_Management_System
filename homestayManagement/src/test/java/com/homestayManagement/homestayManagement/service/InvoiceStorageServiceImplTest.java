package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.service.impl.InvoiceStorageServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class InvoiceStorageServiceImplTest {

    @TempDir
    Path tempDir;

    private InvoiceStorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        storageService = new InvoiceStorageServiceImpl(tempDir.toString());
    }

    @Test
    void savesHtmlInvoiceFileSuccessfully() throws IOException {
        CheckoutInvoiceEmailSnapshot snapshot = new CheckoutInvoiceEmailSnapshot(
                10L,
                "Hóa đơn thuê homestay",
                "HD/HMS",
                "01HMS",
                "HD10",
                "HomeStay Nhà Ba Gian",
                "Thạch Thất, Hà Nội",
                "MST001",
                "0989149456",
                "https://homestay.example.com",
                "00000119485",
                "TPBANK",
                "Nguyễn Văn A",
                "nguyenvana@gmail.com",
                "Hà Nội",
                "BK12345",
                LocalDateTime.of(2026, 8, 21, 15, 30),
                "MST01",
                BigDecimal.valueOf(1_000_000),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.valueOf(1_000_000),
                new BigDecimal("0.08"),
                BigDecimal.valueOf(80_000),
                BigDecimal.valueOf(1_080_000),
                List.of()
        );

        String sampleHtml = "<!doctype html><html><body><h1>Hóa đơn HD10</h1></body></html>";

        Path savedPath = storageService.saveInvoiceHtml(snapshot, sampleHtml);

        assertNotNull(savedPath);
        assertTrue(Files.exists(savedPath));
        assertTrue(savedPath.getFileName().toString().startsWith("invoice_HD10_BK12345_"));
        assertTrue(savedPath.getFileName().toString().endsWith(".html"));

        String savedContent = Files.readString(savedPath);
        assertEquals(sampleHtml, savedContent);
    }

    @Test
    void handlesNullInputsGracefully() {
        assertNull(storageService.saveInvoiceHtml(null, "content"));
        assertNull(storageService.saveInvoiceHtml(new CheckoutInvoiceEmailSnapshot(
                1L, "", "", "", "HD01", "", "", "", "", "", "", "", "", "", "", "BK",
                LocalDateTime.now(), "", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of()
        ), null));
        assertNull(storageService.saveInvoiceHtml(new CheckoutInvoiceEmailSnapshot(
                1L, "", "", "", "HD01", "", "", "", "", "", "", "", "", "", "", "BK",
                LocalDateTime.now(), "", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of()
        ), "   "));
    }

    @Test
    void returnsStorageDirectory() {
        assertEquals(tempDir.toAbsolutePath().normalize(), storageService.getStorageDirectory());
    }
}
