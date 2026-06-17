package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AdminCheckInGuestRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminCompleteCheckInRequest;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminCheckInRegistrationServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class AdminCheckInRegistrationServiceImplTest {

    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingGuestRepository bookingGuestRepository;
    @Mock private CheckInRecordRepository checkInRecordRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private EmployeeRepository employeeRepository;

    private AdminCheckInRegistrationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminCheckInRegistrationServiceImpl(
                bookingDetailRepository, bookingRepository, bookingGuestRepository,
                checkInRecordRepository, roomRepository, employeeRepository
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("staff@example.com", "password")
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void prepareReturnsOnlyAvailableRoomsOfBookedType() {
        TestData data = testData();
        Room availableRoom = Room.builder().id(102L).roomNumber("102").roomType(data.roomType()).build();
        Booking otherBooking = Booking.builder().id(99L).customer(data.customer()).status("CONFIRMED").build();
        BookingDetail busyDetail = BookingDetail.builder()
                .id(98L).booking(otherBooking).roomType(data.roomType()).room(data.room())
                .checkInTarget(data.detail().getCheckInTarget()).checkOutTarget(data.detail().getCheckOutTarget())
                .status("CONFIRMED").build();

        when(bookingDetailRepository.findByIdForAdminDetail(40L)).thenReturn(Optional.of(data.detail()));
        when(checkInRecordRepository.findByBookingDetailId(40L)).thenReturn(Optional.empty());
        when(roomRepository.findByRoomTypeId(30L)).thenReturn(List.of(data.room(), availableRoom));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of(data.detail(), busyDetail));

        var response = service.prepare(40L);

        assertEquals(1, response.availableRooms().size());
        assertEquals(102L, response.availableRooms().getFirst().id());
        assertEquals(2, response.numberOfAdults());
    }

    @Test
    void completeAssignsRoomSavesGuestsAndCreatesCheckInRecord() {
        TestData data = testData();
        Employee employee = Employee.builder().id(70L).fullName("Lễ tân").build();
        List<AdminCheckInGuestRequest> guests = List.of(
                new AdminCheckInGuestRequest("Người đặt", "001", null, "booker@example.com", null, null, null, "VIETNAM"),
                new AdminCheckInGuestRequest("Khách thứ hai", "002", null, null, null, null, null, "VIETNAM")
        );

        when(bookingDetailRepository.findByIdForAdminDetail(40L)).thenReturn(Optional.of(data.detail()));
        when(checkInRecordRepository.findByBookingDetailId(40L)).thenReturn(Optional.empty());
        when(roomRepository.findByIdForCheckIn(101L)).thenReturn(Optional.of(data.room()));
        when(bookingDetailRepository.findOverlappingSchedule(any(), any())).thenReturn(List.of(data.detail()));
        when(employeeRepository.findByAccountEmail("staff@example.com")).thenReturn(Optional.of(employee));

        var response = service.complete(40L, new AdminCompleteCheckInRequest(101L, guests));

        assertEquals("CHECKED_IN", data.detail().getStatus());
        assertEquals("CHECKED_IN", data.booking().getStatus());
        assertEquals(101L, data.detail().getRoom().getId());
        assertEquals(2, response.guestCount());
        ArgumentCaptor<List<BookingGuest>> guestCaptor = ArgumentCaptor.forClass(List.class);
        verify(bookingGuestRepository).saveAll(guestCaptor.capture());
        assertEquals(2, guestCaptor.getValue().size());
        assertTrue(guestCaptor.getValue().getFirst().isPrimaryGuest());
        var guestWriteOrder = inOrder(bookingGuestRepository);
        guestWriteOrder.verify(bookingGuestRepository).deleteByBookingDetailId(40L);
        guestWriteOrder.verify(bookingGuestRepository).flush();
        guestWriteOrder.verify(bookingGuestRepository).saveAll(any());
        verify(checkInRecordRepository).save(any());
        verify(bookingRepository).save(data.booking());
    }

    private TestData testData() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 6, 20, 14, 0);
        Account account = Account.builder().id(1L).email("booker@example.com").build();
        Customer customer = Customer.builder().id(2L).account(account).fullName("Người đặt").build();
        Booking booking = Booking.builder().id(20L).customer(customer).bookingDate(checkIn.minusDays(2)).status("CONFIRMED").build();
        RoomType roomType = RoomType.builder().id(30L).name("Family").build();
        Room room = Room.builder().id(101L).roomNumber("101").roomType(roomType).build();
        BookingDetail detail = BookingDetail.builder()
                .id(40L).booking(booking).roomType(roomType)
                .checkInTarget(checkIn).checkOutTarget(checkIn.plusDays(1))
                .numberOfAdults(2).numberOfChildren(0).priceAtBooking(BigDecimal.valueOf(1_000_000))
                .rentType("DAILY").status("CONFIRMED").build();
        return new TestData(customer, booking, roomType, room, detail);
    }

    private record TestData(
            Customer customer,
            Booking booking,
            RoomType roomType,
            Room room,
            BookingDetail detail
    ) {
    }
}
