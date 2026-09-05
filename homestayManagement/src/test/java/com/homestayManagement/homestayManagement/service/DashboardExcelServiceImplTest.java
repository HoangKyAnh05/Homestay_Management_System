package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.service.impl.DashboardExcelServiceImpl;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardExcelServiceImplTest {

    @Mock
    private AdminDashboardService adminDashboardService;

    @TempDir
    Path tempDir;

    @Test
    void generateDashboardExcelCreatesThreeSheetsWithExpectedData() throws Exception {
        LocalDate fromDate = LocalDate.of(2026, 8, 3);
        LocalDate toDate = LocalDate.of(2026, 9, 3);

        AdminDashboardKpiResponse kpis = new AdminDashboardKpiResponse(
                BigDecimal.valueOf(7600000),
                BigDecimal.valueOf(4420000),
                BigDecimal.valueOf(233000),
                BigDecimal.valueOf(2947000),
                50L,
                31L,
                9,
                10.8
        );

        AdminDashboardSummaryResponse summary = new AdminDashboardSummaryResponse(
                fromDate,
                toDate,
                kpis,
                List.of(new AdminDashboardRevenuePointResponse(
                        fromDate,
                        BigDecimal.valueOf(1000000),
                        BigDecimal.valueOf(50000),
                        BigDecimal.ZERO,
                        BigDecimal.valueOf(1050000)
                )),
                List.of(new AdminDashboardOccupancyPointResponse(
                        fromDate,
                        2,
                        9,
                        22.2
                )),
                List.of(new AdminDashboardNameValueResponse("COMPLETED", BigDecimal.ZERO, 22L)),
                List.of(new AdminDashboardNameValueResponse("Tiền phòng", BigDecimal.valueOf(4420000), 0L)),
                List.of(new AdminDashboardNameValueResponse("Phòng 102", BigDecimal.valueOf(1300000), 0L)),
                List.of(new AdminDashboardNameValueResponse("Phòng 1", BigDecimal.ZERO, 26L))
        );

        when(adminDashboardService.getSummary(any(), any())).thenReturn(summary);

        DashboardExcelServiceImpl service = new DashboardExcelServiceImpl(
                adminDashboardService,
                tempDir.toString()
        );

        byte[] excelBytes = service.generateDashboardExcel(fromDate, toDate);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (ByteArrayInputStream in = new ByteArrayInputStream(excelBytes);
             Workbook workbook = WorkbookFactory.create(in)) {

            assertEquals(3, workbook.getNumberOfSheets());

            Sheet sheet1 = workbook.getSheet("Tổng quan & KPIs");
            assertNotNull(sheet1);
            assertTrue(sheet1.getRow(0).getCell(0).getStringCellValue().contains("HOMESTAY LÁ ĐỎ"));

            Sheet sheet2 = workbook.getSheet("Xu hướng theo ngày");
            assertNotNull(sheet2);
            assertEquals("BẢNG KÊ DOANH THU VÀ CÔNG SUẤT THEO NGÀY", sheet2.getRow(0).getCell(0).getStringCellValue());

            Sheet sheet3 = workbook.getSheet("Phân tích Phòng");
            assertNotNull(sheet3);
            assertEquals("HIỆU QUẢ THEO PHÒNG & LOẠI PHÒNG", sheet3.getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    void generateAndSaveWeeklyReportCreatesFileInDirectory() {
        AdminDashboardKpiResponse kpis = new AdminDashboardKpiResponse(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                0L, 0L, 9, 0.0
        );
        AdminDashboardSummaryResponse summary = new AdminDashboardSummaryResponse(
                LocalDate.now().minusWeeks(1),
                LocalDate.now(),
                kpis,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
        when(adminDashboardService.getSummary(any(), any())).thenReturn(summary);

        DashboardExcelServiceImpl service = new DashboardExcelServiceImpl(
                adminDashboardService,
                tempDir.toString()
        );

        String savedFile = service.generateAndSaveWeeklyReport();

        assertNotNull(savedFile);
        assertTrue(savedFile.startsWith("Bao_Cao_Tuan_Tu_"));
        assertTrue(savedFile.endsWith(".xlsx"));

        List<WeeklyReportFileResponse> reports = service.getWeeklyReports();
        assertEquals(1, reports.size());
        assertEquals(savedFile, reports.get(0).fileName());
    }
}
