package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.response.IdentityOcrResponse;
import com.homestayManagement.homestayManagement.service.IdentityOcrService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ViettelIdentityOcrServiceImpl implements IdentityOcrService {

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy")
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String endpoint;
    private final String token;
    private final long maxFileBytes;
    private final long timeoutSeconds;

    public ViettelIdentityOcrServiceImpl(
            ObjectMapper objectMapper,
            @Value("${identity.ocr.viettel.enabled:false}") boolean enabled,
            @Value("${identity.ocr.viettel.endpoint:https://viettelai.vn/ocr/id_card}") String endpoint,
            @Value("${identity.ocr.viettel.token:}") String token,
            @Value("${identity.ocr.viettel.timeout-seconds:20}") long timeoutSeconds,
            @Value("${identity.ocr.viettel.max-file-mb:8}") long maxFileMb
    ) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.endpoint = endpoint != null ? endpoint.trim() : "";
        this.token = token != null ? token.trim() : "";
        this.timeoutSeconds = Math.max(3, timeoutSeconds);
        this.maxFileBytes = Math.max(1, maxFileMb) * 1024 * 1024;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(this.timeoutSeconds))
                .build();
    }

    @Override
    public IdentityOcrResponse extractIdentity(MultipartFile imageFront, MultipartFile imageBack) {
        validateConfiguration();
        validateImage(imageFront, "ảnh mặt trước căn cước");
        validateImage(imageBack, "ảnh mặt sau căn cước");
        try {
            HttpRequest request = buildRequest(imageFront, imageBack);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException("Viettel AI OCR trả về lỗi HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            int code = root.path("code").asInt(-1);
            if (code != 1) {
                String message = firstNonBlank(
                        root.path("vi_message").asText(null),
                        root.path("en_message").asText(null),
                        root.path("message").asText(null),
                        "Viettel AI OCR không đọc được căn cước"
                );
                throw new IllegalArgumentException(message);
            }
            return parseIdentity(root);
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể đọc ảnh căn cước hoặc phản hồi OCR");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Quá trình OCR căn cước bị gián đoạn");
        }
    }

    private void validateConfiguration() {
        if (!enabled) {
            throw new IllegalArgumentException("Chưa bật cấu hình OCR căn cước. Vui lòng cấu hình identity.ocr.viettel.enabled=true");
        }
        if (endpoint.isBlank()) {
            throw new IllegalArgumentException("Chưa cấu hình endpoint Viettel AI OCR");
        }
        if (token.isBlank()) {
            throw new IllegalArgumentException("Chưa cấu hình token Viettel AI OCR");
        }
    }

    private void validateImage(MultipartFile image, String label) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn " + label);
        }
        if (image.getSize() > maxFileBytes) {
            throw new IllegalArgumentException(label + " vượt quá dung lượng cho phép");
        }
        String contentType = image.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Tệp tải lên phải là " + label);
        }
    }

    private HttpRequest buildRequest(MultipartFile imageFront, MultipartFile imageBack) throws IOException {
        String boundary = "----HomestayViettelOcrBoundary" + UUID.randomUUID();
        byte[] body = multipartBody(boundary, imageFront, imageBack);
        return HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("accept", "*/*")
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();
    }

    private byte[] multipartBody(String boundary, MultipartFile imageFront, MultipartFile imageBack) throws IOException {
        List<byte[]> chunks = new ArrayList<>();
        addFilePart(chunks, boundary, "image_front", imageFront, "cccd-front.jpg");
        addFilePart(chunks, boundary, "image_back", imageBack, "cccd-back.jpg");
        addTextPart(chunks, boundary, "token", token);
        chunks.add(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        int totalLength = chunks.stream().mapToInt(chunk -> chunk.length).sum();
        byte[] body = new byte[totalLength];
        int position = 0;
        for (byte[] chunk : chunks) {
            System.arraycopy(chunk, 0, body, position, chunk.length);
            position += chunk.length;
        }
        return body;
    }

    private void addFilePart(List<byte[]> chunks, String boundary, String name, MultipartFile image, String fallbackName) throws IOException {
        String fileName = image.getOriginalFilename() != null ? image.getOriginalFilename() : fallbackName;
        String contentType = image.getContentType() != null ? image.getContentType() : "image/jpeg";
        chunks.add(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        chunks.add(("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + fileName + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        chunks.add(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        chunks.add(image.getBytes());
        chunks.add("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private void addTextPart(List<byte[]> chunks, String boundary, String name, String value) {
        chunks.add(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        chunks.add(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        chunks.add(value.getBytes(StandardCharsets.UTF_8));
        chunks.add("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private IdentityOcrResponse parseIdentity(JsonNode root) throws IOException {
        JsonNode information = root.path("information");
        if (information.isTextual()) {
            information = objectMapper.readTree(information.asText());
        }
        if (information.isMissingNode() || information.isNull()) {
            throw new IllegalArgumentException("Viettel AI OCR không trả về thông tin căn cước");
        }
        JsonNode confidence = information.path("confidence");
        return new IdentityOcrResponse(
                text(information, "name"),
                onlyDigits(text(information, "id")),
                parseDate(text(information, "birthday")),
                normalizeGender(text(information, "sex")),
                firstNonBlank(text(information, "nationality"), "VIETNAM"),
                text(information, "address"),
                parseDate(text(information, "issue_date")),
                text(information, "issue_by"),
                firstNonBlank(text(information, "document"), text(information, "type")),
                parseConfidence(confidence)
        );
    }

    private String text(JsonNode node, String key) {
        JsonNode value = node.path(key);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText(null);
        return text != null && !text.isBlank() ? text.trim() : null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String onlyDigits(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        return digits.isBlank() ? null : digits;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private String normalizeGender(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("nam") || normalized.equals("male") || normalized.equals("m")) {
            return "MALE";
        }
        if (normalized.contains("nữ") || normalized.contains("nu") || normalized.equals("female") || normalized.equals("f")) {
            return "FEMALE";
        }
        return "OTHER";
    }

    private Double parseConfidence(JsonNode confidence) {
        if (confidence == null || confidence.isMissingNode() || confidence.isNull()) {
            return null;
        }
        if (confidence.isNumber()) {
            return confidence.asDouble();
        }
        JsonNode idConfidence = confidence.path("id");
        if (idConfidence.isNumber()) {
            return idConfidence.asDouble();
        }
        return null;
    }
}
