package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionItemRequest;
import com.homestayManagement.homestayManagement.dto.request.HousekeepingInspectionRequest;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.HousekeepingServiceImpl;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HousekeepingServiceImplTest {

    @Mock private HousekeepingTaskRepository housekeepingTaskRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private RoomMiniBarItemRepository roomMiniBarItemRepository;
    @Mock private RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;
    @Mock private RulesPenaltyRepository rulesPenaltyRepository;
    @Mock private AppliedPenaltyRepository appliedPenaltyRepository;
    @Mock private AdminBookingService adminBookingService;

    private HousekeepingServiceImpl service;
    private HousekeepingTask task;
    private Employee housekeeper;
    private RoomMiniBarItem water;

    @BeforeEach
    void setUp() {
        service = new HousekeepingServiceImpl(
                housekeepingTaskRepository, bookingDetailRepository, checkInRecordRepository,
                employeeRepository, roomRepository, roomMiniBarItemRepository,
                roomAmenitiesUsageRepository, rulesPenaltyRepository, appliedPenaltyRepository,
                adminBookingService
        );

        housekeeper = Employee.builder().id(8L).fullName("Nhân viên dọn phòng").build();
        Room room = Room.builder().id(210L).roomNumber("210").status("OCCUPIED").build();
        Customer customer = Customer.builder().id(3L).fullName("Khách 210").phone("0900000000").build();
        Booking booking = Booking.builder().id(4L).customer(customer).status("CHECKED_IN").build();
        BookingDetail detail = BookingDetail.builder().id(5L).booking(booking).room(room)
                .checkOutTarget(LocalDateTime.now().plusHours(1)).status("CHECKED_IN").build();
        CheckInRecord record = CheckInRecord.builder().id(6L).bookingDetail(detail).customer(customer)
                .actualCheckIn(LocalDateTime.now().minusDays(1)).build();
        task = HousekeepingTask.builder().id(7L).checkInRecord(record).room(room)
                .requestedBy(housekeeper).inspectionStatus("PENDING").cleaningStatus("PENDING")
                .requestedAt(LocalDateTime.now()).build();
        water = RoomMiniBarItem.builder().id(9L).name("Nước suối")
                .price(BigDecimal.valueOf(10_000)).quantityInStock(20).build();

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "housekeeping@example.com", null, List.of(new SimpleGrantedAuthority("ROLE_HOUSEKEEPING"))
        ));
        lenient().when(employeeRepository.findByAccountEmail("housekeeping@example.com")).thenReturn(Optional.of(housekeeper));
        lenient().when(housekeepingTaskRepository.findByIdForDetail(7L)).thenReturn(Optional.of(task));
        lenient().when(housekeepingTaskRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(roomMiniBarItemRepository.findAll()).thenReturn(List.of(water));
        lenient().when(roomAmenitiesUsageRepository.findByBookingDetailIdForAdmin(5L)).thenReturn(List.of());
        lenient().when(rulesPenaltyRepository.findAll()).thenReturn(List.of());
        lenient().when(appliedPenaltyRepository.findByBookingDetailIdForAdmin(5L)).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void startTaskAssignsEmployeeAndMovesRoomToCleaning() {
        service.startTask(7L);

        assertEquals("IN_PROGRESS", task.getInspectionStatus());
        assertEquals("IN_PROGRESS", task.getCleaningStatus());
        assertEquals("CLEANING", task.getRoom().getStatus());
        assertEquals(housekeeper, task.getAssignedHousekeeping());
        verify(roomRepository).save(task.getRoom());
    }

    @Test
    void submitInspectionReplacesMiniBarAndRefreshesInvoice() {
        task.setAssignedHousekeeping(housekeeper);
        task.setStartedAt(LocalDateTime.now());
        task.setInspectionStatus("IN_PROGRESS");
        task.setCleaningStatus("IN_PROGRESS");

        service.submitInspection(7L, new HousekeepingInspectionRequest(
                List.of(new HousekeepingInspectionItemRequest(9L, 3)), List.of(), "Đã kiểm tra"
        ));

        assertEquals("COMPLETED", task.getInspectionStatus());
        assertEquals("IN_PROGRESS", task.getCleaningStatus());
        verify(roomAmenitiesUsageRepository).deleteByCheckInRecordId(6L);
        verify(roomAmenitiesUsageRepository).saveAll(argThat(items -> items.iterator().next().getQuantityUsed() == 3));
        verify(appliedPenaltyRepository).deleteByCheckRecordId(6L);
        verify(adminBookingService).generateInvoice(5L);
    }

    @Test
    void submitInspectionSavesConfiguredRulePenalty() {
        task.setAssignedHousekeeping(housekeeper);
        task.setStartedAt(LocalDateTime.now());
        task.setInspectionStatus("IN_PROGRESS");
        task.setCleaningStatus("IN_PROGRESS");
        RulesPenalty noSmoking = RulesPenalty.builder().id(11L).title("Hút thuốc trong phòng")
                .penaltyAmount(BigDecimal.valueOf(500_000)).build();
        when(rulesPenaltyRepository.findAll()).thenReturn(List.of(noSmoking));

        service.submitInspection(7L, new HousekeepingInspectionRequest(
                List.of(new HousekeepingInspectionItemRequest(9L, 0)), List.of(11L), "Có mùi thuốc"
        ));

        verify(appliedPenaltyRepository).saveAll(argThat(penalties -> {
            AppliedPenalty saved = penalties.iterator().next();
            return saved.getRulesPenalty().getId().equals(11L)
                    && saved.getActualFine().compareTo(BigDecimal.valueOf(500_000)) == 0;
        }));
    }

    @Test
    void completeCleaningMakesRoomAvailableWithoutChangingCheckout() {
        task.setAssignedHousekeeping(housekeeper);
        task.setInspectionStatus("COMPLETED");
        task.setCleaningStatus("IN_PROGRESS");
        task.getRoom().setStatus("CLEANING");

        service.completeCleaning(7L);

        assertEquals("COMPLETED", task.getCleaningStatus());
        assertEquals("AVAILABLE", task.getRoom().getStatus());
        verify(roomRepository).save(task.getRoom());
    }
}
