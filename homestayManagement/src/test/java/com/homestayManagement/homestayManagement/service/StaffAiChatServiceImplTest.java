package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.CustomerAiChatRequest;
import com.homestayManagement.homestayManagement.service.impl.StaffAiChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StaffAiChatServiceImplTest {

    @Mock
    private CustomerAiClient customerAiClient;
    @Mock
    private RoomService roomService;
    @Mock
    private PublicBookingService publicBookingService;
    @Mock
    private AdminDashboardService adminDashboardService;
    @Mock
    private AdminBookingService adminBookingService;

    private StaffAiChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new StaffAiChatServiceImpl(
                customerAiClient,
                roomService,
                publicBookingService,
                adminDashboardService,
                adminBookingService
        );
        when(roomService.getAllPublicRooms()).thenReturn(List.of());
        when(publicBookingService.getPricePolicies()).thenReturn(List.of());
        when(publicBookingService.getServiceOptions()).thenReturn(List.of());
        when(adminDashboardService.getSummary(
                org.mockito.ArgumentMatchers.any(LocalDate.class),
                org.mockito.ArgumentMatchers.any(LocalDate.class)
        )).thenReturn(null);
        when(adminBookingService.getCheckInLogs(
                org.mockito.ArgumentMatchers.any(LocalDate.class),
                org.mockito.ArgumentMatchers.any(LocalDate.class)
        )).thenReturn(List.of());
        when(customerAiClient.chat(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new CustomerAiClient.CustomerAiClientResponse("OK", "test-model"));
    }

    @Test
    void staffChatSendsStaffAudienceAndRoleContext() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "receptionist@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))
        );
        CustomerAiChatRequest request = new CustomerAiChatRequest(
                "Hom nay can check-in gi?",
                "staff_session_123",
                "/admin/receptionist",
                List.of()
        );

        service.chat(request, authentication);

        ArgumentCaptor<CustomerAiClient.CustomerAiClientRequest> captor =
                ArgumentCaptor.forClass(CustomerAiClient.CustomerAiClientRequest.class);
        verify(customerAiClient).chat(captor.capture());
        assertEquals("staff", captor.getValue().audience());
        assertTrue(captor.getValue().authenticated());
        assertEquals("ROLE_RECEPTIONIST", captor.getValue().customerContext().get("staffRole"));
    }
}
