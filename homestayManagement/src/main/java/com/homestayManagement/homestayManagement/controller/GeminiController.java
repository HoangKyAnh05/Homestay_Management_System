package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.GeminiGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.GeminiGenerateResponse;
import com.homestayManagement.homestayManagement.service.GeminiWebService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

    private final GeminiWebService geminiWebService;

    public GeminiController(GeminiWebService geminiWebService) {
        this.geminiWebService = geminiWebService;
    }

    @PostMapping("/generate")
    public GeminiGenerateResponse generate(@Valid @RequestBody GeminiGenerateRequest request) {
        return geminiWebService.generate(request);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleGeminiError(RuntimeException ex) {
        return Map.of(
                "success", false,
                "error", ex.getMessage(),
                "message", ex.getMessage()
        );
    }
}
