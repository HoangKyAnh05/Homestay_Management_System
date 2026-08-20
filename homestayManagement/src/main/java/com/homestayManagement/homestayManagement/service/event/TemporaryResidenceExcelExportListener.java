package com.homestayManagement.homestayManagement.service.event;

import com.homestayManagement.homestayManagement.service.TemporaryResidenceExcelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.nio.file.Path;

@Component
public class TemporaryResidenceExcelExportListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(TemporaryResidenceExcelExportListener.class);

    private final TemporaryResidenceExcelService temporaryResidenceExcelService;

    public TemporaryResidenceExcelExportListener(TemporaryResidenceExcelService temporaryResidenceExcelService) {
        this.temporaryResidenceExcelService = temporaryResidenceExcelService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void exportAfterCheckIn(TemporaryResidenceExcelExportEvent event) {
        try {
            Path outputPath = temporaryResidenceExcelService.exportByDate(event.date());
            LOGGER.info(
                    "Đã xuất file Excel khai báo tạm trú ngày {} sau check-in bookingDetailId={} tại {}",
                    event.date(),
                    event.bookingDetailId(),
                    outputPath.toAbsolutePath()
            );
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "Không thể xuất file Excel khai báo tạm trú ngày {} sau check-in bookingDetailId={}",
                    event.date(),
                    event.bookingDetailId(),
                    exception
            );
        }
    }
}
