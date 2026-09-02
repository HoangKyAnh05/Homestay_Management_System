package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCompensationRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentCreateRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomIncidentStatusUpdateRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomIncidentSummaryResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.RoomIncidentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomIncidentServiceImplTest {

    @Mock private RoomIncidentRepository roomIncidentRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private HousekeepingTaskRepository housekeepingTaskRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private RulesPenaltyRepository rulesPenaltyRepository;
    @Mock private AppliedPenaltyRepository appliedPenaltyRepository;
    @Mock private AdminBookingService adminBookingService;

    private RoomIncidentServiceImpl service;
    private Employee employee;
    private Room room;
    private RoomType roomType;

    @BeforeEach
    void setUp() {
        service = new RoomIncidentServiceImpl(
                roomIncidentRepository, roomRepository, bookingDetailRepository,
                housekeepingTaskRepository, checkInRecordRepository, employeeRepository,
                rulesPenaltyRepository, appliedPenaltyRepository, adminBookingService
        );

        Account account = Account.builder().email("hk@example.com").build();
        employee = Employee.builder().id(10L).account(account).fullName("Nguyễn Thị Hoa").build();

        roomType = RoomType.builder().id(1L).name("Phòng Deluxe").build();
        room = Room.builder().id(101L).roomNumber("101").roomType(roomType).build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "hk@example.com", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_HOUSEKEEPING"))
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void reportIncident_success() {
        when(employeeRepository.findByAccountEmail("hk@example.com")).thenReturn(Optional.of(employee));
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomIncidentRepository.save(any(RoomIncident.class))).thenAnswer(invocation -> {
            RoomIncident incident = invocation.getArgument(0);
            incident.setId(1L);
            return incident;
        });

        RoomIncidentCreateRequest request = new RoomIncidentCreateRequest(
                101L, null, null, "Vỡ cốc thủy tinh", 2, "DAMAGED", "LOW",
                "Khách làm rơi cốc", null, BigDecimal.valueOf(50000)
        );

        RoomIncidentResponse response = service.reportIncident(request);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("101", response.roomNumber());
        assertEquals("Vỡ cốc thủy tinh", response.itemName());
        assertEquals(2, response.quantity());
        assertEquals("DAMAGED", response.incidentType());
        assertEquals("REPORTED", response.status());
    }

    @Test
    void reportIncident_invalidType_throwsException() {
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));

        RoomIncidentCreateRequest request = new RoomIncidentCreateRequest(
                101L, null, null, "Vỡ cốc", 1, "INVALID_TYPE", "LOW", null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.reportIncident(request));
        assertTrue(ex.getMessage().contains("Loại sự cố không hợp lệ"));
    }

    @Test
    void updateStatus_success() {
        when(employeeRepository.findByAccountEmail("hk@example.com")).thenReturn(Optional.of(employee));

        RoomIncident incident = RoomIncident.builder()
                .id(1L)
                .room(room)
                .reportedBy(employee)
                .itemName("Hỏng điều hòa")
                .quantity(1)
                .incidentType("DAMAGED")
                .status("REPORTED")
                .build();

        when(roomIncidentRepository.findById(1L)).thenReturn(Optional.of(incident));
        when(roomIncidentRepository.save(any(RoomIncident.class))).thenAnswer(i -> i.getArgument(0));

        RoomIncidentStatusUpdateRequest request = new RoomIncidentStatusUpdateRequest("RESOLVED", "Đã gọi thợ sửa");
        RoomIncidentResponse response = service.updateStatus(1L, request);

        assertEquals("RESOLVED", response.status());
        assertEquals("Đã gọi thợ sửa", response.adminNotes());
        assertNotNull(response.resolvedAt());
    }

    @Test
    void decideCompensation_withCustomerCharge_success() {
        when(employeeRepository.findByAccountEmail("hk@example.com")).thenReturn(Optional.of(employee));

        Booking booking = Booking.builder().id(20L).bookingCode("BK-20").build();
        BookingDetail bookingDetail = BookingDetail.builder().id(30L).booking(booking).room(room).build();
        CheckInRecord record = CheckInRecord.builder().id(40L).bookingDetail(bookingDetail).build();
        RulesPenalty rule = RulesPenalty.builder().id(1L).title("Làm hỏng đồ").penaltyAmount(BigDecimal.valueOf(200000)).build();

        RoomIncident incident = RoomIncident.builder()
                .id(1L)
                .room(room)
                .bookingDetail(bookingDetail)
                .reportedBy(employee)
                .itemName("Mất điều khiển tivi")
                .quantity(1)
                .incidentType("LOST")
                .status("REPORTED")
                .build();

        when(roomIncidentRepository.findById(1L)).thenReturn(Optional.of(incident));
        when(checkInRecordRepository.findByBookingDetailId(30L)).thenReturn(Optional.of(record));
        when(rulesPenaltyRepository.findAll()).thenReturn(List.of(rule));
        when(roomIncidentRepository.save(any(RoomIncident.class))).thenAnswer(i -> i.getArgument(0));

        RoomIncidentCompensationRequest request = new RoomIncidentCompensationRequest(
                "CUSTOMER", BigDecimal.valueOf(300000), true, "Khách nhận làm mất"
        );

        RoomIncidentResponse response = service.decideCompensation(1L, request);

        assertEquals("CUSTOMER", response.liability());
        assertEquals(BigDecimal.valueOf(300000), response.compensationAmount());
        verify(appliedPenaltyRepository).save(any(AppliedPenalty.class));
        verify(adminBookingService).generateInvoice(30L);
    }

    @Test
    void reportIncident_maintenance_success() {
        when(employeeRepository.findByAccountEmail("hk@example.com")).thenReturn(Optional.of(employee));
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomIncidentRepository.save(any(RoomIncident.class))).thenAnswer(invocation -> {
            RoomIncident incident = invocation.getArgument(0);
            incident.setId(3L);
            return incident;
        });

        RoomIncidentCreateRequest request = new RoomIncidentCreateRequest(
                101L, null, null, "Sửa đường ống nước rò rỉ", 1, "MAINTENANCE", "HIGH",
                "Ống nước bồn rửa mặt bị rò", null, BigDecimal.valueOf(150000)
        );

        RoomIncidentResponse response = service.reportIncident(request);

        assertNotNull(response);
        assertEquals(3L, response.id());
        assertEquals("101", response.roomNumber());
        assertEquals("Sửa đường ống nước rò rỉ", response.itemName());
        assertEquals("MAINTENANCE", response.incidentType());
        assertEquals("REPORTED", response.status());
    }

    @Test
    void getIncidentSummary_success() {
        RoomIncident inc1 = RoomIncident.builder().id(1L).status("REPORTED").incidentType("DAMAGED").compensationAmount(BigDecimal.valueOf(100000)).build();
        RoomIncident inc2 = RoomIncident.builder().id(2L).status("RESOLVED").incidentType("LOST").compensationAmount(BigDecimal.valueOf(200000)).build();
        RoomIncident inc3 = RoomIncident.builder().id(3L).status("IN_PROGRESS").incidentType("MAINTENANCE").compensationAmount(BigDecimal.ZERO).build();

        when(roomIncidentRepository.findAll()).thenReturn(List.of(inc1, inc2, inc3));

        RoomIncidentSummaryResponse summary = service.getIncidentSummary();

        assertEquals(3, summary.totalIncidents());
        assertEquals(1, summary.reportedCount());
        assertEquals(1, summary.inProgressCount());
        assertEquals(1, summary.resolvedCount());
        assertEquals(1, summary.damagedCount());
        assertEquals(1, summary.lostCount());
        assertEquals(1, summary.maintenanceCount());
        assertEquals(BigDecimal.valueOf(300000), summary.totalCompensationAmount());
    }
}
