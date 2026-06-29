package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.repository.BookingRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class BookingCodeGenerator {

    private static final DateTimeFormatter CODE_DATE_FORMAT = DateTimeFormatter.ofPattern("ddMMyyyy");

    private final BookingRepository bookingRepository;

    public BookingCodeGenerator(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public String generate(LocalDateTime bookingDate) {
        LocalDate date = bookingDate != null ? bookingDate.toLocalDate() : LocalDate.now();
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime startOfNextDay = date.plusDays(1).atStartOfDay();
        long sequence = bookingRepository.countByBookingDateGreaterThanEqualAndBookingDateLessThan(
                startOfDay,
                startOfNextDay
        ) + 1;
        return "BK_" + date.format(CODE_DATE_FORMAT) + "_" + sequence;
    }
}
