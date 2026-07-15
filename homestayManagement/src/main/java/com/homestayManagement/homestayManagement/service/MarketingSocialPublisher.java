package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;

public interface MarketingSocialPublisher {
    PublishResult publish(MarketingPostChannel channel);

    record PublishResult(
            boolean success,
            String status,
            String generatedContent,
            String generatedHashtags,
            String relayFlowId,
            String relayTaskId,
            String externalPostId,
            String externalUrl,
            String responsePayload,
            String errorCode,
            String errorMessage
    ) {
    }
}
