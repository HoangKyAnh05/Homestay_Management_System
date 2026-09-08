package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.impl.InvoiceExcelServiceImpl;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceExcelServiceImplTest {

    @Mock
    private AdminInvoiceService adminInvoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    private InvoiceExcelServiceImpl invoiceExcelService;

    @BeforeEach
    void setUp() {
        invoiceExcelService = new InvoiceExcelServiceImpl(adminInvoiceService, invoiceRepository);
    }

    @Test
    void exportInvoicesExcel_shouldGenerateValidExcelFileWithTotals() throws Exception {
        LocalDate fromDate = LocalDate.of(2026, 9, 1);
        LocalDate toDate = LocalDate.of(2026, 9, 30);

        AdminInvoiceResponse inv1 = new AdminInvoiceResponse(
                1L, 101L, "BK-101", "COMPLETED",
                10L, "Nguyễn Văn A", "nguyenvana@gmail.com",
                20L, "Lễ tân B", "SUMMER10",
                BigDecimal.valueOf(1000000), BigDecimal.valueOf(100000), BigDecimal.valueOf(900000),
                BigDecimal.valueOf(50000), BigDecimal.valueOf(150000), BigDecimal.valueOf(1100000),
                BigDecimal.valueOf(1100000), BigDecimal.ZERO, "VNPAY", "SUCCESS",
                LocalDateTime.of(2026, 9, 5, 14, 30), LocalDateTime.of(2026, 9, 5, 10, 0),
                List.of(), List.of(), List.of()
        );

        AdminInvoiceResponse inv2 = new AdminInvoiceResponse(
                2L, 102L, "BK-102", "CONFIRMED",
                11L, "Trần Thị B", "tranthib@gmail.com",
                null, "Thanh toán online", null,
                BigDecimal.valueOf(2000000), BigDecimal.ZERO, BigDecimal.valueOf(2000000),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(2000000),
                BigDecimal.valueOf(1000000), BigDecimal.valueOf(1000000), "CASH", "PENDING",
                null, LocalDateTime.of(2026, 9, 6, 11, 0),
                List.of(), List.of(), List.of()
        );

        when(adminInvoiceService.getAllInvoices()).thenReturn(List.of(inv1, inv2));

        byte[] excelBytes = invoiceExcelService.exportInvoicesExcel(fromDate, toDate);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (ByteArrayInputStream in = new ByteArrayInputStream(excelBytes);
             Workbook workbook = WorkbookFactory.create(in)) {

            assertEquals(1, workbook.getNumberOfSheets());
            Sheet sheet = workbook.getSheet("Danh sách hóa đơn");
            assertNotNull(sheet);

            // Title check
            assertTrue(sheet.getRow(0).getCell(0).getStringCellValue().contains("DANH SÁCH HÓA ĐƠN"));
            // Subtitle check
            assertTrue(sheet.getRow(1).getCell(0).getStringCellValue().contains("Từ 01/09/2026 đến 30/09/2026"));
        }
    }

    @Test
    void exportSingleInvoiceExcel_shouldGenerateDetailedSheet() throws Exception {
        Long invoiceId = 1L;

        List<AdminPaymentResponse> payments = List.of(
                new AdminPaymentResponse(10L, "VNPAY", "TXN-12345", BigDecimal.valueOf(1100000), "SUCCESS", LocalDateTime.of(2026, 9, 5, 14, 30))
        );

        List<AdminInvoiceServiceItemResponse> serviceItems = List.of(
                new AdminInvoiceServiceItemResponse(101L, "FACILITY", "Thuê xe máy", 1, BigDecimal.valueOf(150000), BigDecimal.valueOf(150000))
        );

        List<AdminInvoicePenaltyItemResponse> penaltyItems = List.of(
                new AdminInvoicePenaltyItemResponse(201L, "Phí check-out trễ", BigDecimal.valueOf(50000), "Trễ 1 giờ")
        );

        AdminInvoiceResponse invoice = new AdminInvoiceResponse(
                invoiceId, 101L, "BK-101", "COMPLETED",
                10L, "Nguyễn Văn A", "nguyenvana@gmail.com",
                20L, "Lễ tân B", "SUMMER10",
                BigDecimal.valueOf(1000000), BigDecimal.valueOf(100000), BigDecimal.valueOf(900000),
                BigDecimal.valueOf(50000), BigDecimal.valueOf(150000), BigDecimal.valueOf(1100000),
                BigDecimal.valueOf(1100000), BigDecimal.ZERO, "VNPAY", "SUCCESS",
                LocalDateTime.of(2026, 9, 5, 14, 30), LocalDateTime.of(2026, 9, 5, 10, 0),
                payments, serviceItems, penaltyItems
        );

        when(adminInvoiceService.getInvoice(invoiceId)).thenReturn(invoice);

        byte[] excelBytes = invoiceExcelService.exportSingleInvoiceExcel(invoiceId);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (ByteArrayInputStream in = new ByteArrayInputStream(excelBytes);
             Workbook workbook = WorkbookFactory.create(in)) {

            Sheet sheet = workbook.getSheet("Hóa đơn #1");
            assertNotNull(sheet);
            assertTrue(sheet.getRow(0).getCell(0).getStringCellValue().contains("HÓA ĐƠN THANH TOÁN DỊCH VỤ HOMESTAY"));
        }
    }

    @Test
    void exportInvoiceByBookingIdExcel_shouldFindInvoiceAndExport() throws Exception {
        Long bookingId = 101L;

        Booking booking = new Booking();
        booking.setId(bookingId);

        Customer customer = new Customer();
        customer.setId(10L);
        customer.setFullName("Nguyễn Văn A");
        booking.setCustomer(customer);

        Invoice invoice = new Invoice();
        invoice.setId(1L);
        invoice.setBooking(booking);

        when(invoiceRepository.findByBookingId(bookingId)).thenReturn(Optional.of(invoice));

        AdminInvoiceResponse response = new AdminInvoiceResponse(
                1L, bookingId, "BK-101", "COMPLETED",
                10L, "Nguyễn Văn A", "nguyenvana@gmail.com",
                null, "Thanh toán online", null,
                BigDecimal.valueOf(1000000), BigDecimal.ZERO, BigDecimal.valueOf(1000000),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(1000000),
                BigDecimal.valueOf(1000000), BigDecimal.ZERO, "CASH", "SUCCESS",
                null, LocalDateTime.now(),
                List.of(), List.of(), List.of()
        );

        when(adminInvoiceService.getInvoice(1L)).thenReturn(response);

        byte[] bytes = invoiceExcelService.exportInvoiceByBookingIdExcel(bookingId);

        assertNotNull(bytes);
        assertTrue(bytes.length > 0);
    }
}
