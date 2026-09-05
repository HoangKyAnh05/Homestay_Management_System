package com.homestayManagement.homestayManagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportCreateRequest;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportPreviewResponse;
import com.homestayManagement.homestayManagement.dto.dailyreport.DailyReportResponse;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.impl.DailyClosingReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyClosingReportServiceImplTest {

    @Mock
    private DailyClosingReportRepository dailyClosingReportRepository;

    @Mock
    private CheckInRecordRepository checkInRecordRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private DailyClosingReportServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DailyClosingReportServiceImpl(
                dailyClosingReportRepository,
                checkInRecordRepository,
                paymentRepository,
                invoiceRepository,
                employeeRepository,
                new ObjectMapper()
        );
    }

    @Test
    @DisplayName("getPreview calculates revenue and occupied rooms correctly")
    void testGetPreview_Success() {
        LocalDate today = LocalDate.now();

        when(paymentRepository.sumCashPaymentsBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("500000.00"));
        when(paymentRepository.sumNonCashPaymentsBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("1200000.00"));

        Room room = Room.builder().id(1L).roomNumber("101").build();
        Booking booking = Booking.builder().bookingCode("BK123").build();
        BookingDetail detail = BookingDetail.builder().room(room).booking(booking).checkOutTarget(today.plusDays(1).atTime(12, 0)).numberOfAdults(2).numberOfChildren(0).build();
        Customer customer = Customer.builder().fullName("Nguyen Van A").phone("0912345678").build();
        CheckInRecord record = CheckInRecord.builder().id(10L).bookingDetail(detail).customer(customer).actualCheckIn(today.atTime(14, 0)).build();

        when(checkInRecordRepository.findCurrentlyOccupied()).thenReturn(List.of(record));
        when(checkInRecordRepository.countCheckInBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(2);
        when(checkInRecordRepository.countCheckOutBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(1);
        when(dailyClosingReportRepository.findFirstByReportDateOrderByCreatedAtDesc(today)).thenReturn(Optional.empty());

        DailyReportPreviewResponse preview = service.getPreview(today);

        assertNotNull(preview);
        assertEquals(new BigDecimal("500000.00"), preview.getCashRevenue());
        assertEquals(new BigDecimal("1200000.00"), preview.getTransferRevenue());
        assertEquals(new BigDecimal("1700000.00"), preview.getTotalRevenue());
        assertEquals(1, preview.getOccupiedRoomsCount());
        assertEquals("101", preview.getOccupiedRooms().get(0).getRoomNumber());
        assertEquals(2, preview.getCheckInTodayCount());
        assertEquals(1, preview.getCheckOutTodayCount());
        assertFalse(preview.isAlreadySubmitted());
    }

    @Test
    @DisplayName("createReport saves daily report and returns response")
    void testCreateReport_Success() {
        DailyReportCreateRequest req = DailyReportCreateRequest.builder()
                .reportDate(LocalDate.now())
                .cashRevenue(new BigDecimal("300000"))
                .transferRevenue(new BigDecimal("700000"))
                .totalRevenue(new BigDecimal("1000000"))
                .occupiedRoomsCount(2)
                .checkInTodayCount(1)
                .checkOutTodayCount(0)
                .notes("Hom nay khach dong vui")
                .build();

        Employee staff = Employee.builder().id(1L).fullName("Le Tan Hung").build();
        when(employeeRepository.findByAccountEmail("staff@homestay.com")).thenReturn(Optional.of(staff));

        DailyClosingReport saved = DailyClosingReport.builder()
                .id(100L)
                .reportDate(req.getReportDate())
                .staffFullName("Le Tan Hung")
                .totalRevenue(req.getTotalRevenue())
                .cashRevenue(req.getCashRevenue())
                .transferRevenue(req.getTransferRevenue())
                .occupiedRoomsCount(2)
                .status("SUBMITTED")
                .notes("Hom nay khach dong vui")
                .createdAt(LocalDateTime.now())
                .build();

        when(dailyClosingReportRepository.save(any(DailyClosingReport.class))).thenReturn(saved);

        DailyReportResponse res = service.createReport(req, "staff@homestay.com");

        assertNotNull(res);
        assertEquals(100L, res.getId());
        assertEquals("Le Tan Hung", res.getStaffFullName());
        assertEquals("SUBMITTED", res.getStatus());
        assertEquals(new BigDecimal("1000000"), res.getTotalRevenue());
    }

    @Test
    @DisplayName("acknowledgeReport updates status to ACKNOWLEDGED")
    void testAcknowledgeReport_Success() {
        DailyClosingReport existing = DailyClosingReport.builder()
                .id(50L)
                .status("SUBMITTED")
                .reportDate(LocalDate.now())
                .totalRevenue(new BigDecimal("500000"))
                .build();

        when(dailyClosingReportRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(dailyClosingReportRepository.save(any(DailyClosingReport.class))).thenAnswer(i -> i.getArgument(0));

        DailyReportResponse res = service.acknowledgeReport(50L, "admin@homestay.com");

        assertNotNull(res);
        assertEquals("ACKNOWLEDGED", res.getStatus());
        assertEquals("admin@homestay.com", res.getAcknowledgedBy());
        assertNotNull(res.getAcknowledgedAt());
    }
}
