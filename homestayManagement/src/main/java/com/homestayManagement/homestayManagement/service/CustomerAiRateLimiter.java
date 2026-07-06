package com.homestayManagement.homestayManagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CustomerAiRateLimiter {

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final int maxRequestsPerMinute;
    private final Clock clock;

    @Autowired
    public CustomerAiRateLimiter(
            @Value("${ai.customer.rate-limit-per-minute:20}") int maxRequestsPerMinute
    ) {
        this(maxRequestsPerMinute, Clock.systemUTC());
    }

    CustomerAiRateLimiter(int maxRequestsPerMinute, Clock clock) {
        this.maxRequestsPerMinute = Math.max(1, maxRequestsPerMinute);
        this.clock = clock;
    }

    public boolean tryAcquire(String key) {
        long currentMinute = clock.millis() / 60_000;
        Window updated = windows.compute(key, (ignored, current) -> {
            if (current == null || current.minute() != currentMinute) {
                return new Window(currentMinute, 1);
            }
            return new Window(currentMinute, current.count() + 1);
        });
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().minute() < currentMinute - 1);
        }
        return updated.count() <= maxRequestsPerMinute;
    }

    private record Window(long minute, int count) {
    }
}
