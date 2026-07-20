package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import com.homestayManagement.homestayManagement.service.CustomerAiRateLimiter;
import com.homestayManagement.homestayManagement.service.CustomerAiUnavailableException;
import com.homestayManagement.homestayManagement.service.StaffAiChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/staff")
public class StaffAiChatController {

    private final StaffAiChatService staffAiChatService;
    private final CustomerAiRateLimiter rateLimiter;

    public StaffAiChatController(
            StaffAiChatService staffAiChatService,
            CustomerAiRateLimiter rateLimiter
    ) {
        this.staffAiChatService = staffAiChatService;
        this.rateLimiter = rateLimiter;
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
}
