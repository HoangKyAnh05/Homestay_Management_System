package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminCheckInGuestRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminCompleteCheckInRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingCustomerResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminBookingRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCheckInPreparationResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCompleteCheckInResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryGuestResponse;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
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
import com.homestayManagement.homestayManagement.service.AdminCheckInRegistrationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminCheckInRegistrationServiceImpl implements AdminCheckInRegistrationService {

    private static final Set<String> OCCUPYING_STATUSES = Set.of("CONFIRMED", "CHECKED_IN");

    private final BookingDetailRepository bookingDetailRepository;
    private final BookingRepository bookingRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final RoomRepository roomRepository;
    private final EmployeeRepository employeeRepository;

    public AdminCheckInRegistrationServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            BookingRepository bookingRepository,
            BookingGuestRepository bookingGuestRepository,
            CheckInRecordRepository checkInRecordRepository,
            RoomRepository roomRepository,
            EmployeeRepository employeeRepository
    ) {
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingRepository = bookingRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.roomRepository = roomRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCheckInPreparationResponse prepare(Long bookingDetailId) {
        BookingDetail detail = getCheckInCandidate(bookingDetailId);
        Customer customer = detail.getBooking().getCustomer();
        RoomType roomType = detail.getRoomType();
        List<BookingGuest> registeredGuests = bookingGuestRepository
                .findByBookingDetailIds(List.of(detail.getId()));
        boolean preRegistered = hasCompletePreRegistration(detail, registeredGuests);
        return new AdminCheckInPreparationResponse(
                detail.getBooking().getId(),
                detail.getId(),
                roomType != null ? roomType.getName() : null,
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                toCustomerResponse(customer),
                customer.getIdentityDocumentNumber(),
                detail.getRoom() != null ? toRoomResponse(detail.getRoom()) : null,
                preRegistered,
                preRegistered ? registeredGuests.stream().map(this::toGuestResponse).toList() : List.of(),
                findAvailableRooms(detail)
        );
    }

    @Override
    @Transactional
    public AdminCompleteCheckInResponse complete(Long bookingDetailId, AdminCompleteCheckInRequest request) {
        BookingDetail detail = getCheckInCandidate(bookingDetailId);
        validateGuests(detail, request.guests());

        Room room = roomRepository.findByIdForCheckIn(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            throw new IllegalArgumentException("Phòng chưa sẵn sàng để nhận khách");
        }
        if (detail.getRoomType() == null || room.getRoomType() == null
                || !detail.getRoomType().getId().equals(room.getRoomType().getId())) {
            throw new IllegalArgumentException("Phòng được chọn không đúng loại phòng khách đã đặt");
        }
        if (!isRoomAvailable(room.getId(), detail)) {
            throw new IllegalArgumentException("Phòng vừa được gán cho booking khác, vui lòng chọn phòng khác");
        }

        Employee employee = getCurrentEmployee();
        LocalDateTime now = LocalDateTime.now();
        detail.setRoom(room);
        detail.setRoomAssignmentStatus("ASSIGNED");
        detail.setAssignedAt(now);
        detail.setAssignedBy(employee);
        detail.setStatus("CHECKED_IN");
        detail.getBooking().setStatus("CHECKED_IN");
        room.setStatus("OCCUPIED");
        roomRepository.save(room);
        bookingDetailRepository.save(detail);
        bookingRepository.save(detail.getBooking());

        bookingGuestRepository.deleteByBookingDetailId(detail.getId());
        bookingGuestRepository.flush();
        List<BookingGuest> guests = buildGuests(detail, request.guests());
        bookingGuestRepository.saveAll(guests);

        CheckInRecord record = CheckInRecord.builder()
                .bookingDetail(detail)
                .customer(detail.getBooking().getCustomer())
                .receptionist(employee)
                .actualCheckIn(now)
                .earlyCheckInFee(BigDecimal.ZERO)
                .lateCheckOutFee(BigDecimal.ZERO)
                .build();
        checkInRecordRepository.save(record);

        return new AdminCompleteCheckInResponse(
                detail.getBooking().getId(), detail.getId(), room.getId(), room.getRoomNumber(),
                detail.getStatus(), now, guests.size()
        );
    }

    private BookingDetail getCheckInCandidate(Long bookingDetailId) {
        BookingDetail detail = bookingDetailRepository.findByIdForAdminDetail(bookingDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        if (!Set.of("CONFIRMED", "CHECKED_IN").contains(normalize(detail.getBooking().getStatus()))
                || !"CONFIRMED".equalsIgnoreCase(detail.getStatus())) {
            throw new IllegalArgumentException("Chỉ booking đã xác nhận mới được check-in");
        }
        if (checkInRecordRepository.findByBookingDetailId(bookingDetailId).isPresent()) {
            throw new IllegalArgumentException("Phòng này đã được check-in");
        }
        if (detail.getRoomType() == null) {
            throw new IllegalArgumentException("Booking chưa có loại phòng");
        }
        return detail;
    }

    private List<AdminBookingRoomResponse> findAvailableRooms(BookingDetail detail) {
        return roomRepository.findByRoomTypeId(detail.getRoomType().getId()).stream()
                .filter(room -> "AVAILABLE".equalsIgnoreCase(room.getStatus()))
                .filter(room -> isRoomAvailable(room.getId(), detail))
                .map(room -> new AdminBookingRoomResponse(
                        room.getId(), room.getRoomNumber(), room.getRoomType().getName()
                ))
                .toList();
    }

    private boolean hasCompletePreRegistration(BookingDetail detail, List<BookingGuest> guests) {
        int expectedCount = valueOrZero(detail.getNumberOfAdults()) + valueOrZero(detail.getNumberOfChildren());
        return detail.getRoom() != null
                && detail.getRoom().getId() != null
                && guests.size() == expectedCount
                && guests.stream().allMatch(guest -> guest.getFullName() != null && !guest.getFullName().isBlank()
                        && guest.getIdentityDocumentNumber() != null && !guest.getIdentityDocumentNumber().isBlank());
    }

    private AdminBookingRoomResponse toRoomResponse(Room room) {
        return new AdminBookingRoomResponse(
                room.getId(), room.getRoomNumber(),
                room.getRoomType() != null ? room.getRoomType().getName() : null
        );
    }

    private AdminCustomerHistoryGuestResponse toGuestResponse(BookingGuest guest) {
        return new AdminCustomerHistoryGuestResponse(
                guest.getId(), guest.getFullName(), guest.getIdentityDocumentType(),
                guest.getIdentityDocumentNumber(), guest.getDateOfBirth(), guest.getGender(),
                guest.getNationality(), guest.getPhone(), guest.getEmail(), guest.getAddress(),
                guest.isPrimaryGuest()
        );
    }

    private boolean isRoomAvailable(Long roomId, BookingDetail currentDetail) {
        return bookingDetailRepository.findOverlappingSchedule(
                        currentDetail.getCheckInTarget(), currentDetail.getCheckOutTarget()
                ).stream()
                .filter(detail -> !detail.getId().equals(currentDetail.getId()))
                .filter(detail -> detail.getRoom() != null && roomId.equals(detail.getRoom().getId()))
                .noneMatch(detail -> OCCUPYING_STATUSES.contains(normalize(detail.getStatus()))
                        && OCCUPYING_STATUSES.contains(normalize(detail.getBooking().getStatus())));
    }

    private void validateGuests(BookingDetail detail, List<AdminCheckInGuestRequest> guests) {
        int expectedCount = valueOrZero(detail.getNumberOfAdults()) + valueOrZero(detail.getNumberOfChildren());
        if (guests.size() != expectedCount) {
            throw new IllegalArgumentException("Cần nhập đủ thông tin cho " + expectedCount + " người lưu trú");
        }
        Set<String> identities = new HashSet<>();
        for (AdminCheckInGuestRequest guest : guests) {
            String identity = guest.identityDocumentNumber().trim().toUpperCase();
            if (!identities.add(identity)) {
                throw new IllegalArgumentException("Căn cước công dân của người lưu trú không được trùng nhau");
            }
        }
    }

    private List<BookingGuest> buildGuests(BookingDetail detail, List<AdminCheckInGuestRequest> requests) {
        return java.util.stream.IntStream.range(0, requests.size())
                .mapToObj(index -> {
                    AdminCheckInGuestRequest request = requests.get(index);
                    return BookingGuest.builder()
                            .booking(detail.getBooking())
                            .bookingDetail(detail)
                            .fullName(request.fullName().trim())
                            .identityDocumentType("CCCD")
                            .identityDocumentNumber(request.identityDocumentNumber().trim())
                            .dateOfBirth(request.dateOfBirth())
                            .email(blankToNull(request.email()))
                            .phone(blankToNull(request.phone()))
                            .address(blankToNull(request.address()))
                            .gender(blankToNull(request.gender()))
                            .nationality(request.nationality() == null || request.nationality().isBlank()
                                    ? "VIETNAM" : request.nationality().trim())
                            .primaryGuest(index == 0)
                            .build();
                })
                .toList();
    }

    private AdminBookingCustomerResponse toCustomerResponse(Customer customer) {
        return new AdminBookingCustomerResponse(
                customer.getId(), customer.getFullName(),
                customer.getAccount() != null ? customer.getAccount().getEmail() : null,
                customer.getPhone(), customer.getAddress(), customer.getDateOfBirth()
        );
    }

    private Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Không xác định được nhân viên đang đăng nhập");
        }
        return employeeRepository.findByAccountEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hiện tại chưa có hồ sơ nhân viên"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int valueOrZero(Integer value) {
        return value != null ? value : 0;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
