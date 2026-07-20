package com.homestayManagement.homestayManagement.service.support;

import com.homestayManagement.homestayManagement.repository.BookingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BookingCodeGeneratorTest {

    @Test
    void generatesCodeWithBookingDateAndDailySequence() {
        BookingRepository bookingRepository = mock(BookingRepository.class);
        LocalDateTime bookingDate = LocalDateTime.of(2026, 6, 29, 10, 30);
        when(bookingRepository.countByBookingDateGreaterThanEqualAndBookingDateLessThan(
                LocalDateTime.of(2026, 6, 29, 0, 0),
                LocalDateTime.of(2026, 6, 30, 0, 0)
        )).thenReturn(0L);

        BookingCodeGenerator generator = new BookingCodeGenerator(bookingRepository);

        assertEquals("BK_29062026_1", generator.generate(bookingDate));
    }

    @Test
    void incrementsSequenceWithinSameDay() {
        BookingRepository bookingRepository = mock(BookingRepository.class);
        LocalDateTime bookingDate = LocalDateTime.of(2026, 6, 29, 23, 59);
        when(bookingRepository.countByBookingDateGreaterThanEqualAndBookingDateLessThan(
                LocalDateTime.of(2026, 6, 29, 0, 0),
                LocalDateTime.of(2026, 6, 30, 0, 0)
        )).thenReturn(4L);

        BookingCodeGenerator generator = new BookingCodeGenerator(bookingRepository);

        assertEquals("BK_29062026_5", generator.generate(bookingDate));
    }
}
