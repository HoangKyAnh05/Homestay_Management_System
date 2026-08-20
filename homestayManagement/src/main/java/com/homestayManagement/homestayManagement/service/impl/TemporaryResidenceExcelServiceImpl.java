package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.excel.TemporaryResidenceExportRow;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.service.TemporaryResidenceExcelService;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TemporaryResidenceExcelServiceImpl implements TemporaryResidenceExcelService {

    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.ISO_DATE;
    private static final String[] HEADERS = {
            "STT",
            "Mã booking",
            "Phòng",
            "Họ và tên",
            "Ngày sinh",
            "Tuổi",
            "Số điện thoại",
            "Số CCCD",
            "Địa chỉ",
            "Thời gian check-in",
            "Check-out dự kiến"
    };

    private final CheckInRecordRepository checkInRecordRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final Path exportDirectory;
    private final Map<LocalDate, Object> writeLocks = new ConcurrentHashMap<>();

    public TemporaryResidenceExcelServiceImpl(
            CheckInRecordRepository checkInRecordRepository,
            BookingGuestRepository bookingGuestRepository,
            @Value("${app.temporary-residence.export-dir:exports/temporary-residence}") String exportDirectory
    ) {
        this.checkInRecordRepository = checkInRecordRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.exportDirectory = Path.of(exportDirectory);
    }

    @Override
    @Transactional(readOnly = true)
    public Path exportByDate(LocalDate date) {
        LocalDate exportDate = date != null ? date : LocalDate.now();
        List<TemporaryResidenceExportRow> rows = buildRows(exportDate);
        Path outputPath = exportDirectory.resolve("temporary-residence-" + exportDate.format(FILE_DATE_FORMAT) + ".xlsx");
        Object lock = writeLocks.computeIfAbsent(exportDate, ignored -> new Object());
        synchronized (lock) {
            writeWorkbook(exportDate, rows, outputPath);
        }
        return outputPath;
    }

    private List<TemporaryResidenceExportRow> buildRows(LocalDate date) {
        LocalDateTime startInclusive = date.atStartOfDay();
        LocalDateTime endExclusive = date.plusDays(1).atStartOfDay();
        List<CheckInRecord> records = checkInRecordRepository.findByActualCheckInRangeForTemporaryResidence(
                startInclusive,
                endExclusive
        );
        if (records.isEmpty()) {
            return List.of();
        }

        List<Long> detailIds = records.stream()
                .map(CheckInRecord::getBookingDetail)
                .map(BookingDetail::getId)
                .toList();
        Map<Long, List<BookingGuest>> guestsByDetail = bookingGuestRepository.findByBookingDetailIds(detailIds).stream()
                .collect(Collectors.groupingBy(guest -> guest.getBookingDetail().getId()));

        List<TemporaryResidenceExportRow> rows = records.stream()
                .flatMap(record -> guestsByDetail.getOrDefault(record.getBookingDetail().getId(), List.of()).stream()
                        .sorted(Comparator.comparing(BookingGuest::isPrimaryGuest).reversed()
                                .thenComparing(BookingGuest::getFullName, Comparator.nullsLast(String::compareToIgnoreCase)))
                        .map(guest -> toRow(record, guest, date)))
                .toList();

        return java.util.stream.IntStream.range(0, rows.size())
                .mapToObj(index -> {
                    TemporaryResidenceExportRow row = rows.get(index);
                    return new TemporaryResidenceExportRow(
                            index + 1,
                            row.bookingCode(),
                            row.roomNumber(),
                            row.fullName(),
                            row.dateOfBirth(),
                            row.age(),
                            row.phone(),
                            row.identityDocumentNumber(),
                            row.address(),
                            row.actualCheckIn(),
                            row.expectedCheckOut()
                    );
                })
                .toList();
    }

    private TemporaryResidenceExportRow toRow(CheckInRecord record, BookingGuest guest, LocalDate exportDate) {
        BookingDetail detail = record.getBookingDetail();
        return new TemporaryResidenceExportRow(
                0,
                detail.getBooking().getBookingCode(),
                detail.getRoom() != null ? detail.getRoom().getRoomNumber() : "",
                guest.getFullName(),
                guest.getDateOfBirth(),
                calculateAge(guest.getDateOfBirth(), exportDate),
                guest.getPhone(),
                guest.getIdentityDocumentNumber(),
                guest.getAddress(),
                record.getActualCheckIn(),
                detail.getCheckOutTarget()
        );
    }

    private void writeWorkbook(LocalDate date, List<TemporaryResidenceExportRow> rows, Path outputPath) {
        Path tempPath = null;
        try {
            Files.createDirectories(outputPath.getParent());
            tempPath = Files.createTempFile(
                    outputPath.getParent(),
                    outputPath.getFileName().toString() + ".",
                    ".tmp"
            );
            try (Workbook workbook = new XSSFWorkbook();
                 OutputStream outputStream = Files.newOutputStream(tempPath)) {
                Sheet sheet = workbook.createSheet("Khai bao tam tru");
                CellStyle titleStyle = titleStyle(workbook);
                CellStyle subtitleStyle = subtitleStyle(workbook);
                CellStyle headerStyle = headerStyle(workbook);
                CellStyle textStyle = borderedStyle(workbook);
                CellStyle centerStyle = borderedStyle(workbook);
                centerStyle.setAlignment(HorizontalAlignment.CENTER);
                CellStyle dateStyle = borderedStyle(workbook);
                dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));
                CellStyle dateTimeStyle = borderedStyle(workbook);
                dateTimeStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd hh:mm"));

                Row titleRow = sheet.createRow(0);
                titleRow.setHeightInPoints(28);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("DANH SÁCH KHAI BÁO TẠM TRÚ");
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, HEADERS.length - 1));

                Row dateRow = sheet.createRow(1);
                Cell dateCell = dateRow.createCell(0);
                dateCell.setCellValue("Ngày khai báo: " + date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                dateCell.setCellStyle(subtitleStyle);
                sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, HEADERS.length - 1));

                Row headerRow = sheet.createRow(3);
                for (int index = 0; index < HEADERS.length; index++) {
                    Cell cell = headerRow.createCell(index);
                    cell.setCellValue(HEADERS[index]);
                    cell.setCellStyle(headerStyle);
                }

                int rowIndex = 4;
                for (TemporaryResidenceExportRow exportRow : rows) {
                    Row sheetRow = sheet.createRow(rowIndex++);
                    setNumber(sheetRow, 0, exportRow.index(), centerStyle);
                    setText(sheetRow, 1, exportRow.bookingCode(), textStyle);
                    setText(sheetRow, 2, exportRow.roomNumber(), centerStyle);
                    setText(sheetRow, 3, exportRow.fullName(), textStyle);
                    setDate(sheetRow, 4, exportRow.dateOfBirth(), dateStyle);
                    setNullableNumber(sheetRow, 5, exportRow.age(), centerStyle);
                    setText(sheetRow, 6, exportRow.phone(), textStyle);
                    setText(sheetRow, 7, exportRow.identityDocumentNumber(), textStyle);
                    setText(sheetRow, 8, exportRow.address(), textStyle);
                    setDateTime(sheetRow, 9, exportRow.actualCheckIn(), dateTimeStyle);
                    setDateTime(sheetRow, 10, exportRow.expectedCheckOut(), dateTimeStyle);
                }

                if (rows.isEmpty()) {
                    Row emptyRow = sheet.createRow(4);
                    Cell emptyCell = emptyRow.createCell(0);
                    emptyCell.setCellValue("Chưa có khách check-in trong ngày này");
                    emptyCell.setCellStyle(textStyle);
                    sheet.addMergedRegion(new CellRangeAddress(4, 4, 0, HEADERS.length - 1));
                }

                for (int index = 0; index < HEADERS.length; index++) {
                    sheet.autoSizeColumn(index);
                    int width = sheet.getColumnWidth(index);
                    int minWidth = index == 8 ? 9000 : 3500;
                    int maxWidth = index == 8 ? 14000 : 7000;
                    sheet.setColumnWidth(index, Math.max(minWidth, Math.min(width + 800, maxWidth)));
                }
                sheet.createFreezePane(0, 4);

                workbook.write(outputStream);
            }
            Files.move(tempPath, outputPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            if (tempPath != null) {
                try {
                    Files.deleteIfExists(tempPath);
                } catch (IOException ignored) {
                    // Keep the original write error as the actionable failure.
                }
            }
            throw new IllegalStateException(
                    "Không thể cập nhật file Excel khai báo tạm trú. Hãy đóng file Excel nếu đang mở rồi check-in lại hoặc bấm xuất lại.",
                    exception
            );
        }
    }

    private void setText(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value == null ? "" : value);
        cell.setCellStyle(style);
    }

    private void setNumber(Row row, int column, int value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void setNullableNumber(Row row, int column, Integer value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        }
        cell.setCellStyle(style);
    }

    private void setDate(Row row, int column, LocalDate value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        }
        cell.setCellStyle(style);
    }

    private void setDateTime(Row row, int column, LocalDateTime value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        }
        cell.setCellStyle(style);
    }

    private Integer calculateAge(LocalDate dateOfBirth, LocalDate atDate) {
        if (dateOfBirth == null || atDate == null || dateOfBirth.isAfter(atDate)) {
            return null;
        }
        return Period.between(dateOfBirth, atDate).getYears();
    }

    private CellStyle titleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.DARK_GREEN.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle subtitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        return style;
    }

    private CellStyle headerStyle(Workbook workbook) {
        CellStyle style = borderedStyle(workbook);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.DARK_GREEN.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle borderedStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }
}
