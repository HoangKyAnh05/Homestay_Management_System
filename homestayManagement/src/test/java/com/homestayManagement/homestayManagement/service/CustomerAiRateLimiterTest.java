package com.homestayManagement.homestayManagement.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomerAiRateLimiterTest {

    @Test
    void blocksRequestsAfterConfiguredLimit() {
        CustomerAiRateLimiter limiter = new CustomerAiRateLimiter(
                2,
                Clock.fixed(Instant.parse("2026-07-06T10:00:00Z"), ZoneOffset.UTC)
        );

        assertTrue(limiter.tryAcquire("customer@example.com"));
        assertTrue(limiter.tryAcquire("customer@example.com"));
        assertFalse(limiter.tryAcquire("customer@example.com"));
        assertTrue(limiter.tryAcquire("another@example.com"));
    }
}
