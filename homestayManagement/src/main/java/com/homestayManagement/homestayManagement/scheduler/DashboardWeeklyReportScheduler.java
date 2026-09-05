package com.homestayManagement.homestayManagement.scheduler;

import com.homestayManagement.homestayManagement.service.DashboardExcelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DashboardWeeklyReportScheduler {

    private static final Logger log = LoggerFactory.getLogger(DashboardWeeklyReportScheduler.class);
    private final DashboardExcelService dashboardExcelService;

    public DashboardWeeklyReportScheduler(DashboardExcelService dashboardExcelService) {
        this.dashboardExcelService = dashboardExcelService;
    }

    /**
     * Tự động sinh file Excel báo cáo tuần vào 06:00 sáng mỗi Thứ Hai hàng tuần
     */
    @Scheduled(cron = "${app.dashboard.weekly-report-cron:0 0 6 ? * MON}")
    public void generateWeeklyDashboardReport() {
        log.info("Bắt đầu tác vụ tự động tạo báo cáo Excel tuần cho Homestay...");
        try {
            String fileName = dashboardExcelService.generateAndSaveWeeklyReport();
            log.info("Tự động tạo báo cáo tuần thành công: {}", fileName);
        } catch (Exception e) {
            log.error("Lỗi khi tự động tạo báo cáo Excel tuần", e);
        }
    }
}
