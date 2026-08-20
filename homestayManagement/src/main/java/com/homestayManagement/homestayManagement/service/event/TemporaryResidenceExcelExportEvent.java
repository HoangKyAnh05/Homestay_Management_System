package com.homestayManagement.homestayManagement.service.event;

import java.time.LocalDate;

public record TemporaryResidenceExcelExportEvent(LocalDate date, Long bookingDetailId) {
}
