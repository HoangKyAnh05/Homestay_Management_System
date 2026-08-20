package com.homestayManagement.homestayManagement.service;

import java.nio.file.Path;
import java.time.LocalDate;

public interface TemporaryResidenceExcelService {
    Path exportByDate(LocalDate date);
}
