package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import com.homestayManagement.homestayManagement.service.GiveawayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/giveaway")
public class PublicGiveawayController {

    private final GiveawayService giveawayService;

    public PublicGiveawayController(GiveawayService giveawayService) {
        this.giveawayService = giveawayService;
    }

    @GetMapping("/config")
    public GiveawayConfigResponse getConfig() {
        return giveawayService.getConfig();
    }

    @PostMapping("/register-spin")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> registerSpin(
            @Valid @RequestBody GiveawayRegisterSpinRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String clientIp = httpServletRequest.getRemoteAddr();
        String forwarded = httpServletRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            clientIp = forwarded.split(",")[0].trim();
        }
        String spinToken = giveawayService.registerSpin(request, clientIp);
        return Map.of("spinToken", spinToken);
    }

    @PostMapping("/spin")
    public GiveawaySpinResponse spin(@Valid @RequestBody GiveawaySpinRequest request) {
        return giveawayService.spin(request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequest(IllegalArgumentException ex) {
        return Map.of("message", ex.getMessage());
    }
}
