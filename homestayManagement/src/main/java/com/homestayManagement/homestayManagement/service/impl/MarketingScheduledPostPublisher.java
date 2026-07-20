package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.repository.MarketingPostChannelRepository;
import com.homestayManagement.homestayManagement.service.AdminMarketingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MarketingScheduledPostPublisher {

    private static final Logger log = LoggerFactory.getLogger(MarketingScheduledPostPublisher.class);

    private final boolean enabled;
    private final MarketingPostChannelRepository channelRepository;
    private final AdminMarketingService adminMarketingService;

    public MarketingScheduledPostPublisher(
            @Value("${marketing.scheduler.enabled:true}") boolean enabled,
            MarketingPostChannelRepository channelRepository,
            AdminMarketingService adminMarketingService
    ) {
        this.enabled = enabled;
        this.channelRepository = channelRepository;
        this.adminMarketingService = adminMarketingService;
    }

    @Scheduled(fixedDelayString = "${marketing.scheduler.publish-fixed-delay-ms:5000}")
    public void publishDueScheduledPosts() {
        if (!enabled) {
            return;
        }
        List<MarketingPostChannel> dueChannels = channelRepository
                .findTop20ByStatusAndScheduledAtLessThanEqualAndPostedAtIsNullOrderByScheduledAtAsc("SCHEDULED", LocalDateTime.now());
        if (dueChannels.isEmpty()) {
            return;
        }
        log.info("Found {} due scheduled marketing channel(s) to publish.", dueChannels.size());
        for (MarketingPostChannel channel : dueChannels) {
            try {
                log.info("Publishing scheduled marketing channel id={} scheduledAt={}.", channel.getId(), channel.getScheduledAt());
                adminMarketingService.publishChannel(channel.getId());
            } catch (Exception exception) {
                log.error("Could not publish scheduled marketing channel id={}.", channel.getId(), exception);
            }
        }
    }
}
