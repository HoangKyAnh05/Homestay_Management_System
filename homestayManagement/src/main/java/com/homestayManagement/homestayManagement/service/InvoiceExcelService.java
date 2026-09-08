package com.homestayManagement.homestayManagement.service;

import java.time.LocalDate;

public interface InvoiceExcelService {

    /**
     * Xuất danh sách nhiều hóa đơn ra file Excel (có lọc theo ngày hoặc xuất toàn bộ nếu null).
     */
    byte[] exportInvoicesExcel(LocalDate fromDate, LocalDate toDate);

    /**
     * Xuất chi tiết 1 hóa đơn cụ thể ra file Excel theo invoiceId.
     */
    byte[] exportSingleInvoiceExcel(Long invoiceId);

    /**
     * Xuất chi tiết hóa đơn theo bookingId.
     */
    byte[] exportInvoiceByBookingIdExcel(Long bookingId);
}
