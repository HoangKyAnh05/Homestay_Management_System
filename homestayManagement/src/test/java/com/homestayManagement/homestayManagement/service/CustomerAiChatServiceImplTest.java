package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.service.impl.CustomerAiChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerAiChatServiceImplTest {

    @Mock
    private CustomerAiClient customerAiClient;
    @Mock
    private PublicBookingService publicBookingService;
    @Mock
    private RoomService roomService;

    private CustomerAiChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CustomerAiChatServiceImpl(
                customerAiClient,
                publicBookingService,
                roomService
        );
        when(roomService.getAllPublicRooms()).thenReturn(List.of());
        when(publicBookingService.getPricePolicies()).thenReturn(List.of());
        when(publicBookingService.getServiceOptions()).thenReturn(List.of());
        when(customerAiClient.chat(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new CustomerAiClient.CustomerAiClientResponse("Xin chào", "test-model"));
    }

    @Test
    void anonymousChatReceivesOnlyPublicContext() {
        CustomerAiChatRequest request = new CustomerAiChatRequest(
                "Có những loại phòng nào?",
                "session_12345678",
                "/rooms",
                List.of()
        );

        var response = service.chat(request, null);

        ArgumentCaptor<CustomerAiClient.CustomerAiClientRequest> captor =
                ArgumentCaptor.forClass(CustomerAiClient.CustomerAiClientRequest.class);
        verify(customerAiClient).chat(captor.capture());
        assertFalse(captor.getValue().authenticated());
        assertNull(captor.getValue().customerContext());
        assertFalse(response.authenticated());
        verify(publicBookingService, never()).getMyBookings(
                org.mockito.ArgumentMatchers.anyString()
        );
    }

    @Test
    void authenticatedCustomerReceivesOnlyBookingsFromJwtIdentity() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "customer@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        when(publicBookingService.getMyBookings("customer@example.com")).thenReturn(List.of());
        CustomerAiChatRequest request = new CustomerAiChatRequest(
                "Booking của tôi thế nào?",
                "session_12345678",
                "/booking-history",
                List.of()
        );

        var response = service.chat(request, authentication);

        ArgumentCaptor<CustomerAiClient.CustomerAiClientRequest> captor =
                ArgumentCaptor.forClass(CustomerAiClient.CustomerAiClientRequest.class);
        verify(customerAiClient).chat(captor.capture());
        verify(publicBookingService).getMyBookings("customer@example.com");
        assertTrue(captor.getValue().authenticated());
        assertTrue(captor.getValue().customerContext().containsKey("bookings"));
        assertTrue(response.authenticated());
    }

    @Test
    void staffTokenDoesNotExposeCustomerBookingContext() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "admin@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        CustomerAiChatRequest request = new CustomerAiChatRequest(
                "Cho tôi xem booking",
                "session_12345678",
                "/home",
                List.of()
        );

        service.chat(request, authentication);

        ArgumentCaptor<CustomerAiClient.CustomerAiClientRequest> captor =
                ArgumentCaptor.forClass(CustomerAiClient.CustomerAiClientRequest.class);
        verify(customerAiClient).chat(captor.capture());
        assertFalse(captor.getValue().authenticated());
        assertNull(captor.getValue().customerContext());
        verify(publicBookingService, never()).getMyBookings(
                org.mockito.ArgumentMatchers.anyString()
        );
    }
}
