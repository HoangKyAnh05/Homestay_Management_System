package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.GeminiGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.GeminiGenerateResponse;

public interface GeminiWebService {
    GeminiGenerateResponse generate(GeminiGenerateRequest request);
}
