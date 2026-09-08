package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminInvoicePenaltyItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminInvoiceServiceItemResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminPaymentResponse;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.AdminInvoiceService;
import com.homestayManagement.homestayManagement.service.InvoiceExcelService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InvoiceExcelServiceImpl implements InvoiceExcelService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceExcelServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final AdminInvoiceService adminInvoiceService;
    private final InvoiceRepository invoiceRepository;

    public InvoiceExcelServiceImpl(AdminInvoiceService adminInvoiceService, InvoiceRepository invoiceRepository) {
        this.adminInvoiceService = adminInvoiceService;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportInvoicesExcel(LocalDate fromDate, LocalDate toDate) {
        List<AdminInvoiceResponse> invoices = adminInvoiceService.getAllInvoices();

        if (fromDate != null) {
            invoices = invoices.stream()
                    .filter(inv -> inv.createdAt() != null && !inv.createdAt().toLocalDate().isBefore(fromDate))
                    .toList();
        }
        if (toDate != null) {
            invoices = invoices.stream()
                    .filter(inv -> inv.createdAt() != null && !inv.createdAt().toLocalDate().isAfter(toDate))
                    .toList();
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Danh sách hóa đơn");
            sheet.setDisplayGridlines(true);

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle subtitleStyle = createSubtitleStyle(workbook);
            CellStyle headerStyle = createTableHeaderStyle(workbook);
            CellStyle normalText = createNormalTextStyle(workbook);
            CellStyle centerText = createCenterTextStyle(workbook);
            CellStyle boldText = createBoldTextStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook, false);
            CellStyle boldCurrencyStyle = createCurrencyStyle(workbook, true);

            int rowIdx = 0;

            // Title
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(26);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH HÓA ĐƠN HOMESTAY");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 15));

            // Subtitle
            Row subRow = sheet.createRow(rowIdx++);
            subRow.setHeightInPoints(18);
            Cell subCell = subRow.createCell(0);
            String timeFilter = (fromDate != null && toDate != null)
                    ? String.format("Thời gian: Từ %s đến %s", fromDate.format(DATE_FORMAT), toDate.format(DATE_FORMAT))
                    : (fromDate != null)
                    ? String.format("Thời gian: Từ ngày %s", fromDate.format(DATE_FORMAT))
                    : (toDate != null)
                    ? String.format("Thời gian: Đến ngày %s", toDate.format(DATE_FORMAT))
                    : "Thời gian: Toàn bộ lịch sử";
            subCell.setCellValue(timeFilter + "  |  Tổng số hóa đơn: " + invoices.size());
            subCell.setCellStyle(subtitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 15));

            rowIdx++; // Empty row

            // Headers
            String[] headers = {
                    "STT", "Mã HĐ", "Mã Booking", "Khách hàng", "Email / Liên hệ",
                    "Tiền phòng gốc", "Mã Voucher", "Giảm voucher", "Tiền phòng",
                    "Tiền dịch vụ", "Tiền phạt / phát sinh", "Tổng hóa đơn",
                    "Đã thanh toán", "Còn lại", "Trạng thái", "Ngày lập"
            };

            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(24);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal sumRoomChargeBeforeDiscount = BigDecimal.ZERO;
            BigDecimal sumDiscount = BigDecimal.ZERO;
            BigDecimal sumRoomCharge = BigDecimal.ZERO;
            BigDecimal sumService = BigDecimal.ZERO;
            BigDecimal sumPenalty = BigDecimal.ZERO;
            BigDecimal sumTotal = BigDecimal.ZERO;
            BigDecimal sumPaid = BigDecimal.ZERO;
            BigDecimal sumRemaining = BigDecimal.ZERO;

            int stt = 1;
            for (AdminInvoiceResponse inv : invoices) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                createCell(row, 0, String.valueOf(stt++), centerText);
                createCell(row, 1, "#" + inv.id(), centerText);
                createCell(row, 2, inv.bookingCode() != null ? inv.bookingCode() : "#" + inv.bookingId(), centerText);
                createCell(row, 3, inv.customerName() != null ? inv.customerName() : "", normalText);
                createCell(row, 4, inv.customerEmail() != null ? inv.customerEmail() : "", normalText);

                BigDecimal roomBefore = inv.roomChargeBeforeDiscount() != null ? inv.roomChargeBeforeDiscount() : BigDecimal.ZERO;
                BigDecimal discount = inv.roomDiscountAmount() != null ? inv.roomDiscountAmount() : BigDecimal.ZERO;
                BigDecimal roomCharge = inv.roomCharge() != null ? inv.roomCharge() : BigDecimal.ZERO;
                BigDecimal serviceCharge = inv.serviceCharge() != null ? inv.serviceCharge() : BigDecimal.ZERO;
                BigDecimal penaltyCharge = inv.penaltyCharge() != null ? inv.penaltyCharge() : BigDecimal.ZERO;
                BigDecimal totalAmount = inv.totalAmount() != null ? inv.totalAmount() : BigDecimal.ZERO;
                BigDecimal paidAmount = inv.paidAmount() != null ? inv.paidAmount() : BigDecimal.ZERO;
                BigDecimal remainingAmount = inv.remainingAmount() != null ? inv.remainingAmount() : BigDecimal.ZERO;

                sumRoomChargeBeforeDiscount = sumRoomChargeBeforeDiscount.add(roomBefore);
                sumDiscount = sumDiscount.add(discount);
                sumRoomCharge = sumRoomCharge.add(roomCharge);
                sumService = sumService.add(serviceCharge);
                sumPenalty = sumPenalty.add(penaltyCharge);
                sumTotal = sumTotal.add(totalAmount);
                sumPaid = sumPaid.add(paidAmount);
                sumRemaining = sumRemaining.add(remainingAmount);

                createCurrencyCell(row, 5, roomBefore, currencyStyle);
                createCell(row, 6, inv.voucherCode() != null ? inv.voucherCode() : "-", centerText);
                createCurrencyCell(row, 7, discount, currencyStyle);
                createCurrencyCell(row, 8, roomCharge, currencyStyle);
                createCurrencyCell(row, 9, serviceCharge, currencyStyle);
                createCurrencyCell(row, 10, penaltyCharge, currencyStyle);
                createCurrencyCell(row, 11, totalAmount, currencyStyle);
                createCurrencyCell(row, 12, paidAmount, currencyStyle);
                createCurrencyCell(row, 13, remainingAmount, currencyStyle);

                createCell(row, 14, translatePaymentStatus(inv.latestPaymentStatus()), centerText);
                createCell(row, 15, inv.createdAt() != null ? inv.createdAt().format(DATE_TIME_FORMAT) : "", centerText);
            }

            // Total summary row
            Row totalRow = sheet.createRow(rowIdx++);
            totalRow.setHeightInPoints(22);
            createCell(totalRow, 0, "TỔNG CỘNG", boldText);
            for (int i = 1; i <= 4; i++) {
                createCell(totalRow, i, "", boldText);
            }
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

            createCurrencyCell(totalRow, 5, sumRoomChargeBeforeDiscount, boldCurrencyStyle);
            createCell(totalRow, 6, "", boldText);
            createCurrencyCell(totalRow, 7, sumDiscount, boldCurrencyStyle);
            createCurrencyCell(totalRow, 8, sumRoomCharge, boldCurrencyStyle);
            createCurrencyCell(totalRow, 9, sumService, boldCurrencyStyle);
            createCurrencyCell(totalRow, 10, sumPenalty, boldCurrencyStyle);
            createCurrencyCell(totalRow, 11, sumTotal, boldCurrencyStyle);
            createCurrencyCell(totalRow, 12, sumPaid, boldCurrencyStyle);
            createCurrencyCell(totalRow, 13, sumRemaining, boldCurrencyStyle);
            createCell(totalRow, 14, "", boldText);
            createCell(totalRow, 15, "", boldText);

            autoSizeColumns(sheet, headers.length);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi khi tạo file Excel danh sách hóa đơn", e);
            throw new RuntimeException("Không thể tạo file Excel danh sách hóa đơn: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportSingleInvoiceExcel(Long invoiceId) {
        AdminInvoiceResponse invoice = adminInvoiceService.getInvoice(invoiceId);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Hóa đơn #" + invoice.id());
            sheet.setDisplayGridlines(true);

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle subtitleStyle = createSubtitleStyle(workbook);
            CellStyle sectionHeaderStyle = createSectionHeaderStyle(workbook);
            CellStyle tableHeaderStyle = createTableHeaderStyle(workbook);
            CellStyle normalText = createNormalTextStyle(workbook);
            CellStyle centerText = createCenterTextStyle(workbook);
            CellStyle boldText = createBoldTextStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook, false);
            CellStyle boldCurrencyStyle = createCurrencyStyle(workbook, true);

            int rowIdx = 0;

            // Header Title
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(28);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("HÓA ĐƠN THANH TOÁN DỊCH VỤ HOMESTAY");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            Row subRow = sheet.createRow(rowIdx++);
            subRow.setHeightInPoints(18);
            Cell subCell = subRow.createCell(0);
            subCell.setCellValue("Mã Hóa Đơn: #" + invoice.id() + "  |  Ngày lập: " + (invoice.createdAt() != null ? invoice.createdAt().format(DATE_TIME_FORMAT) : "N/A"));
            subCell.setCellStyle(subtitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 5));

            rowIdx++; // blank

            // Customer & Booking Info Box
            rowIdx = addInfoRow(sheet, rowIdx, "Khách hàng:", invoice.customerName(), "Mã đặt phòng:", invoice.bookingCode() != null ? invoice.bookingCode() : "#" + invoice.bookingId(), boldText, normalText);
            rowIdx = addInfoRow(sheet, rowIdx, "Email / Liên hệ:", invoice.customerEmail() != null ? invoice.customerEmail() : "Chưa có", "Trạng thái phòng:", translateBookingStatus(invoice.bookingStatus()), boldText, normalText);
            rowIdx = addInfoRow(sheet, rowIdx, "Nhân viên phụ trách:", invoice.employeeName() != null ? invoice.employeeName() : "Hệ thống / Online", "Phương thức:", invoice.latestPaymentMethod() != null ? invoice.latestPaymentMethod() : "Chưa thanh toán", boldText, normalText);

            rowIdx++; // blank

            // Section 1: Tiền phòng
            rowIdx = addSectionTitle(sheet, rowIdx, "I. CHI TIẾT TIỀN PHÒNG", sectionHeaderStyle);
            rowIdx = addSubHeader(sheet, rowIdx, tableHeaderStyle, "Khoản mục", "Diễn giải", "Thành tiền (VNĐ)");

            BigDecimal roomBefore = invoice.roomChargeBeforeDiscount() != null ? invoice.roomChargeBeforeDiscount() : BigDecimal.ZERO;
            BigDecimal discount = invoice.roomDiscountAmount() != null ? invoice.roomDiscountAmount() : BigDecimal.ZERO;
            BigDecimal roomCharge = invoice.roomCharge() != null ? invoice.roomCharge() : BigDecimal.ZERO;

            rowIdx = add3ColDataRow(sheet, rowIdx, "Tiền phòng gốc", "Giá phòng niêm yết theo số đêm đặt", roomBefore, normalText, currencyStyle);
            if (discount.compareTo(BigDecimal.ZERO) > 0 || (invoice.voucherCode() != null && !invoice.voucherCode().isBlank())) {
                rowIdx = add3ColDataRow(sheet, rowIdx, "Giảm giá Voucher", "Mã áp dụng: " + (invoice.voucherCode() != null ? invoice.voucherCode() : "Khuyến mãi"), discount.negate(), normalText, currencyStyle);
            }
            rowIdx = add3ColDataRow(sheet, rowIdx, "Tiền phòng thực thu", "Tiền phòng sau khi trừ khuyến mãi", roomCharge, boldText, boldCurrencyStyle);

            rowIdx++; // blank

            // Section 2: Dịch vụ đã sử dụng
            rowIdx = addSectionTitle(sheet, rowIdx, "II. CHI TIẾT DỊCH VỤ SỬ DỤNG", sectionHeaderStyle);
            Row sHeader = sheet.createRow(rowIdx++);
            sHeader.setHeightInPoints(22);
            createHeaderCell(sHeader, 0, "STT", tableHeaderStyle);
            createHeaderCell(sHeader, 1, "Tên dịch vụ / tiện ích", tableHeaderStyle);
            createHeaderCell(sHeader, 2, "Loại", tableHeaderStyle);
            createHeaderCell(sHeader, 3, "Số lượng", tableHeaderStyle);
            createHeaderCell(sHeader, 4, "Đơn giá", tableHeaderStyle);
            createHeaderCell(sHeader, 5, "Thành tiền (VNĐ)", tableHeaderStyle);

            List<AdminInvoiceServiceItemResponse> sItems = invoice.serviceItems();
            if (sItems == null || sItems.isEmpty()) {
                Row emptyRow = sheet.createRow(rowIdx++);
                emptyRow.setHeightInPoints(20);
                createCell(emptyRow, 0, "Không có dịch vụ phát sinh", normalText);
                for (int c = 1; c <= 5; c++) createCell(emptyRow, c, "", normalText);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 5));
            } else {
                int sStt = 1;
                for (AdminInvoiceServiceItemResponse item : sItems) {
                    Row sRow = sheet.createRow(rowIdx++);
                    sRow.setHeightInPoints(20);
                    createCell(sRow, 0, String.valueOf(sStt++), centerText);
                    createCell(sRow, 1, item.name(), normalText);
                    createCell(sRow, 2, translateServiceType(item.type()), centerText);
                    createCell(sRow, 3, String.valueOf(item.quantity()), centerText);
                    createCurrencyCell(sRow, 4, item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO, currencyStyle);
                    createCurrencyCell(sRow, 5, item.totalPrice() != null ? item.totalPrice() : BigDecimal.ZERO, currencyStyle);
                }
            }
            // Subtotal dịch vụ
            Row sSubRow = sheet.createRow(rowIdx++);
            sSubRow.setHeightInPoints(22);
            createCell(sSubRow, 0, "Tổng tiền dịch vụ", boldText);
            for (int c = 1; c <= 4; c++) createCell(sSubRow, c, "", boldText);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));
            createCurrencyCell(sSubRow, 5, invoice.serviceCharge() != null ? invoice.serviceCharge() : BigDecimal.ZERO, boldCurrencyStyle);

            rowIdx++; // blank

            // Section 3: Phạt & Phí phát sinh
            rowIdx = addSectionTitle(sheet, rowIdx, "III. CHI TIẾT PHÍ PHẠT & PHÁT SINH", sectionHeaderStyle);
            Row pHeader = sheet.createRow(rowIdx++);
            pHeader.setHeightInPoints(22);
            createHeaderCell(pHeader, 0, "STT", tableHeaderStyle);
            createHeaderCell(pHeader, 1, "Khoản phạt / Phát sinh", tableHeaderStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 1, 3));
            createHeaderCell(pHeader, 2, "", tableHeaderStyle);
            createHeaderCell(pHeader, 3, "", tableHeaderStyle);
            createHeaderCell(pHeader, 4, "Ghi chú", tableHeaderStyle);
            createHeaderCell(pHeader, 5, "Số tiền (VNĐ)", tableHeaderStyle);

            List<AdminInvoicePenaltyItemResponse> pItems = invoice.penaltyItems();
            if (pItems == null || pItems.isEmpty()) {
                Row emptyRow = sheet.createRow(rowIdx++);
                emptyRow.setHeightInPoints(20);
                createCell(emptyRow, 0, "Không có phí phạt phát sinh", normalText);
                for (int c = 1; c <= 5; c++) createCell(emptyRow, c, "", normalText);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 5));
            } else {
                int pStt = 1;
                for (AdminInvoicePenaltyItemResponse pItem : pItems) {
                    Row pRow = sheet.createRow(rowIdx++);
                    pRow.setHeightInPoints(20);
                    createCell(pRow, 0, String.valueOf(pStt++), centerText);
                    createCell(pRow, 1, pItem.title(), normalText);
                    createCell(pRow, 2, "", normalText);
                    createCell(pRow, 3, "", normalText);
                    sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 1, 3));
                    createCell(pRow, 4, pItem.description() != null ? pItem.description() : "", normalText);
                    createCurrencyCell(pRow, 5, pItem.amount() != null ? pItem.amount() : BigDecimal.ZERO, currencyStyle);
                }
            }
            // Subtotal phạt
            Row pSubRow = sheet.createRow(rowIdx++);
            pSubRow.setHeightInPoints(22);
            createCell(pSubRow, 0, "Tổng phí phạt & phát sinh", boldText);
            for (int c = 1; c <= 4; c++) createCell(pSubRow, c, "", boldText);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));
            createCurrencyCell(pSubRow, 5, invoice.penaltyCharge() != null ? invoice.penaltyCharge() : BigDecimal.ZERO, boldCurrencyStyle);

            rowIdx++; // blank

            // Section 4: Lịch sử thanh toán
            rowIdx = addSectionTitle(sheet, rowIdx, "IV. LỊCH SỬ THANH TOÁN", sectionHeaderStyle);
            Row payHeader = sheet.createRow(rowIdx++);
            payHeader.setHeightInPoints(22);
            createHeaderCell(payHeader, 0, "STT", tableHeaderStyle);
            createHeaderCell(payHeader, 1, "Phương thức", tableHeaderStyle);
            createHeaderCell(payHeader, 2, "Mã giao dịch", tableHeaderStyle);
            createHeaderCell(payHeader, 3, "Thời gian", tableHeaderStyle);
            createHeaderCell(payHeader, 4, "Trạng thái", tableHeaderStyle);
            createHeaderCell(payHeader, 5, "Số tiền (VNĐ)", tableHeaderStyle);

            List<AdminPaymentResponse> payments = invoice.payments();
            if (payments == null || payments.isEmpty()) {
                Row emptyRow = sheet.createRow(rowIdx++);
                emptyRow.setHeightInPoints(20);
                createCell(emptyRow, 0, "Chưa có giao dịch thanh toán", normalText);
                for (int c = 1; c <= 5; c++) createCell(emptyRow, c, "", normalText);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 5));
            } else {
                int payStt = 1;
                for (AdminPaymentResponse pay : payments) {
                    Row payRow = sheet.createRow(rowIdx++);
                    payRow.setHeightInPoints(20);
                    createCell(payRow, 0, String.valueOf(payStt++), centerText);
                    createCell(payRow, 1, pay.paymentMethod() != null ? pay.paymentMethod() : "", centerText);
                    createCell(payRow, 2, pay.transactionNo() != null ? pay.transactionNo() : "-", centerText);
                    createCell(payRow, 3, pay.paymentTime() != null ? pay.paymentTime().format(DATE_TIME_FORMAT) : "", centerText);
                    createCell(payRow, 4, translatePaymentStatus(pay.status()), centerText);
                    createCurrencyCell(payRow, 5, pay.amount() != null ? pay.amount() : BigDecimal.ZERO, currencyStyle);
                }
            }

            rowIdx++; // blank

            // Section 5: Tổng kết hóa đơn
            rowIdx = addSectionTitle(sheet, rowIdx, "V. TỔNG KẾT THANH TOÁN HÓA ĐƠN", sectionHeaderStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "1. Tiền phòng thực thu:", invoice.roomCharge(), normalText, currencyStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "2. Tiền dịch vụ phát sinh:", invoice.serviceCharge(), normalText, currencyStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "3. Phí phạt & phát sinh:", invoice.penaltyCharge(), normalText, currencyStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "TỔNG TIỀN HÓA ĐƠN:", invoice.totalAmount(), boldText, boldCurrencyStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "ĐÃ THANH TOÁN:", invoice.paidAmount(), boldText, boldCurrencyStyle);
            rowIdx = addSummaryRow(sheet, rowIdx, "CÒN LẠI CẦN THANH TOÁN:", invoice.remainingAmount(), boldText, boldCurrencyStyle);

            autoSizeColumns(sheet, 6);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi khi tạo file Excel chi tiết hóa đơn", e);
            throw new RuntimeException("Không thể tạo file Excel chi tiết hóa đơn: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportInvoiceByBookingIdExcel(Long bookingId) {
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn cho đơn đặt phòng #" + bookingId));
        return exportSingleInvoiceExcel(invoice.getId());
    }

    // Helper methods for Excel formatting
    private int addSectionTitle(Sheet sheet, int rowIdx, String title, CellStyle style) {
        Row row = sheet.createRow(rowIdx++);
        row.setHeightInPoints(24);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 5));
        return rowIdx;
    }

    private int addSubHeader(Sheet sheet, int rowIdx, CellStyle headerStyle, String col1, String col2, String col3) {
        Row row = sheet.createRow(rowIdx++);
        row.setHeightInPoints(22);
        createHeaderCell(row, 0, col1, headerStyle);
        createHeaderCell(row, 1, col2, headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 1, 4));
        for (int c = 2; c <= 4; c++) createHeaderCell(row, c, "", headerStyle);
        createHeaderCell(row, 5, col3, headerStyle);
        return rowIdx;
    }

    private int add3ColDataRow(Sheet sheet, int rowIdx, String col1, String col2, BigDecimal amount, CellStyle textStyle, CellStyle numStyle) {
        Row row = sheet.createRow(rowIdx++);
        row.setHeightInPoints(20);
        createCell(row, 0, col1, textStyle);
        createCell(row, 1, col2, textStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 1, 4));
        for (int c = 2; c <= 4; c++) createCell(row, c, "", textStyle);
        createCurrencyCell(row, 5, amount, numStyle);
        return rowIdx;
    }

    private int addInfoRow(Sheet sheet, int rowIdx, String label1, String val1, String label2, String val2, CellStyle labelStyle, CellStyle valStyle) {
        Row row = sheet.createRow(rowIdx++);
        row.setHeightInPoints(20);
        createCell(row, 0, label1, labelStyle);
        createCell(row, 1, val1 != null ? val1 : "", valStyle);
        createCell(row, 2, "", valStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 1, 2));

        createCell(row, 3, label2, labelStyle);
        createCell(row, 4, val2 != null ? val2 : "", valStyle);
        createCell(row, 5, "", valStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 4, 5));
        return rowIdx;
    }

    private int addSummaryRow(Sheet sheet, int rowIdx, String label, BigDecimal amount, CellStyle labelStyle, CellStyle numStyle) {
        Row row = sheet.createRow(rowIdx++);
        row.setHeightInPoints(22);
        createCell(row, 0, label, labelStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));
        for (int c = 1; c <= 4; c++) createCell(row, c, "", labelStyle);
        createCurrencyCell(row, 5, amount != null ? amount : BigDecimal.ZERO, numStyle);
        return rowIdx;
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createSubtitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setItalic(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createSectionHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createTableHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.TEAL.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorder(style);
        return style;
    }

    private CellStyle createNormalTextStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        setBorder(style);
        return style;
    }

    private CellStyle createCenterTextStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        setBorder(style);
        return style;
    }

    private CellStyle createBoldTextStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        setBorder(style);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb, boolean bold) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0 \"đ\""));
        if (bold) {
            Font font = wb.createFont();
            font.setBold(true);
            style.setFont(font);
        }
        style.setAlignment(HorizontalAlignment.RIGHT);
        setBorder(style);
        return style;
    }

    private void setBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void createHeaderCell(Row row, int colIdx, String text, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(text);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int colIdx, String text, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(text != null ? text : "");
        cell.setCellStyle(style);
    }

    private void createCurrencyCell(Row row, int colIdx, BigDecimal amount, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(amount != null ? amount.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
            int currentWidth = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.max(currentWidth + 1200, 3200));
        }
    }

    private String translatePaymentStatus(String status) {
        if (status == null) return "Chưa thanh toán";
        return switch (status.toUpperCase()) {
            case "SUCCESS" -> "Thành công";
            case "PENDING" -> "Đang chờ";
            case "FAILED" -> "Thất bại";
            default -> status;
        };
    }

    private String translateBookingStatus(String status) {
        if (status == null) return "N/A";
        return switch (status.toUpperCase()) {
            case "COMPLETED" -> "Đã hoàn thành";
            case "CHECKED_IN" -> "Đang lưu trú";
            case "CONFIRMED" -> "Đã xác nhận";
            case "PENDING" -> "Chờ xác nhận";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }

    private String translateServiceType(String type) {
        if (type == null) return "Dịch vụ";
        return switch (type.toUpperCase()) {
            case "FACILITY" -> "Tiện ích";
            case "INVENTORY" -> "Thuê đồ";
            case "MINI_BAR" -> "Mini-bar";
            case "ADJUSTMENT" -> "Điều chỉnh";
            default -> type;
        };
    }
}
