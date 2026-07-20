package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.service.impl.MarketingSocialAccountConnectorImpl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/marketing/social/oauth")
public class MarketingSocialOAuthCallbackController {

    private final MarketingSocialAccountConnectorImpl connector;

    public MarketingSocialOAuthCallbackController(MarketingSocialAccountConnectorImpl connector) {
        this.connector = connector;
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam String state,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error
    ) {
        String redirectUrl = connector.completeOAuthCallback(state, code, error);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(redirectUrl));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
