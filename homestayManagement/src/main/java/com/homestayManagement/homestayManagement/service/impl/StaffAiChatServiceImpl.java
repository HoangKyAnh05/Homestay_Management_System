package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.request.CustomerAiHistoryMessageRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPublicResponse;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import com.homestayManagement.homestayManagement.service.AdminDashboardService;
import com.homestayManagement.homestayManagement.service.CustomerAiClient;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import com.homestayManagement.homestayManagement.service.RoomService;
import com.homestayManagement.homestayManagement.service.StaffAiChatService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StaffAiChatServiceImpl implements StaffAiChatService {

    private final CustomerAiClient customerAiClient;
    private final RoomService roomService;
    private final PublicBookingService publicBookingService;
    private final AdminDashboardService adminDashboardService;
    private final AdminBookingService adminBookingService;

    public StaffAiChatServiceImpl(
            CustomerAiClient customerAiClient,
            RoomService roomService,
            PublicBookingService publicBookingService,
            AdminDashboardService adminDashboardService,
            AdminBookingService adminBookingService
    ) {
        this.customerAiClient = customerAiClient;
        this.roomService = roomService;
        this.publicBookingService = publicBookingService;
        this.adminDashboardService = adminDashboardService;
        this.adminBookingService = adminBookingService;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerAiChatResponse chat(CustomerAiChatRequest request, Authentication authentication) {
        String role = primaryRole(authentication);
        LocalDate today = LocalDate.now();
        Map<String, Object> publicContext = new LinkedHashMap<>();
        publicContext.put("roomCatalog", roomService.getAllPublicRooms().stream()
                .map(this::toCompactRoomContext)
                .toList());
        publicContext.put("pricePolicies", publicBookingService.getPricePolicies());
        publicContext.put("services", publicBookingService.getServiceOptions());

        Map<String, Object> staffContext = new LinkedHashMap<>();
        staffContext.put("staffEmail", authentication != null ? authentication.getName() : null);
        staffContext.put("staffRole", role);
        staffContext.put("today", today);
        staffContext.put("dashboardLast7Days", adminDashboardService.getSummary(today.minusDays(6), today));
        staffContext.put("todayCheckInLogs", adminBookingService.getCheckInLogs(today, today).stream()
                .limit(12)
                .toList());
        staffContext.put("recentCheckInLogs", adminBookingService.getCheckInLogs(today.minusDays(6), today).stream()
                .limit(30)
                .toList());
        staffContext.put(
                "operationRules",
                "AI chi tu van va tom tat du lieu. Khong tu dong tao booking, check-in, check-out, thanh toan, tao hoa don hoac thay doi du lieu."
        );

        List<CustomerAiHistoryMessageRequest> history = request.history() == null
                ? List.of()
                : request.history();
        CustomerAiClient.CustomerAiClientResponse aiResponse = customerAiClient.chat(
                new CustomerAiClient.CustomerAiClientRequest(
                        request.message().trim(),
                        request.sessionId(),
                        sanitizePagePath(request.pagePath()),
                        "staff",
                        true,
                        publicContext,
                        staffContext,
                        history
                )
        );
        return new CustomerAiChatResponse(
                aiResponse.answer(),
                request.sessionId(),
                true,
                LocalDateTime.now()
        );
    }

    private String primaryRole(Authentication authentication) {
        if (authentication == null) {
            return "UNKNOWN";
        }
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(role -> role.startsWith("ROLE_"))
                .findFirst()
                .orElse("UNKNOWN");
    }

    private String sanitizePagePath(String pagePath) {
        if (pagePath == null || pagePath.isBlank()) {
            return "/admin";
        }
        return pagePath.replaceAll("[\\r\\n\\t]", "").trim();
    }

    private Map<String, Object> toCompactRoomContext(RoomPublicResponse room) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("roomNumber", room.roomNumber());
        context.put("roomTypeName", room.roomTypeName());
        context.put("maxAdults", room.maxAdults());
        context.put("maxChildren", room.maxChildren());
        context.put("weekdayPrice", room.weekdayPrice());
        context.put("weekendPrice", room.weekendPrice());
        context.put("rentType", room.rentType());
        context.put("depositPolicyName", room.depositPolicyName());
        context.put("prices", room.prices());
        return context;
    }
}
