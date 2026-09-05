package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.HumanizedContentGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.HumanizedContentResponse;

import java.util.Map;

public interface HumanizedMarketingContentService {
    HumanizedContentResponse generateContent(HumanizedContentGenerateRequest request);
    Map<String, Object> getPresets();
}
