package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.service.impl.TemporaryResidenceExcelServiceImpl;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemporaryResidenceExcelServiceImplTest {

    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;

    @TempDir
    Path tempDir;

    @Test
    void exportByDateCreatesDailyWorkbookFromCheckedInGuests() throws Exception {
        LocalDate exportDate = LocalDate.of(2026, 8, 18);
        Customer customer = Customer.builder().id(1L).fullName("Người đặt").build();
        Booking booking = Booking.builder().id(2L).bookingCode("BK_TEST").customer(customer).build();
        RoomType roomType = RoomType.builder().id(3L).name("Deluxe").build();
        Room room = Room.builder().id(4L).roomNumber("101").roomType(roomType).build();
        BookingDetail detail = BookingDetail.builder()
                .id(5L).booking(booking).room(room).roomType(roomType)
                .checkOutTarget(LocalDateTime.of(2026, 8, 19, 12, 0))
                .build();
        CheckInRecord record = CheckInRecord.builder()
                .id(6L).bookingDetail(detail)
                .actualCheckIn(LocalDateTime.of(2026, 8, 18, 14, 30))
                .build();
        BookingGuest guest = BookingGuest.builder()
                .id(7L).booking(booking).bookingDetail(detail)
                .fullName("Nguyễn Văn A")
                .dateOfBirth(LocalDate.of(1996, 8, 18))
                .phone("0900000001")
                .identityDocumentNumber("001234567890")
                .address("Thạch Thất, Hà Nội")
                .primaryGuest(true)
                .build();

        when(checkInRecordRepository.findByActualCheckInRangeForTemporaryResidence(
                exportDate.atStartOfDay(),
                exportDate.plusDays(1).atStartOfDay()
        )).thenReturn(List.of(record));
        when(bookingGuestRepository.findByBookingDetailIds(List.of(5L))).thenReturn(List.of(guest));

        TemporaryResidenceExcelServiceImpl service = new TemporaryResidenceExcelServiceImpl(
                checkInRecordRepository,
                bookingGuestRepository,
                tempDir.toString()
        );

        Path output = service.exportByDate(exportDate);

        assertTrue(Files.exists(output));
        assertEquals("temporary-residence-2026-08-18.xlsx", output.getFileName().toString());
        try (InputStream inputStream = Files.newInputStream(output);
             var workbook = WorkbookFactory.create(inputStream)) {
            var sheet = workbook.getSheet("Khai bao tam tru");
            assertEquals("DANH SÁCH KHAI BÁO TẠM TRÚ", sheet.getRow(0).getCell(0).getStringCellValue());
            assertEquals("Họ và tên", sheet.getRow(3).getCell(3).getStringCellValue());
            assertEquals("Check-out dự kiến", sheet.getRow(3).getCell(10).getStringCellValue());
            assertEquals("Nguyễn Văn A", sheet.getRow(4).getCell(3).getStringCellValue());
            assertEquals(30, (int) sheet.getRow(4).getCell(5).getNumericCellValue());
            assertEquals("0900000001", sheet.getRow(4).getCell(6).getStringCellValue());
            assertEquals("001234567890", sheet.getRow(4).getCell(7).getStringCellValue());
            assertEquals(
                    LocalDateTime.of(2026, 8, 19, 12, 0),
                    sheet.getRow(4).getCell(10).getLocalDateTimeCellValue()
            );
        }
    }
}
