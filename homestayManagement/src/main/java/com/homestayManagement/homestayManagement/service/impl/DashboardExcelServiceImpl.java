package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.service.AdminDashboardService;
import com.homestayManagement.homestayManagement.service.DashboardExcelService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

@Service
public class DashboardExcelServiceImpl implements DashboardExcelService {

    private static final Logger log = LoggerFactory.getLogger(DashboardExcelServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final AdminDashboardService adminDashboardService;
    private final Path weeklyReportDirectory;

    public DashboardExcelServiceImpl(
            AdminDashboardService adminDashboardService,
            @Value("${app.dashboard.weekly-report-dir:exports/dashboard-reports/weekly}") String weeklyReportDir
    ) {
        this.adminDashboardService = adminDashboardService;
        this.weeklyReportDirectory = Path.of(weeklyReportDir);
    }

    @Override
    public byte[] generateDashboardExcel(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate end = toDate != null ? toDate : LocalDate.now();
        AdminDashboardSummaryResponse summary = adminDashboardService.getSummary(start, end);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle subtitleStyle = createSubtitleStyle(workbook);
            CellStyle sectionHeaderStyle = createSectionHeaderStyle(workbook);
            CellStyle tableHeaderStyle = createTableHeaderStyle(workbook);
            CellStyle normalTextStyle = createNormalTextStyle(workbook);
            CellStyle boldTextStyle = createBoldTextStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook, false);
            CellStyle boldCurrencyStyle = createCurrencyStyle(workbook, true);
            CellStyle percentStyle = createPercentStyle(workbook, false);
            CellStyle boldPercentStyle = createPercentStyle(workbook, true);
            CellStyle integerStyle = createIntegerStyle(workbook, false);
            CellStyle boldIntegerStyle = createIntegerStyle(workbook, true);

            // Sheet 1: Tổng quan & KPIs
            buildOverviewSheet(workbook, summary, titleStyle, subtitleStyle, sectionHeaderStyle,
                    tableHeaderStyle, normalTextStyle, boldTextStyle, currencyStyle, boldCurrencyStyle,
                    percentStyle, integerStyle, boldIntegerStyle);

            // Sheet 2: Xu hướng theo ngày
            buildDailyTrendSheet(workbook, summary, titleStyle, subtitleStyle, tableHeaderStyle,
                    normalTextStyle, boldTextStyle, currencyStyle, boldCurrencyStyle, percentStyle,
                    boldPercentStyle, integerStyle, boldIntegerStyle);

            // Sheet 3: Phân tích phòng & loại phòng
            buildRoomAnalysisSheet(workbook, summary, titleStyle, subtitleStyle, sectionHeaderStyle,
                    tableHeaderStyle, normalTextStyle, boldTextStyle, currencyStyle, boldCurrencyStyle,
                    percentStyle, integerStyle, boldIntegerStyle);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Loi khi tao file Excel bao cao tong quan", e);
            throw new RuntimeException("Không thể tạo file Excel báo cáo: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateAndSaveWeeklyReport() {
        LocalDate today = LocalDate.now();
        LocalDate lastMonday = today.minusWeeks(1).with(DayOfWeek.MONDAY);
        LocalDate lastSunday = lastMonday.plusDays(6);

        String fileName = String.format("Bao_Cao_Tuan_Tu_%s_Den_%s.xlsx",
                lastMonday.format(DateTimeFormatter.BASIC_ISO_DATE),
                lastSunday.format(DateTimeFormatter.BASIC_ISO_DATE));

        try {
            Files.createDirectories(weeklyReportDirectory);
            Path filePath = weeklyReportDirectory.resolve(fileName);

            byte[] excelData = generateDashboardExcel(lastMonday, lastSunday);
            Files.write(filePath, excelData);
            log.info("Da tu dong sinh bao cao tuan thanh cong: {}", filePath.toAbsolutePath());
            return fileName;
        } catch (IOException e) {
            log.error("Khong the luu file bao cao tuan: {}", fileName, e);
            throw new RuntimeException("Không thể lưu file báo cáo tuần: " + e.getMessage(), e);
        }
    }

    @Override
    public List<WeeklyReportFileResponse> getWeeklyReports() {
        if (!Files.exists(weeklyReportDirectory)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.list(weeklyReportDirectory)) {
            return stream
                    .filter(path -> !Files.isDirectory(path) && path.getFileName().toString().endsWith(".xlsx"))
                    .map(path -> {
                        String name = path.getFileName().toString();
                        long size = 0;
                        LocalDateTime createdAt = LocalDateTime.now();
                        try {
                            size = Files.size(path);
                            createdAt = LocalDateTime.ofInstant(
                                    Files.getLastModifiedTime(path).toInstant(),
                                    TimeZone.getDefault().toZoneId()
                            );
                        } catch (IOException ignored) {
                        }
                        String label = parseDateRangeLabel(name);
                        String downloadUrl = "/api/admin/dashboard/weekly-reports/" + name;
                        return new WeeklyReportFileResponse(name, label, size, createdAt, downloadUrl);
                    })
                    .sorted(Comparator.comparing(WeeklyReportFileResponse::createdAt).reversed())
                    .toList();
        } catch (IOException e) {
            log.error("Loi khi doc danh sach bao cao tuan", e);
            return List.of();
        }
    }

    @Override
    public byte[] getWeeklyReportContent(String fileName) {
        if (fileName == null || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        Path target = weeklyReportDirectory.resolve(fileName);
        if (!Files.exists(target)) {
            throw new IllegalArgumentException("Không tìm thấy file báo cáo: " + fileName);
        }
        try {
            return Files.readAllBytes(target);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi đọc file báo cáo: " + e.getMessage(), e);
        }
    }

    // ================== SHEET BUILDERS ==================

    private void buildOverviewSheet(
            Workbook workbook, AdminDashboardSummaryResponse summary,
            CellStyle titleStyle, CellStyle subtitleStyle, CellStyle sectionHeaderStyle,
            CellStyle tableHeaderStyle, CellStyle normalTextStyle, CellStyle boldTextStyle,
            CellStyle currencyStyle, CellStyle boldCurrencyStyle, CellStyle percentStyle,
            CellStyle integerStyle, CellStyle boldIntegerStyle
    ) {
        Sheet sheet = workbook.createSheet("Tổng quan & KPIs");
        sheet.setDisplayGridlines(true);

        int rowIdx = 0;

        // Title
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO TỔNG QUAN HOẠT ĐỘNG KINH DOANH HOMESTAY LÁ ĐỎ");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

        // Subtitle
        Row subRow = sheet.createRow(rowIdx++);
        Cell subCell = subRow.createCell(0);
        String subText = String.format("Kỳ báo cáo: từ ngày %s đến ngày %s | Xuất lúc: %s",
                summary.fromDate().format(DATE_FORMAT),
                summary.toDate().format(DATE_FORMAT),
                LocalDateTime.now().format(DATE_TIME_FORMAT));
        subCell.setCellValue(subText);
        subCell.setCellStyle(subtitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

        rowIdx++; // Empty row

        // Section A: Chỉ số KPI
        Row secRowA = sheet.createRow(rowIdx++);
        Cell secCellA = secRowA.createCell(0);
        secCellA.setCellValue("1. CÁC CHỈ SỐ KPI CỐT LÕI");
        secCellA.setCellStyle(sectionHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 3));

        Row kpiHeader = sheet.createRow(rowIdx++);
        createHeaderCell(kpiHeader, 0, "STT", tableHeaderStyle);
        createHeaderCell(kpiHeader, 1, "Chỉ số kinh doanh", tableHeaderStyle);
        createHeaderCell(kpiHeader, 2, "Giá trị", tableHeaderStyle);
        createHeaderCell(kpiHeader, 3, "Đơn vị / Ghi chú", tableHeaderStyle);

        AdminDashboardKpiResponse kpis = summary.kpis();
        Object[][] kpiData = {
                {"1", "Tổng doanh thu thuần", kpis != null ? kpis.totalRevenue() : BigDecimal.ZERO, "VND (Tổng thực thu hóa đơn)", "CURRENCY_BOLD"},
                {"2", "Doanh thu tiền phòng", kpis != null ? kpis.roomRevenue() : BigDecimal.ZERO, "VND (Tiền thuê phòng)", "CURRENCY"},
                {"3", "Doanh thu dịch vụ", kpis != null ? kpis.serviceRevenue() : BigDecimal.ZERO, "VND (Dịch vụ ăn uống, tiện ích)", "CURRENCY"},
                {"4", "Doanh thu phạt & phụ thu", kpis != null ? kpis.penaltyRevenue() : BigDecimal.ZERO, "VND (Quá giờ, thêm khách, phụ phí)", "CURRENCY"},
                {"5", "Tổng số booking lưu trú", kpis != null ? kpis.bookingCount() : 0L, "Đơn đặt có lưu trú trong kỳ", "INTEGER"},
                {"6", "Công suất phòng trung bình", kpis != null && kpis.averageOccupancyRate() != null ? kpis.averageOccupancyRate() / 100.0 : 0.0, "Tỷ lệ lấp đầy phòng trung bình", "PERCENT"},
                {"7", "Số phòng-đêm đã sử dụng", kpis != null ? kpis.occupiedRoomNights() : 0L, "Phòng-đêm", "INTEGER"},
                {"8", "Tổng số phòng đang quản lý", kpis != null ? kpis.totalRooms() : 0, "Phòng", "INTEGER"}
        };

        for (Object[] item : kpiData) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, (String) item[0], normalTextStyle);
            createCell(r, 1, (String) item[1], normalTextStyle);

            Cell valCell = r.createCell(2);
            String type = (String) item[4];
            if ("CURRENCY_BOLD".equals(type)) {
                valCell.setCellValue(((BigDecimal) item[2]).doubleValue());
                valCell.setCellStyle(boldCurrencyStyle);
            } else if ("CURRENCY".equals(type)) {
                valCell.setCellValue(((BigDecimal) item[2]).doubleValue());
                valCell.setCellStyle(currencyStyle);
            } else if ("PERCENT".equals(type)) {
                valCell.setCellValue((Double) item[2]);
                valCell.setCellStyle(percentStyle);
            } else {
                valCell.setCellValue(((Number) item[2]).doubleValue());
                valCell.setCellStyle(integerStyle);
            }

            createCell(r, 3, (String) item[3], normalTextStyle);
        }

        rowIdx++; // Empty row

        // Section B: Phân bổ cơ cấu doanh thu
        Row secRowB = sheet.createRow(rowIdx++);
        Cell secCellB = secRowB.createCell(0);
        secCellB.setCellValue("2. CƠ CẤU DOANH THU");
        secCellB.setCellStyle(sectionHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 3));

        Row revHeader = sheet.createRow(rowIdx++);
        createHeaderCell(revHeader, 0, "STT", tableHeaderStyle);
        createHeaderCell(revHeader, 1, "Khoản mục doanh thu", tableHeaderStyle);
        createHeaderCell(revHeader, 2, "Số tiền (VND)", tableHeaderStyle);
        createHeaderCell(revHeader, 3, "Tỷ trọng đóng góp", tableHeaderStyle);

        BigDecimal totalRev = kpis != null && kpis.totalRevenue() != null ? kpis.totalRevenue() : BigDecimal.ZERO;
        List<AdminDashboardNameValueResponse> revBreakdown = summary.revenueBreakdown() != null ? summary.revenueBreakdown() : List.of();
        int bIdx = 1;
        for (AdminDashboardNameValueResponse item : revBreakdown) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, String.valueOf(bIdx++), normalTextStyle);
            createCell(r, 1, item.name(), normalTextStyle);

            Cell amtCell = r.createCell(2);
            BigDecimal val = item.value() != null ? item.value() : BigDecimal.ZERO;
            amtCell.setCellValue(val.doubleValue());
            amtCell.setCellStyle(currencyStyle);

            Cell pctCell = r.createCell(3);
            double pct = totalRev.compareTo(BigDecimal.ZERO) > 0
                    ? val.divide(totalRev, 4, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            pctCell.setCellValue(pct);
            pctCell.setCellStyle(percentStyle);
        }

        rowIdx++; // Empty row

        // Section C: Trạng thái lưu trú booking
        Row secRowC = sheet.createRow(rowIdx++);
        Cell secCellC = secRowC.createCell(0);
        secCellC.setCellValue("3. TRẠNG THÁI BOOKING LƯU TRÚ");
        secCellC.setCellStyle(sectionHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 3));

        Row stHeader = sheet.createRow(rowIdx++);
        createHeaderCell(stHeader, 0, "STT", tableHeaderStyle);
        createHeaderCell(stHeader, 1, "Trạng thái đặt phòng", tableHeaderStyle);
        createHeaderCell(stHeader, 2, "Số lượng booking", tableHeaderStyle);
        createHeaderCell(stHeader, 3, "Tỷ lệ (%)", tableHeaderStyle);

        List<AdminDashboardNameValueResponse> statusList = summary.bookingStatusBreakdown() != null ? summary.bookingStatusBreakdown() : List.of();
        long totalStatusCount = statusList.stream().mapToLong(s -> s.count() != null ? s.count() : 0L).sum();
        int sIdx = 1;
        for (AdminDashboardNameValueResponse item : statusList) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, String.valueOf(sIdx++), normalTextStyle);
            createCell(r, 1, translateStatus(item.name()), normalTextStyle);

            Cell cntCell = r.createCell(2);
            long count = item.count() != null ? item.count() : 0L;
            cntCell.setCellValue(count);
            cntCell.setCellStyle(integerStyle);

            Cell pctCell = r.createCell(3);
            double pct = totalStatusCount > 0 ? (double) count / totalStatusCount : 0.0;
            pctCell.setCellValue(pct);
            pctCell.setCellStyle(percentStyle);
        }

        autoSizeColumns(sheet, 4);
    }

    private void buildDailyTrendSheet(
            Workbook workbook, AdminDashboardSummaryResponse summary,
            CellStyle titleStyle, CellStyle subtitleStyle, CellStyle tableHeaderStyle,
            CellStyle normalTextStyle, CellStyle boldTextStyle, CellStyle currencyStyle,
            CellStyle boldCurrencyStyle, CellStyle percentStyle, CellStyle boldPercentStyle,
            CellStyle integerStyle, CellStyle boldIntegerStyle
    ) {
        Sheet sheet = workbook.createSheet("Xu hướng theo ngày");
        sheet.setDisplayGridlines(true);

        int rowIdx = 0;

        // Title
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BẢNG KÊ DOANH THU VÀ CÔNG SUẤT THEO NGÀY");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 8));

        // Subtitle
        Row subRow = sheet.createRow(rowIdx++);
        Cell subCell = subRow.createCell(0);
        String subText = String.format("Kỳ phân tích: %s - %s",
                summary.fromDate().format(DATE_FORMAT),
                summary.toDate().format(DATE_FORMAT));
        subCell.setCellValue(subText);
        subCell.setCellStyle(subtitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 8));

        rowIdx++; // Empty row

        // Headers
        Row h = sheet.createRow(rowIdx++);
        createHeaderCell(h, 0, "STT", tableHeaderStyle);
        createHeaderCell(h, 1, "Ngày", tableHeaderStyle);
        createHeaderCell(h, 2, "Tiền phòng (VND)", tableHeaderStyle);
        createHeaderCell(h, 3, "Tiền dịch vụ (VND)", tableHeaderStyle);
        createHeaderCell(h, 4, "Phạt & Phụ thu (VND)", tableHeaderStyle);
        createHeaderCell(h, 5, "Tổng doanh thu (VND)", tableHeaderStyle);
        createHeaderCell(h, 6, "Số phòng dùng", tableHeaderStyle);
        createHeaderCell(h, 7, "Tổng phòng", tableHeaderStyle);
        createHeaderCell(h, 8, "Công suất phòng", tableHeaderStyle);

        List<AdminDashboardRevenuePointResponse> revTrend = summary.revenueTrend() != null ? summary.revenueTrend() : List.of();
        List<AdminDashboardOccupancyPointResponse> occTrend = summary.occupancyTrend() != null ? summary.occupancyTrend() : List.of();

        Map<LocalDate, AdminDashboardOccupancyPointResponse> occMap = new HashMap<>();
        for (AdminDashboardOccupancyPointResponse occ : occTrend) {
            if (occ.date() != null) occMap.put(occ.date(), occ);
        }

        BigDecimal sumRoom = BigDecimal.ZERO;
        BigDecimal sumService = BigDecimal.ZERO;
        BigDecimal sumPenalty = BigDecimal.ZERO;
        BigDecimal sumTotal = BigDecimal.ZERO;
        int sumOccRooms = 0;

        int stt = 1;
        for (AdminDashboardRevenuePointResponse rev : revTrend) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, String.valueOf(stt++), normalTextStyle);
            createCell(r, 1, rev.date() != null ? rev.date().format(DATE_FORMAT) : "", normalTextStyle);

            BigDecimal room = rev.roomRevenue() != null ? rev.roomRevenue() : BigDecimal.ZERO;
            BigDecimal srv = rev.serviceRevenue() != null ? rev.serviceRevenue() : BigDecimal.ZERO;
            BigDecimal pen = rev.penaltyRevenue() != null ? rev.penaltyRevenue() : BigDecimal.ZERO;
            BigDecimal tot = rev.totalRevenue() != null ? rev.totalRevenue() : BigDecimal.ZERO;

            sumRoom = sumRoom.add(room);
            sumService = sumService.add(srv);
            sumPenalty = sumPenalty.add(pen);
            sumTotal = sumTotal.add(tot);

            Cell cRoom = r.createCell(2);
            cRoom.setCellValue(room.doubleValue());
            cRoom.setCellStyle(currencyStyle);

            Cell cSrv = r.createCell(3);
            cSrv.setCellValue(srv.doubleValue());
            cSrv.setCellStyle(currencyStyle);

            Cell cPen = r.createCell(4);
            cPen.setCellValue(pen.doubleValue());
            cPen.setCellStyle(currencyStyle);

            Cell cTot = r.createCell(5);
            cTot.setCellValue(tot.doubleValue());
            cTot.setCellStyle(currencyStyle);

            AdminDashboardOccupancyPointResponse occ = occMap.get(rev.date());
            int occCount = (occ != null && occ.occupiedRooms() != null) ? occ.occupiedRooms() : 0;
            int totRooms = (occ != null && occ.totalRooms() != null) ? occ.totalRooms() : (summary.kpis() != null ? summary.kpis().totalRooms() : 0);
            double rate = (occ != null && occ.occupancyRate() != null) ? occ.occupancyRate() / 100.0 : 0.0;

            sumOccRooms += occCount;

            Cell cOccCount = r.createCell(6);
            cOccCount.setCellValue(occCount);
            cOccCount.setCellStyle(integerStyle);

            Cell cTotRooms = r.createCell(7);
            cTotRooms.setCellValue(totRooms);
            cTotRooms.setCellStyle(integerStyle);

            Cell cRate = r.createCell(8);
            cRate.setCellValue(rate);
            cRate.setCellStyle(percentStyle);
        }

        // Summary Row
        Row sumRow = sheet.createRow(rowIdx++);
        createCell(sumRow, 0, "", boldTextStyle);
        createCell(sumRow, 1, "TỔNG CỘNG", boldTextStyle);

        Cell sumRoomCell = sumRow.createCell(2);
        sumRoomCell.setCellValue(sumRoom.doubleValue());
        sumRoomCell.setCellStyle(boldCurrencyStyle);

        Cell sumSrvCell = sumRow.createCell(3);
        sumSrvCell.setCellValue(sumService.doubleValue());
        sumSrvCell.setCellStyle(boldCurrencyStyle);

        Cell sumPenCell = sumRow.createCell(4);
        sumPenCell.setCellValue(sumPenalty.doubleValue());
        sumPenCell.setCellStyle(boldCurrencyStyle);

        Cell sumTotCell = sumRow.createCell(5);
        sumTotCell.setCellValue(sumTotal.doubleValue());
        sumTotCell.setCellStyle(boldCurrencyStyle);

        Cell sumOccCell = sumRow.createCell(6);
        sumOccCell.setCellValue(sumOccRooms);
        sumOccCell.setCellStyle(boldIntegerStyle);

        createCell(sumRow, 7, "-", boldTextStyle);

        Cell avgRateCell = sumRow.createCell(8);
        double avgRate = summary.kpis() != null && summary.kpis().averageOccupancyRate() != null
                ? summary.kpis().averageOccupancyRate() / 100.0
                : 0.0;
        avgRateCell.setCellValue(avgRate);
        avgRateCell.setCellStyle(boldPercentStyle);

        autoSizeColumns(sheet, 9);
    }

    private void buildRoomAnalysisSheet(
            Workbook workbook, AdminDashboardSummaryResponse summary,
            CellStyle titleStyle, CellStyle subtitleStyle, CellStyle sectionHeaderStyle,
            CellStyle tableHeaderStyle, CellStyle normalTextStyle, CellStyle boldTextStyle,
            CellStyle currencyStyle, CellStyle boldCurrencyStyle, CellStyle percentStyle,
            CellStyle integerStyle, CellStyle boldIntegerStyle
    ) {
        Sheet sheet = workbook.createSheet("Phân tích Phòng");
        sheet.setDisplayGridlines(true);

        int rowIdx = 0;

        // Title
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("HIỆU QUẢ THEO PHÒNG & LOẠI PHÒNG");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

        // Subtitle
        Row subRow = sheet.createRow(rowIdx++);
        Cell subCell = subRow.createCell(0);
        subCell.setCellValue(String.format("Kỳ phân tích: %s - %s",
                summary.fromDate().format(DATE_FORMAT),
                summary.toDate().format(DATE_FORMAT)));
        subCell.setCellStyle(subtitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

        rowIdx++; // Empty row

        // Table 1: Top phòng theo doanh thu
        Row secRow1 = sheet.createRow(rowIdx++);
        Cell secCell1 = secRow1.createCell(0);
        secCell1.setCellValue("1. DOANH THU THEO TỪNG PHÒNG");
        secCell1.setCellStyle(sectionHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 3));

        Row h1 = sheet.createRow(rowIdx++);
        createHeaderCell(h1, 0, "Thứ hạng", tableHeaderStyle);
        createHeaderCell(h1, 1, "Tên phòng", tableHeaderStyle);
        createHeaderCell(h1, 2, "Doanh thu (VND)", tableHeaderStyle);
        createHeaderCell(h1, 3, "Tỷ lệ đóng góp (%)", tableHeaderStyle);

        List<AdminDashboardNameValueResponse> topRooms = summary.topRooms() != null ? summary.topRooms() : List.of();
        BigDecimal totalRoomRev = topRooms.stream()
                .map(r -> r.value() != null ? r.value() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int rRank = 1;
        for (AdminDashboardNameValueResponse room : topRooms) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, String.valueOf(rRank++), normalTextStyle);
            createCell(r, 1, room.name(), normalTextStyle);

            Cell valCell = r.createCell(2);
            BigDecimal val = room.value() != null ? room.value() : BigDecimal.ZERO;
            valCell.setCellValue(val.doubleValue());
            valCell.setCellStyle(currencyStyle);

            Cell pctCell = r.createCell(3);
            double pct = totalRoomRev.compareTo(BigDecimal.ZERO) > 0
                    ? val.divide(totalRoomRev, 4, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            pctCell.setCellValue(pct);
            pctCell.setCellStyle(percentStyle);
        }

        rowIdx++; // Empty row

        // Table 2: Loại phòng được đặt nhiều
        Row secRow2 = sheet.createRow(rowIdx++);
        Cell secCell2 = secRow2.createCell(0);
        secCell2.setCellValue("2. SỐ LƯỢT ĐẶT THEO LOẠI PHÒNG");
        secCell2.setCellStyle(sectionHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 3));

        Row h2 = sheet.createRow(rowIdx++);
        createHeaderCell(h2, 0, "Thứ hạng", tableHeaderStyle);
        createHeaderCell(h2, 1, "Loại phòng", tableHeaderStyle);
        createHeaderCell(h2, 2, "Số lượt đặt (lượt)", tableHeaderStyle);
        createHeaderCell(h2, 3, "Tỷ lệ (%)", tableHeaderStyle);

        List<AdminDashboardNameValueResponse> typeList = summary.roomTypeBreakdown() != null ? summary.roomTypeBreakdown() : List.of();
        long totalBookings = typeList.stream()
                .mapToLong(t -> t.count() != null ? t.count() : 0L)
                .sum();

        int tRank = 1;
        for (AdminDashboardNameValueResponse type : typeList) {
            Row r = sheet.createRow(rowIdx++);
            createCell(r, 0, String.valueOf(tRank++), normalTextStyle);
            createCell(r, 1, type.name(), normalTextStyle);

            Cell cntCell = r.createCell(2);
            long count = type.count() != null ? type.count() : 0L;
            cntCell.setCellValue(count);
            cntCell.setCellStyle(integerStyle);

            Cell pctCell = r.createCell(3);
            double pct = totalBookings > 0 ? (double) count / totalBookings : 0.0;
            pctCell.setCellValue(pct);
            pctCell.setCellStyle(percentStyle);
        }

        autoSizeColumns(sheet, 4);
    }

    // ================== HELPER STYLES & METHODS ==================

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.DARK_GREEN.getIndex());
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
        return style;
    }

    private CellStyle createSectionHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
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

    private CellStyle createPercentStyle(Workbook wb, boolean bold) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("0.0%"));
        if (bold) {
            Font font = wb.createFont();
            font.setBold(true);
            style.setFont(font);
        }
        style.setAlignment(HorizontalAlignment.RIGHT);
        setBorder(style);
        return style;
    }

    private CellStyle createIntegerStyle(Workbook wb, boolean bold) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
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
        cell.setCellValue(text);
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
            int currentWidth = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.max(currentWidth + 1200, 3000));
        }
    }

    private String translateStatus(String status) {
        if (status == null) return "";
        return switch (status.toUpperCase()) {
            case "COMPLETED" -> "Đã trả phòng";
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "CHECKED_IN" -> "Đang lưu trú";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }

    private String parseDateRangeLabel(String fileName) {
        try {
            // Pattern: Bao_Cao_Tuan_Tu_yyyyMMdd_Den_yyyyMMdd.xlsx
            if (fileName.startsWith("Bao_Cao_Tuan_Tu_") && fileName.endsWith(".xlsx")) {
                String clean = fileName.replace("Bao_Cao_Tuan_Tu_", "").replace(".xlsx", "");
                String[] parts = clean.split("_Den_");
                if (parts.length == 2) {
                    LocalDate start = LocalDate.parse(parts[0], DateTimeFormatter.BASIC_ISO_DATE);
                    LocalDate end = LocalDate.parse(parts[1], DateTimeFormatter.BASIC_ISO_DATE);
                    return String.format("Tuần từ %s đến %s", start.format(DATE_FORMAT), end.format(DATE_FORMAT));
                }
            }
        } catch (Exception ignored) {
        }
        return fileName;
    }
}
