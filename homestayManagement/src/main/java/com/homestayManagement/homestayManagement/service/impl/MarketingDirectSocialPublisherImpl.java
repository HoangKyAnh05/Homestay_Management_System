package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.entity.MarketingPostMedia;
import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.SocialAccount;
import com.homestayManagement.homestayManagement.repository.MarketingPostMediaRepository;
import com.homestayManagement.homestayManagement.service.MarketingSocialPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Primary
@Service
public class MarketingDirectSocialPublisherImpl implements MarketingSocialPublisher {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final MarketingPostMediaRepository mediaRepository;
    private final String publicBaseUrl;

    public MarketingDirectSocialPublisherImpl(
            ObjectMapper objectMapper,
            MarketingPostMediaRepository mediaRepository,
            @Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.objectMapper = objectMapper;
        this.mediaRepository = mediaRepository;
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public PublishResult publish(MarketingPostChannel channel) {
        SocialAccount account = channel.getSocialAccount();
        if (account == null) {
            return failed("SOCIAL_ACCOUNT_REQUIRED", "Chưa gán page/tài khoản social để đăng bài.");
        }
        if (!hasText(account.getAccessTokenEncrypted())) {
            return failed("SOCIAL_TOKEN_REQUIRED", "Page chưa có access token. Hãy kết nối lại page social qua OAuth.");
        }
        return switch (normalize(account.getPlatform())) {
            case "FACEBOOK" -> publishFacebook(channel, account);
            default -> failed("PLATFORM_NOT_IMPLEMENTED", "Backend Spring Boot hiện mới hỗ trợ đăng trực tiếp Facebook Page. Nền tảng " + account.getPlatform() + " cần bổ sung API publish riêng.");
        };
    }

    private PublishResult publishFacebook(MarketingPostChannel channel, SocialAccount account) {
        if (!hasText(account.getExternalAccountId()) || "me".equalsIgnoreCase(account.getExternalAccountId())) {
            return failed("FACEBOOK_PAGE_ID_REQUIRED", "Facebook cần Page ID. Hãy kết nối Facebook Page và lưu page vào thư viện.");
        }
        String content = joinContent(channel.getContent(), channel.getHashtags());
        try {
            List<MarketingPostMedia> media = postMedia(channel);
            List<MarketingPostMedia> images = media.stream()
                    .filter(item -> !"VIDEO".equals(normalize(item.getMediaType())))
                    .toList();
            boolean hasVideo = media.stream().anyMatch(item -> "VIDEO".equals(normalize(item.getMediaType())));
            if (!hasVideo && images.size() > 1) {
                return publishFacebookMultiPhoto(channel, account, content, images);
            }
            HttpRequest request = facebookRequest(channel, account, content, media.stream().findFirst());
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return failed("FACEBOOK_HTTP_" + response.statusCode(), text(root.path("error"), "message", "Facebook Graph API trả lỗi."), response.body());
            }
            String postId = text(root, "id", null);
            String externalUrl = hasText(postId) ? "https://facebook.com/" + postId : account.getPageUrl();
            return new PublishResult(true, "PUBLISHED", null, null, null, null, postId, externalUrl, response.body(), null, null);
        } catch (IOException exception) {
            return failed("FACEBOOK_IO_ERROR", "Không thể gọi Facebook Graph API: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return failed("FACEBOOK_INTERRUPTED", "Tác vụ đăng Facebook bị gián đoạn.");
        } catch (RuntimeException exception) {
            return failed("FACEBOOK_CLIENT_ERROR", "Không thể đăng Facebook: " + exception.getMessage());
        }
    }

    private PublishResult publishFacebookMultiPhoto(MarketingPostChannel channel, SocialAccount account, String content, List<MarketingPostMedia> images) throws IOException, InterruptedException {
        List<String> mediaIds = new ArrayList<>();
        for (MarketingPostMedia media : images) {
            HttpRequest uploadRequest = unpublishedPhotoRequest(account, media);
            HttpResponse<String> uploadResponse = httpClient.send(uploadRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode uploadRoot = objectMapper.readTree(uploadResponse.body());
            if (uploadResponse.statusCode() < 200 || uploadResponse.statusCode() >= 300) {
                return failed("FACEBOOK_PHOTO_UPLOAD_HTTP_" + uploadResponse.statusCode(), text(uploadRoot.path("error"), "message", "Facebook Graph API trả lỗi khi upload ảnh."), uploadResponse.body());
            }
            String mediaId = text(uploadRoot, "id", null);
            if (!hasText(mediaId)) {
                return failed("FACEBOOK_PHOTO_ID_MISSING", "Facebook không trả về ID ảnh đã upload.", uploadResponse.body());
            }
            mediaIds.add(mediaId);
        }

        StringBuilder body = new StringBuilder("message=" + encode(content)
                + "&access_token=" + encode(decodeToken(account.getAccessTokenEncrypted())));
        for (int index = 0; index < mediaIds.size(); index++) {
            body.append("&attached_media[").append(index).append("]=")
                    .append(encode("{\"media_fbid\":\"" + mediaIds.get(index) + "\"}"));
        }
        HttpRequest feedRequest = HttpRequest.newBuilder(URI.create("https://graph.facebook.com/v19.0/" + encodePath(account.getExternalAccountId()) + "/feed"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
        HttpResponse<String> feedResponse = httpClient.send(feedRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        JsonNode feedRoot = objectMapper.readTree(feedResponse.body());
        if (feedResponse.statusCode() < 200 || feedResponse.statusCode() >= 300) {
            return failed("FACEBOOK_MULTI_PHOTO_HTTP_" + feedResponse.statusCode(), text(feedRoot.path("error"), "message", "Facebook Graph API trả lỗi khi đăng nhiều ảnh."), feedResponse.body());
        }
        String postId = text(feedRoot, "id", null);
        String externalUrl = hasText(postId) ? "https://facebook.com/" + postId : account.getPageUrl();
        return new PublishResult(true, "PUBLISHED", null, null, null, null, postId, externalUrl, feedResponse.body(), null, null);
    }

    private HttpRequest facebookRequest(MarketingPostChannel channel, SocialAccount account, String content, Optional<MarketingPostMedia> media) throws IOException {
        if (media.isPresent()) {
            MarketingPostMedia item = media.get();
            String mediaType = normalize(item.getMediaType());
            if ("VIDEO".equals(mediaType)) {
                return mediaRequest(account, content, item, "videos", "file_url");
            }
            return mediaRequest(account, content, item, "photos", "url");
        }
        String body = "message=" + encode(content)
                + "&access_token=" + encode(decodeToken(account.getAccessTokenEncrypted()));
        return HttpRequest.newBuilder(URI.create("https://graph.facebook.com/v19.0/" + encodePath(account.getExternalAccountId()) + "/feed"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
    }

    private HttpRequest mediaRequest(SocialAccount account, String content, MarketingPostMedia media, String edge, String urlField) throws IOException {
        String mediaUrl = media.getMediaUrl();
        Path localFile = localUploadFile(mediaUrl);
        URI uri = URI.create("https://graph.facebook.com/v19.0/" + encodePath(account.getExternalAccountId()) + "/" + edge);
        if (localFile != null && Files.exists(localFile)) {
            String boundary = "----HomeStayMarketing" + UUID.randomUUID().toString().replace("-", "");
            byte[] body = multipartBody(boundary, content, decodeToken(account.getAccessTokenEncrypted()), localFile);
            return HttpRequest.newBuilder(uri)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
        }
        String absoluteUrl = absoluteMediaUrl(mediaUrl);
        String body = "message=" + encode(content)
                + "&" + urlField + "=" + encode(absoluteUrl)
                + "&access_token=" + encode(decodeToken(account.getAccessTokenEncrypted()));
        return HttpRequest.newBuilder(uri)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
    }

    private List<MarketingPostMedia> postMedia(MarketingPostChannel channel) {
        if (channel.getPost() == null || channel.getPost().getId() == null) {
            return List.of();
        }
        return mediaRepository.findByPostIdOrderByDisplayOrderAsc(channel.getPost().getId());
    }

    private HttpRequest unpublishedPhotoRequest(SocialAccount account, MarketingPostMedia media) throws IOException {
        String mediaUrl = media.getMediaUrl();
        Path localFile = localUploadFile(mediaUrl);
        URI uri = URI.create("https://graph.facebook.com/v19.0/" + encodePath(account.getExternalAccountId()) + "/photos");
        if (localFile != null && Files.exists(localFile)) {
            String boundary = "----HomeStayMarketing" + UUID.randomUUID().toString().replace("-", "");
            byte[] body = multipartUnpublishedPhotoBody(boundary, decodeToken(account.getAccessTokenEncrypted()), localFile);
            return HttpRequest.newBuilder(uri)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
        }
        String body = "published=false"
                + "&url=" + encode(absoluteMediaUrl(mediaUrl))
                + "&access_token=" + encode(decodeToken(account.getAccessTokenEncrypted()));
        return HttpRequest.newBuilder(uri)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
    }

    private Path localUploadFile(String mediaUrl) {
        if (!hasText(mediaUrl) || !mediaUrl.startsWith("/uploads/")) {
            return null;
        }
        String relative = mediaUrl.substring(1).replace("/", java.io.File.separator);
        return Paths.get(relative).toAbsolutePath().normalize();
    }

    private String absoluteMediaUrl(String mediaUrl) {
        if (!hasText(mediaUrl)) {
            return "";
        }
        if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
            return mediaUrl;
        }
        return publicBaseUrl + (mediaUrl.startsWith("/") ? mediaUrl : "/" + mediaUrl);
    }

    private byte[] multipartBody(String boundary, String content, String accessToken, Path file) throws IOException {
        String filename = file.getFileName().toString();
        String contentType = Files.probeContentType(file);
        if (!hasText(contentType)) {
            contentType = "application/octet-stream";
        }
        byte[] fileBytes = Files.readAllBytes(file);
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        writePart(output, boundary, "message", content);
        writePart(output, boundary, "access_token", accessToken);
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"source\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(fileBytes);
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
        output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return output.toByteArray();
    }

    private byte[] multipartUnpublishedPhotoBody(String boundary, String accessToken, Path file) throws IOException {
        String filename = file.getFileName().toString();
        String contentType = Files.probeContentType(file);
        if (!hasText(contentType)) {
            contentType = "application/octet-stream";
        }
        byte[] fileBytes = Files.readAllBytes(file);
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        writePart(output, boundary, "published", "false");
        writePart(output, boundary, "access_token", accessToken);
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"source\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(fileBytes);
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
        output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return output.toByteArray();
    }

    private void writePart(java.io.ByteArrayOutputStream output, String boundary, String name, String value) throws IOException {
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(String.valueOf(value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private PublishResult failed(String code, String message) {
        return failed(code, message, null);
    }

    private PublishResult failed(String code, String message, String responsePayload) {
        return new PublishResult(false, "FAILED", null, null, null, null, null, null, responsePayload, code, message);
    }

    private String joinContent(String content, String hashtags) {
        if (!hasText(hashtags)) {
            return String.valueOf(content == null ? "" : content).trim();
        }
        return (String.valueOf(content == null ? "" : content).trim() + "\n\n" + hashtags.trim()).trim();
    }

    private String decodeToken(String encoded) {
        return new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() || !hasText(value.asText()) ? fallback : value.asText();
    }

    private String encode(String value) {
        return URLEncoder.encode(String.valueOf(value == null ? "" : value), StandardCharsets.UTF_8);
    }

    private String encodePath(String value) {
        return URLEncoder.encode(String.valueOf(value == null ? "" : value), StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private String trimTrailingSlash(String value) {
        return value == null ? "" : value.replaceAll("/+$", "");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
