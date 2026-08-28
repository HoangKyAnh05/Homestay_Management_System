package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;
import com.homestayManagement.homestayManagement.service.InvoiceStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class InvoiceStorageServiceImpl implements InvoiceStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(InvoiceStorageServiceImpl.class);
    private static final DateTimeFormatter FILE_TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final Path storageDirectory;

    public InvoiceStorageServiceImpl(
            @Value("${app.invoice.storage-dir:invoive}") String storageDir
    ) {
        this.storageDirectory = Paths.get(storageDir).toAbsolutePath().normalize();
        initStorageDirectory();
    }

    private void initStorageDirectory() {
        try {
            if (!Files.exists(storageDirectory)) {
                Files.createDirectories(storageDirectory);
                LOGGER.info("Đã tạo thư mục lưu trữ hóa đơn: {}", storageDirectory);
            }
        } catch (IOException exception) {
            LOGGER.error("Không thể tạo thư mục lưu trữ hóa đơn tại: {}", storageDirectory, exception);
        }
    }

    @Override
    public Path saveInvoiceHtml(CheckoutInvoiceEmailSnapshot invoice, String htmlContent) {
        if (invoice == null || htmlContent == null || htmlContent.isBlank()) {
            LOGGER.warn("Bỏ qua lưu hóa đơn vì dữ liệu hóa đơn hoặc nội dung HTML rỗng.");
            return null;
        }

        try {
            if (!Files.exists(storageDirectory)) {
                Files.createDirectories(storageDirectory);
            }

            String invoiceNumber = sanitizeFileName(invoice.invoiceNumber() != null ? invoice.invoiceNumber() : "HD" + invoice.invoiceId());
            String bookingCode = sanitizeFileName(invoice.bookingCode() != null ? invoice.bookingCode() : "BK");
            String timestamp = LocalDateTime.now().format(FILE_TIMESTAMP_FORMAT);
            String fileName = String.format("invoice_%s_%s_%s.html", invoiceNumber, bookingCode, timestamp);

            Path targetPath = storageDirectory.resolve(fileName).normalize();

            // Chống lỗ hổng Path Traversal
            if (!targetPath.startsWith(storageDirectory)) {
                throw new SecurityException("Đường dẫn lưu file không an toàn: " + targetPath);
            }

            Files.writeString(
                    targetPath,
                    htmlContent,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE
            );

            LOGGER.info("Đã lưu hóa đơn điện tử thành công: {}", targetPath);
            return targetPath;
        } catch (IOException exception) {
            LOGGER.error("Lỗi khi ghi file hóa đơn điện tử cho invoice {}: {}", invoice.invoiceId(), exception.getMessage(), exception);
            return null;
        }
    }

    @Override
    public Path getStorageDirectory() {
        return storageDirectory;
    }

    private String sanitizeFileName(String input) {
        if (input == null || input.isBlank()) {
            return "unknown";
        }
        return input.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }
}
