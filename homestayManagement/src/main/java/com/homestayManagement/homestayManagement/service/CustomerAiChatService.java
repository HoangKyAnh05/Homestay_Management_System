package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import org.springframework.security.core.Authentication;

import java.util.function.Consumer;

public interface CustomerAiChatService {
    CustomerAiChatResponse chat(CustomerAiChatRequest request, Authentication authentication);
    CustomerAiChatResponse chatStream(CustomerAiChatRequest request, Authentication authentication, Consumer<String> deltaConsumer);
}
