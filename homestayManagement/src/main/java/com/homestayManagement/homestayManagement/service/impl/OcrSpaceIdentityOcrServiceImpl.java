package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.response.IdentityOcrResponse;
import com.homestayManagement.homestayManagement.service.IdentityOcrService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
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
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Primary
public class OcrSpaceIdentityOcrServiceImpl implements IdentityOcrService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OcrSpaceIdentityOcrServiceImpl.class);

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy")
    );

    private static final Pattern CCCD_NUMBER_PATTERN = Pattern.compile("\\b(\\d{12})\\b");
    private static final Pattern DOB_PATTERN = Pattern.compile("(?i)(?:Ngày sinh|Date of birth|Sinh ngày|sinh)[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})");
    private static final Pattern GENERIC_DATE_PATTERN = Pattern.compile("\\b(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})\\b");
    private static final Pattern ISSUE_DATE_VN_PATTERN = Pattern.compile("(?i)ngày\\s*(\\d{1,2})\\s*tháng\\s*(\\d{1,2})\\s*năm\\s*(\\d{4})");

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String endpoint;
    private final String apiKey;
    private final String openAiApiKey;
    private final String openAiBaseUrl;
    private final long maxFileBytes;
    private final long timeoutSeconds;

    public OcrSpaceIdentityOcrServiceImpl(
            ObjectMapper objectMapper,
            @Value("${identity.ocr.enabled:true}") boolean enabled,
            @Value("${identity.ocr.ocr-space.endpoint:https://api.ocr.space/parse/image}") String endpoint,
            @Value("${identity.ocr.ocr-space.api-key:K84216463288957}") String apiKey,
            @Value("${marketing.ai.api-key:}") String openAiApiKey,
            @Value("${marketing.ai.base-url:https://api.openai.com/v1}") String openAiBaseUrl,
            @Value("${identity.ocr.timeout-seconds:25}") long timeoutSeconds,
            @Value("${identity.ocr.max-file-mb:10}") long maxFileMb
    ) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.endpoint = endpoint != null ? endpoint.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.openAiApiKey = openAiApiKey != null ? openAiApiKey.trim() : "";
        this.openAiBaseUrl = openAiBaseUrl != null && !openAiBaseUrl.isBlank() ? openAiBaseUrl.trim() : "https://api.openai.com/v1";
        this.timeoutSeconds = Math.max(5, timeoutSeconds);
        this.maxFileBytes = Math.max(1, maxFileMb) * 1024 * 1024;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(this.timeoutSeconds))
                .build();
    }

    @Override
    public IdentityOcrResponse extractIdentity(MultipartFile imageFront, MultipartFile imageBack) {
        validateConfiguration();
        validateImage(imageFront, "ảnh mặt trước căn cước");

        String ocrSpaceError = null;
        // 1. Thử nhận diện bằng OCR.Space
        try {
            String frontText = performOcrSpace(imageFront);
            String backText = imageBack != null && !imageBack.isEmpty() ? performOcrSpace(imageBack) : "";

            if (!frontText.isBlank()) {
                IdentityOcrResponse res = parseIdentityFromOcrText(frontText, backText);
                if (res.identityDocumentNumber() != null || res.fullName() != null) {
                    return res;
                }
            }
        } catch (Exception e) {
            ocrSpaceError = e.getMessage();
            LOGGER.warn("OCR.Space lỗi: {}. Thử fallback qua Vision AI...", e.getMessage());
        }

        // 2. Fallback sang OpenAI Vision AI (GPT-4o-mini) nếu có cấu hình và khả dụng
        if (openAiApiKey != null && !openAiApiKey.isBlank()) {
            try {
                return performVisionAiOcr(imageFront, imageBack);
            } catch (Exception e) {
                LOGGER.warn("Vision AI OCR không khả dụng ({})", e.getMessage());
            }
        }

        if (ocrSpaceError != null && !ocrSpaceError.isBlank()) {
            throw new IllegalArgumentException(ocrSpaceError);
        }
        throw new IllegalArgumentException("Không thể nhận diện thông tin trên thẻ CCCD. Vui lòng kiểm tra ảnh chụp rõ nét, đủ ánh sáng và không bị lóa!");
    }

    private String performOcrSpace(MultipartFile file) throws IOException, InterruptedException {
        validateImage(file, "tệp ảnh căn cước");

        String boundary = "----OcrSpaceBoundary" + UUID.randomUUID().toString().replace("-", "");
        byte[] body = buildMultipartBody(file, boundary);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint.isBlank() ? "https://api.ocr.space/parse/image" : endpoint))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .header("apikey", apiKey.isBlank() ? "K84216463288957" : apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalArgumentException("OCR.Space HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String errorMsg = extractOcrSpaceError(root);
        if (errorMsg != null) {
            throw new IllegalArgumentException(errorMsg);
        }

        JsonNode parsedResults = root.path("ParsedResults");
        if (parsedResults.isArray() && !parsedResults.isEmpty()) {
            return parsedResults.get(0).path("ParsedText").asText("");
        }
        return "";
    }

    private String extractOcrSpaceError(JsonNode root) {
        if (root.path("IsErroredOnProcessing").asBoolean(false)) {
            JsonNode errNode = root.path("ErrorMessage");
            if (errNode.isArray() && !errNode.isEmpty()) {
                List<String> list = new ArrayList<>();
                for (JsonNode item : errNode) {
                    if (item.isTextual() && !item.asText().isBlank()) {
                        list.add(item.asText().trim());
                    }
                }
                if (!list.isEmpty()) {
                    return String.join("; ", list);
                }
            } else if (errNode.isTextual() && !errNode.asText().isBlank()) {
                return errNode.asText().trim();
            }
            return "Lỗi xử lý OCR.Space";
        }
        return null;
    }

    private byte[] buildMultipartBody(MultipartFile file, String boundary) throws IOException {
        String crlf = "\r\n";
        String twoHyphens = "--";
        StringBuilder sb = new StringBuilder();

        // 1. apikey
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"apikey\"").append(crlf).append(crlf);
        sb.append(apiKey.isBlank() ? "K84216463288957" : apiKey).append(crlf);

        // 2. language
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"language\"").append(crlf).append(crlf);
        sb.append("vnm").append(crlf);

        // 3. isOverlayRequired
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"isOverlayRequired\"").append(crlf).append(crlf);
        sb.append("false").append(crlf);

        // 4. OCREngine = 2
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"OCREngine\"").append(crlf).append(crlf);
        sb.append("2").append(crlf);

        // 5. scale
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"scale\"").append(crlf).append(crlf);
        sb.append("true").append(crlf);

        // 6. detectOrientation
        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"detectOrientation\"").append(crlf).append(crlf);
        sb.append("true").append(crlf);

        // 7. file
        String filename = file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank()
                ? file.getOriginalFilename()
                : "cccd.jpg";
        String contentType = file.getContentType() != null && !file.getContentType().isBlank()
                ? file.getContentType()
                : "image/jpeg";

        sb.append(twoHyphens).append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(filename).append("\"").append(crlf);
        sb.append("Content-Type: ").append(contentType).append(crlf).append(crlf);

        byte[] headerBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] fileBytes = file.getBytes();
        byte[] footerBytes = (crlf + twoHyphens + boundary + twoHyphens + crlf).getBytes(StandardCharsets.UTF_8);

        byte[] all = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, all, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, all, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, all, headerBytes.length + fileBytes.length, footerBytes.length);
        return all;
    }

    private IdentityOcrResponse performVisionAiOcr(MultipartFile imageFront, MultipartFile imageBack) throws IOException, InterruptedException {
        String frontBase64 = Base64.getEncoder().encodeToString(imageFront.getBytes());
        String frontMime = imageFront.getContentType() != null ? imageFront.getContentType() : "image/jpeg";

        List<Map<String, Object>> contentList = new ArrayList<>();
        contentList.add(Map.of("type", "text", "text", "Hãy đọc ảnh căn cước công dân (CCCD) Việt Nam sau và trích xuất thông tin dưới dạng duy nhất một JSON: {\"fullName\":\"...\",\"identityDocumentNumber\":\"...\",\"dateOfBirth\":\"YYYY-MM-DD\",\"gender\":\"MALE hoặc FEMALE\",\"nationality\":\"VIETNAM\",\"address\":\"...\",\"issueDate\":\"YYYY-MM-DD\",\"issuePlace\":\"...\"}. Chỉ trả về JSON không kèm markdown."));
        contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", "data:" + frontMime + ";base64," + frontBase64)));

        if (imageBack != null && !imageBack.isEmpty()) {
            String backBase64 = Base64.getEncoder().encodeToString(imageBack.getBytes());
            String backMime = imageBack.getContentType() != null ? imageBack.getContentType() : "image/jpeg";
            contentList.add(Map.of("type", "image_url", "image_url", Map.of("url", "data:" + backMime + ";base64," + backBase64)));
        }

        Map<String, Object> payload = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                        Map.of("role", "system", "content", "Bạn là chuyên gia OCR căn cước công dân Việt Nam. Trả về đúng 1 đối tượng JSON chứa fullName, identityDocumentNumber, dateOfBirth (YYYY-MM-DD), gender (MALE/FEMALE), nationality, address, issueDate (YYYY-MM-DD), issuePlace."),
                        Map.of("role", "user", "content", contentList)
                ),
                "temperature", 0.1
        );

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String chatUrl = openAiBaseUrl.endsWith("/") ? openAiBaseUrl + "chat/completions" : openAiBaseUrl + "/chat/completions";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(chatUrl))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openAiApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            throw new IllegalArgumentException("Vision AI HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String text = root.path("choices").path(0).path("message").path("content").asText("");
        text = text.replaceAll("```json", "").replaceAll("```", "").trim();

        JsonNode infoNode = objectMapper.readTree(text);
        return new IdentityOcrResponse(
                textOrNull(infoNode, "fullName"),
                textOrNull(infoNode, "identityDocumentNumber"),
                parseDate(textOrNull(infoNode, "dateOfBirth")),
                normalizeGender(textOrNull(infoNode, "gender")),
                firstNonBlank(textOrNull(infoNode, "nationality"), "VIETNAM"),
                textOrNull(infoNode, "address"),
                parseDate(textOrNull(infoNode, "issueDate")),
                firstNonBlank(textOrNull(infoNode, "issuePlace"), "Cục Cảnh sát QLHC về TTXH"),
                "CCCD",
                0.99
        );
    }

    private String textOrNull(JsonNode node, String key) {
        JsonNode v = node.path(key);
        return (v.isMissingNode() || v.isNull()) ? null : v.asText(null);
    }

    private IdentityOcrResponse parseIdentityFromOcrText(String frontText, String backText) {
        String combined = frontText + "\n" + backText;
        String[] lines = frontText.split("[\\r\\n]+");

        String idNumber = extractIdNumber(combined);
        String name = extractFullName(lines, combined);
        LocalDate dob = extractDob(combined);
        String gender = extractGender(combined);
        String address = extractAddress(lines, combined);
        LocalDate issueDate = extractIssueDate(backText.isBlank() ? frontText : backText);
        String issuePlace = "Cục Cảnh sát QLHC về TTXH";

        if ((name == null || name.isBlank()) && (idNumber == null || idNumber.isBlank())) {
            throw new IllegalArgumentException("Ảnh tải lên không đúng định dạng thẻ CCCD hoặc hình ảnh không rõ nét. Vui lòng tải lại ảnh chụp rõ ràng mặt trước và mặt sau thẻ Căn cước công dân!");
        }

        return new IdentityOcrResponse(
                name,
                idNumber,
                dob,
                gender,
                "VIETNAM",
                address,
                issueDate,
                issuePlace,
                "CCCD",
                0.95
        );
    }

    private String extractIdNumber(String text) {
        Matcher matcher = CCCD_NUMBER_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String extractFullName(String[] lines, String fullText) {
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.matches("(?i).*(?:Họ và tên|Full name|Họ tên|Ho va ten).*")) {
                String clean = line.replaceAll("(?i).*(?:Họ và tên|Full name|Họ tên|Ho va ten)[:\\s]*", "").trim();
                if (!clean.isBlank() && clean.length() > 2) {
                    return clean.toUpperCase(Locale.ROOT);
                }
                if (i + 1 < lines.length) {
                    String nextLine = lines[i + 1].trim();
                    if (!nextLine.isBlank() && !nextLine.matches("(?i).*(?:Ngày sinh|Date of birth|Giới tính).*")) {
                        return nextLine.toUpperCase(Locale.ROOT);
                    }
                }
            }
        }
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\\s]{5,35}$")
                    && !trimmed.contains("CỘNG HÒA") && !trimmed.contains("VIỆT NAM") && !trimmed.contains("CĂN CƯỚC")) {
                return trimmed;
            }
        }
        return null;
    }

    private LocalDate extractDob(String text) {
        Matcher matcher = DOB_PATTERN.matcher(text);
        if (matcher.find()) {
            return parseDate(matcher.group(1));
        }
        Matcher genericMatcher = GENERIC_DATE_PATTERN.matcher(text);
        if (genericMatcher.find()) {
            return parseDate(genericMatcher.group(1));
        }
        return null;
    }

    private String extractGender(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("nam") || lower.contains("male")) {
            return "MALE";
        }
        if (lower.contains("nữ") || lower.contains("nu") || lower.contains("female")) {
            return "FEMALE";
        }
        return "OTHER";
    }

    private String extractAddress(String[] lines, String fullText) {
        StringBuilder address = new StringBuilder();
        boolean collecting = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("(?i).*(?:Nơi thường trú|Place of residence|Nơi cư trú|Thường trú).*")) {
                collecting = true;
                String clean = trimmed.replaceAll("(?i).*(?:Nơi thường trú|Place of residence|Nơi cư trú|Thường trú)[:\\s]*", "").trim();
                if (!clean.isBlank()) {
                    address.append(clean);
                }
                continue;
            }
            if (collecting) {
                if (trimmed.matches("(?i).*(?:Có giá trị đến|Date of expiry|Quê quán|Dân tộc).*") || trimmed.isBlank()) {
                    break;
                }
                if (!address.isEmpty()) address.append(", ");
                address.append(trimmed);
            }
        }
        return address.isEmpty() ? null : address.toString();
    }

    private LocalDate extractIssueDate(String text) {
        Matcher vnMatcher = ISSUE_DATE_VN_PATTERN.matcher(text);
        if (vnMatcher.find()) {
            try {
                int day = Integer.parseInt(vnMatcher.group(1));
                int month = Integer.parseInt(vnMatcher.group(2));
                int year = Integer.parseInt(vnMatcher.group(3));
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {
            }
        }
        Matcher genericMatcher = GENERIC_DATE_PATTERN.matcher(text);
        LocalDate lastDate = null;
        while (genericMatcher.find()) {
            lastDate = parseDate(genericMatcher.group(1));
        }
        return lastDate;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
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
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("nam") || normalized.equals("male") || normalized.equals("m")) return "MALE";
        if (normalized.contains("nữ") || normalized.contains("nu") || normalized.equals("female") || normalized.equals("f")) return "FEMALE";
        return "OTHER";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private void validateConfiguration() {
        if (!enabled) {
            throw new IllegalArgumentException("Chưa bật cấu hình OCR căn cước");
        }
        if ((apiKey == null || apiKey.isBlank()) && (openAiApiKey == null || openAiApiKey.isBlank())) {
            throw new IllegalArgumentException("Chưa cấu hình API Key OCR.Space hoặc Vision AI");
        }
    }

    private void validateImage(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn " + label);
        }
        if (file.getSize() > maxFileBytes) {
            throw new IllegalArgumentException("Kích thước " + label + " vượt quá dung lượng cho phép (" + (maxFileBytes / (1024 * 1024)) + "MB)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Tệp tải lên phải là " + label);
        }
    }
}
