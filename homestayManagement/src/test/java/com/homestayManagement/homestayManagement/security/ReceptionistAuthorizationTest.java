package com.homestayManagement.homestayManagement.security;

import com.homestayManagement.homestayManagement.config.SecurityConfig;
import com.homestayManagement.homestayManagement.controller.AdminBookingController;
import com.homestayManagement.homestayManagement.controller.AdminInvoiceController;
import com.homestayManagement.homestayManagement.controller.HousekeepingController;
import com.homestayManagement.homestayManagement.service.AdminBookingService;
import com.homestayManagement.homestayManagement.service.AdminCheckInRegistrationService;
import com.homestayManagement.homestayManagement.service.AdminInvoiceService;
import com.homestayManagement.homestayManagement.service.HousekeepingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@WebMvcTest(controllers = {AdminBookingController.class, AdminInvoiceController.class, HousekeepingController.class})
@ImportAutoConfiguration({SecurityAutoConfiguration.class, ServletWebSecurityAutoConfiguration.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ReceptionistAuthorizationTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private JwtService jwtService;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private AdminBookingService adminBookingService;
    @MockitoBean private AdminCheckInRegistrationService adminCheckInRegistrationService;
    @MockitoBean private AdminInvoiceService adminInvoiceService;
    @MockitoBean private HousekeepingService housekeepingService;

    @Test
    void receptionistCanLoadBookingData() throws Exception {
        when(adminBookingService.getCheckInLogs(any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/bookings/check-in-logs")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk());
    }

    @Test
    void receptionistCanLoadInvoiceData() throws Exception {
        when(adminInvoiceService.getAllInvoices()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/invoices")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk());
    }

    @Test
    void receptionistCannotAccessAdminOnlyUserManagement() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isForbidden());
    }

    @Test
    void receptionistCanRequestInspectionButCannotStartHousekeepingTask() throws Exception {
        mockMvc.perform(post("/api/housekeeping/booking-details/10/request")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/housekeeping/tasks/20/start")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isForbidden());
    }

    @Test
    void receptionistCanRemoveStayChargeButHousekeepingCannot() throws Exception {
        mockMvc.perform(delete("/api/admin/bookings/details/10/services/20")
                        .with(user("receptionist").authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/bookings/details/10/services/20")
                        .with(user("housekeeping").authorities(() -> "ROLE_HOUSEKEEPING")))
                .andExpect(status().isForbidden());
    }

    @Test
    void housekeepingCanStartTaskButCannotCreateInspectionRequest() throws Exception {
        mockMvc.perform(post("/api/housekeeping/tasks/20/start")
                        .with(user("housekeeping").authorities(() -> "ROLE_HOUSEKEEPING")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/housekeeping/booking-details/10/request")
                        .with(user("housekeeping").authorities(() -> "ROLE_HOUSEKEEPING")))
                .andExpect(status().isForbidden());
    }

    @Test
    void expiredJwtReturnsFriendlyUnauthorizedMessage() throws Exception {
        when(jwtService.extractEmail("expired-token"))
                .thenThrow(new RuntimeException("JWT expired 709838 milliseconds ago"));

        mockMvc.perform(get("/api/admin/bookings/check-in-logs")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại"
                ));
    }
}
