package com.homestayManagement.homestayManagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import com.homestayManagement.homestayManagement.service.CustomerAiChatService;
import com.homestayManagement.homestayManagement.service.CustomerAiRateLimiter;
import com.homestayManagement.homestayManagement.service.CustomerAiUnavailableException;
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
@RequestMapping("/api/ai/customer")
public class CustomerAiChatController {

    private final CustomerAiChatService customerAiChatService;
    private final CustomerAiRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public CustomerAiChatController(
            CustomerAiChatService customerAiChatService,
            CustomerAiRateLimiter rateLimiter,
            ObjectMapper objectMapper
    ) {
        this.customerAiChatService = customerAiChatService;
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
                ? "account:" + authentication.getName()
                : "ip:" + httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire(rateLimitKey)) {
            throw new CustomerAiRateLimitException();
        }
        return customerAiChatService.chat(request, authentication);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
    public StreamingResponseBody chatStream(
            @Valid @RequestBody CustomerAiChatRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        String rateLimitKey = authentication != null && authentication.isAuthenticated()
                ? "account:" + authentication.getName()
                : "ip:" + httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire(rateLimitKey)) {
            throw new CustomerAiRateLimitException();
        }
        return outputStream -> {
            try {
                writeEvent(outputStream, "meta", Map.of("sessionId", request.sessionId()));
                CustomerAiChatResponse response = customerAiChatService.chatStream(request, authentication, delta -> {
                    try {
                        writeEvent(outputStream, "delta", Map.of("text", delta));
                    } catch (IOException exception) {
                        throw new CustomerAiStreamWriteException(exception);
                    }
                });
                writeEvent(outputStream, "done", Map.of(
                        "answer", response.answer(),
                        "sessionId", response.sessionId(),
                        "authenticated", response.authenticated(),
                        "respondedAt", response.respondedAt()
                ));
            } catch (CustomerAiStreamWriteException exception) {
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

    @ExceptionHandler(CustomerAiRateLimitException.class)
    public ResponseEntity<Map<String, String>> handleRateLimit() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", "Bạn gửi câu hỏi quá nhanh. Vui lòng thử lại sau ít phút."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu trò chuyện không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    private static final class CustomerAiRateLimitException extends RuntimeException {
    }

    private void writeEvent(OutputStream outputStream, String type, Map<String, ?> payload) throws IOException {
        objectMapper.writeValue(outputStream, Map.of("type", type, "payload", payload));
        outputStream.write('\n');
        outputStream.flush();
    }

    private String safeMessage(Exception exception) {
        return exception.getMessage() == null ? "AI chat đang tạm thời không khả dụng." : exception.getMessage();
    }

    private static final class CustomerAiStreamWriteException extends RuntimeException {
        private CustomerAiStreamWriteException(Throwable cause) {
            super(cause);
        }
    }
}
