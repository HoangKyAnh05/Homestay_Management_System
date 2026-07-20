package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.dto.request.CustomerAiHistoryMessageRequest;
import com.homestayManagement.homestayManagement.dto.response.CustomerAiChatResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicBookingHistoryResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPublicResponse;
import com.homestayManagement.homestayManagement.service.CustomerAiChatService;
import com.homestayManagement.homestayManagement.service.CustomerAiClient;
import com.homestayManagement.homestayManagement.service.PublicBookingService;
import com.homestayManagement.homestayManagement.service.RoomService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CustomerAiChatServiceImpl implements CustomerAiChatService {

    private static final int MAX_CONTEXT_BOOKINGS = 10;

    private final CustomerAiClient customerAiClient;
    private final PublicBookingService publicBookingService;
    private final RoomService roomService;

    public CustomerAiChatServiceImpl(
            CustomerAiClient customerAiClient,
            PublicBookingService publicBookingService,
            RoomService roomService
    ) {
        this.customerAiClient = customerAiClient;
        this.publicBookingService = publicBookingService;
        this.roomService = roomService;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerAiChatResponse chat(
            CustomerAiChatRequest request,
            Authentication authentication
    ) {
        boolean authenticatedCustomer = isAuthenticatedCustomer(authentication);
        Map<String, Object> publicContext = new LinkedHashMap<>();
        publicContext.put(
                "roomCatalog",
                roomService.getAllPublicRooms().stream()
                        .map(this::toCompactRoomContext)
                        .toList()
        );
        publicContext.put("pricePolicies", publicBookingService.getPricePolicies());
        publicContext.put("services", publicBookingService.getServiceOptions());
        publicContext.put(
                "bookingInstructions",
                "Khách chọn ngày, số người và loại phòng tại trang /rooms. "
                        + "Giá và phòng trống cuối cùng phải được xác nhận trên giao diện."
        );

        Map<String, Object> customerContext = null;
        if (authenticatedCustomer) {
            List<PublicBookingHistoryResponse> bookings = publicBookingService
                    .getMyBookings(authentication.getName())
                    .stream()
                    .limit(MAX_CONTEXT_BOOKINGS)
                    .toList();
            customerContext = new LinkedHashMap<>();
            customerContext.put("bookings", bookings);
            customerContext.put(
                    "privacyNote",
                    "Context chỉ chứa booking thuộc tài khoản JWT hiện tại."
            );
        }

        List<CustomerAiHistoryMessageRequest> history = request.history() == null
                ? List.of()
                : request.history();
        CustomerAiClient.CustomerAiClientResponse aiResponse = customerAiClient.chat(
                new CustomerAiClient.CustomerAiClientRequest(
                        request.message().trim(),
                        request.sessionId(),
                        sanitizePagePath(request.pagePath()),
                        "customer",
                        authenticatedCustomer,
                        publicContext,
                        customerContext,
                        history
                )
        );
        return new CustomerAiChatResponse(
                aiResponse.answer(),
                request.sessionId(),
                authenticatedCustomer,
                LocalDateTime.now()
        );
    }

    private boolean isAuthenticatedCustomer(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority -> "ROLE_CUSTOMER".equals(authority.getAuthority()));
    }

    private String sanitizePagePath(String pagePath) {
        if (pagePath == null || pagePath.isBlank()) {
            return "/";
        }
        return pagePath.replaceAll("[\\r\\n\\t]", "").trim();
    }

    private Map<String, Object> toCompactRoomContext(RoomPublicResponse room) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("roomNumber", room.roomNumber());
        context.put("roomTypeName", room.roomTypeName());
        context.put("maxAdults", room.maxAdults());
        context.put("maxChildren", room.maxChildren());
        context.put("description", room.description());
        context.put("weekdayPrice", room.weekdayPrice());
        context.put("weekendPrice", room.weekendPrice());
        context.put("rentType", room.rentType());
        context.put("depositPolicyName", room.depositPolicyName());
        context.put("depositCalculationType", room.depositCalculationType());
        context.put("depositPolicyValue", room.depositPolicyValue());
        context.put("prices", room.prices());
        return context;
    }
}
