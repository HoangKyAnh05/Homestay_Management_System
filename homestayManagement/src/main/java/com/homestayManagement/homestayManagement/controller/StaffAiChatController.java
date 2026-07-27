package com.homestayManagement.homestayManagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import com.homestayManagement.homestayManagement.service.CustomerAiRateLimiter;
import com.homestayManagement.homestayManagement.service.CustomerAiUnavailableException;
import com.homestayManagement.homestayManagement.service.StaffAiChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/staff")
public class StaffAiChatController {

    private final StaffAiChatService staffAiChatService;
    private final CustomerAiRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public StaffAiChatController(
            StaffAiChatService staffAiChatService,
            CustomerAiRateLimiter rateLimiter,
            ObjectMapper objectMapper
    ) {
        this.staffAiChatService = staffAiChatService;
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/chat")
    public CustomerAiChatResponse chat(
            @Valid @RequestBody CustomerAiChatRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        String rateLimitKey = authentication != null && authentication.isAuthenticated()
                ? "staff:" + authentication.getName()
                : "ip:" + httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire(rateLimitKey)) {
            throw new StaffAiRateLimitException();
        }
        return staffAiChatService.chat(request, authentication);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
    public StreamingResponseBody chatStream(
            @Valid @RequestBody CustomerAiChatRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        String rateLimitKey = authentication != null && authentication.isAuthenticated()
                ? "staff:" + authentication.getName()
                : "ip:" + httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire(rateLimitKey)) {
            throw new StaffAiRateLimitException();
        }
        return outputStream -> {
            try {
                writeEvent(outputStream, "meta", Map.of("sessionId", request.sessionId()));
                CustomerAiChatResponse response = staffAiChatService.chatStream(request, authentication, delta -> {
                    try {
                        writeEvent(outputStream, "delta", Map.of("text", delta));
                    } catch (IOException exception) {
                        throw new StaffAiStreamWriteException(exception);
                    }
                });
                writeEvent(outputStream, "done", Map.of(
                        "answer", response.answer(),
                        "sessionId", response.sessionId(),
                        "authenticated", response.authenticated(),
                        "respondedAt", response.respondedAt()
                ));
            } catch (StaffAiStreamWriteException exception) {
                throw exception;
            } catch (Exception exception) {
                writeEvent(outputStream, "error", Map.of("message", safeMessage(exception)));
            }
        };
    }

    @ExceptionHandler(CustomerAiUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleUnavailable(CustomerAiUnavailableException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(StaffAiRateLimitException.class)
    public ResponseEntity<Map<String, String>> handleRateLimit() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", "Ban gui cau hoi qua nhanh. Vui long thu lai sau it phut."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Du lieu tro chuyen khong hop le");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    private static final class StaffAiRateLimitException extends RuntimeException {
    }

    private void writeEvent(OutputStream outputStream, String type, Map<String, ?> payload) throws IOException {
        objectMapper.writeValue(outputStream, Map.of("type", type, "payload", payload));
        outputStream.write('\n');
        outputStream.flush();
    }

    private String safeMessage(Exception exception) {
        return exception.getMessage() == null ? "AI nội bộ đang tạm thời không khả dụng." : exception.getMessage();
    }

    private static final class StaffAiStreamWriteException extends RuntimeException {
        private StaffAiStreamWriteException(Throwable cause) {
            super(cause);
        }
    }
}
