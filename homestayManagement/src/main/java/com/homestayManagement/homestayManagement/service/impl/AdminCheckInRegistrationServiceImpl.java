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
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.AdminCheckInRegistrationService;
import com.homestayManagement.homestayManagement.service.StayAccessService;
import com.homestayManagement.homestayManagement.service.event.TemporaryResidenceExcelExportEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    private final CustomerRepository customerRepository;
    private final StayAccessService stayAccessService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository;

    public AdminCheckInRegistrationServiceImpl(
            BookingDetailRepository bookingDetailRepository,
            BookingRepository bookingRepository,
            BookingGuestRepository bookingGuestRepository,
            CheckInRecordRepository checkInRecordRepository,
            RoomRepository roomRepository,
            EmployeeRepository employeeRepository,
            CustomerRepository customerRepository,
            StayAccessService stayAccessService,
            ApplicationEventPublisher eventPublisher,
            com.homestayManagement.homestayManagement.repository.RoomIncidentRepository roomIncidentRepository
    ) {
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingRepository = bookingRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.roomRepository = roomRepository;
        this.employeeRepository = employeeRepository;
        this.customerRepository = customerRepository;
        this.stayAccessService = stayAccessService;
        this.eventPublisher = eventPublisher;
        this.roomIncidentRepository = roomIncidentRepository;
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
                detail.getBooking().getBookingCode(),
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
                findAvailableRooms(detail),
                findOtherAvailableRooms(detail)
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
            throw new IllegalArgumentException("Phòng chưa sẵn sàng để nhận khách (đang bảo trì hoặc có khách)");
        }
        if (room.getRoomType() != null && (detail.getRoomType() == null || !detail.getRoomType().getId().equals(room.getRoomType().getId()))) {
            // Linh hoạt hỗ trợ Lễ tân đổi phòng / nâng hạng phòng ngay tại bước Check-in khi phòng cũ bảo trì hoặc theo yêu cầu
            detail.setRoomType(room.getRoomType());
        }
        if (!isRoomAvailable(room, detail)) {
            throw new IllegalArgumentException("Phòng vừa được gán cho booking khác, vui lòng chọn phòng khác");
        }

        Employee employee = getCurrentEmployee();
        LocalDateTime now = LocalDateTime.now();
        int actualAdults = 0;
        int actualChildren = 0;
        java.time.LocalDate checkInDate = now.toLocalDate();
        for (AdminCheckInGuestRequest g : request.guests()) {
            if (g.dateOfBirth() != null && java.time.Period.between(g.dateOfBirth(), checkInDate).getYears() < 10) {
                actualChildren++;
            } else {
                actualAdults++;
            }
        }
        if (actualAdults == 0) {
            actualAdults = 1;
        }
        detail.setNumberOfAdults(actualAdults);
        detail.setNumberOfChildren(actualChildren);

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
        List<BookingGuest> guests = buildGuests(detail, request.guests(), request.representativeEmail());
        bookingGuestRepository.saveAll(guests);

        Customer customer = detail.getBooking().getCustomer();
        if (customer != null && !request.guests().isEmpty()) {
            AdminCheckInGuestRequest rep = request.guests().getFirst();
            if (rep.fullName() != null && !rep.fullName().isBlank()) {
                customer.setFullName(rep.fullName().trim());
            }
            if (blankToNull(rep.phone()) != null) {
                customer.setPhone(blankToNull(rep.phone()));
            }
            String syncedEmail = request.representativeEmail() != null && !request.representativeEmail().isBlank()
                    ? request.representativeEmail().trim().toLowerCase()
                    : (blankToNull(rep.email()) != null ? blankToNull(rep.email()).toLowerCase() : null);

            if (syncedEmail != null) {
                customer.setEmail(syncedEmail);
            }
            if (blankToNull(rep.identityDocumentNumber()) != null) {
                customer.setIdentityDocumentNumber(blankToNull(rep.identityDocumentNumber()));
            }
            if (rep.dateOfBirth() != null) {
                customer.setDateOfBirth(rep.dateOfBirth());
            }
            if (blankToNull(rep.address()) != null) {
                customer.setAddress(blankToNull(rep.address()));
            }
            customerRepository.save(customer);

            // Đồng bộ email và thông tin người đại diện cho tất cả các phòng khác cùng booking chưa check-in
            if (syncedEmail != null && detail.getBooking() != null && detail.getBooking().getId() != null) {
                List<BookingDetail> otherDetails = bookingDetailRepository.findByBookingId(detail.getBooking().getId());
                if (otherDetails != null) {
                    List<Long> otherDetailIds = otherDetails.stream()
                            .filter(other -> other.getId() != null && !other.getId().equals(detail.getId())
                                    && !"CHECKED_IN".equalsIgnoreCase(other.getStatus())
                                    && !"CHECKED_OUT".equalsIgnoreCase(other.getStatus()))
                            .map(BookingDetail::getId)
                            .toList();
                    if (!otherDetailIds.isEmpty()) {
                        List<BookingGuest> otherGuests = bookingGuestRepository.findByBookingDetailIds(otherDetailIds);
                        for (BookingGuest otherGuest : otherGuests) {
                            if (otherGuest.isPrimaryGuest()) {
                                otherGuest.setEmail(syncedEmail);
                                if (blankToNull(rep.fullName()) != null) {
                                    otherGuest.setFullName(blankToNull(rep.fullName()));
                                }
                                if (blankToNull(rep.phone()) != null) {
                                    otherGuest.setPhone(blankToNull(rep.phone()));
                                }
                                if (blankToNull(rep.identityDocumentNumber()) != null) {
                                    otherGuest.setIdentityDocumentNumber(blankToNull(rep.identityDocumentNumber()));
                                }
                                if (rep.dateOfBirth() != null) {
                                    otherGuest.setDateOfBirth(rep.dateOfBirth());
                                }
                                if (blankToNull(rep.address()) != null) {
                                    otherGuest.setAddress(blankToNull(rep.address()));
                                }
                            }
                        }
                        bookingGuestRepository.saveAll(otherGuests);
                    }
                }
            }
        }

        CheckInRecord record = CheckInRecord.builder()
                .bookingDetail(detail)
                .customer(detail.getBooking().getCustomer())
                .receptionist(employee)
                .actualCheckIn(now)
                .earlyCheckInFee(BigDecimal.ZERO)
                .lateCheckOutFee(BigDecimal.ZERO)
                .build();
        checkInRecordRepository.save(record);

        String repEmail = request.representativeEmail();
        if (repEmail == null || repEmail.isBlank()) {
            if (!request.guests().isEmpty() && request.guests().getFirst().email() != null && !request.guests().getFirst().email().isBlank()) {
                repEmail = request.guests().getFirst().email();
            } else if (customer != null) {
                if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
                    repEmail = customer.getEmail();
                } else if (customer.getAccount() != null && customer.getAccount().getEmail() != null && !customer.getAccount().getEmail().isBlank()) {
                    repEmail = customer.getAccount().getEmail();
                }
            }
        }
        if (repEmail == null || repEmail.isBlank()) {
            repEmail = "guest_" + detail.getId() + "@ladohomestay.vn";
        }

        StayAccessService.GrantResult grant = stayAccessService.grantAccess(
                detail,
                record,
                request.guests().getFirst().fullName(),
                repEmail
        );

        // Cấp quyền và gửi email truy cập cho tất cả khách ở cùng có nhập email
        for (int i = 1; i < request.guests().size(); i++) {
            AdminCheckInGuestRequest guest = request.guests().get(i);
            String guestEmail = guest.email() != null ? guest.email().trim() : null;
            if (guestEmail != null && !guestEmail.isBlank() && !guestEmail.equalsIgnoreCase(repEmail)) {
                String guestName = (guest.fullName() != null && !guest.fullName().isBlank())
                        ? guest.fullName().trim()
                        : "Khách lưu trú " + (i + 1);
                try {
                    stayAccessService.grantAccess(detail, record, guestName, guestEmail);
                } catch (Exception ex) {
                    org.slf4j.LoggerFactory.getLogger(AdminCheckInRegistrationServiceImpl.class)
                            .warn("Không thể cấp quyền truy cập lưu trú cho khách đi cùng {}: {}", guestEmail, ex.getMessage());
                }
            }
        }

        eventPublisher.publishEvent(new TemporaryResidenceExcelExportEvent(now.toLocalDate(), detail.getId()));

        return new AdminCompleteCheckInResponse(
                detail.getBooking().getId(), detail.getBooking().getBookingCode(), detail.getId(), room.getId(), room.getRoomNumber(),
                detail.getStatus(), now, guests.size(),
                grant.accessId(), grant.email(), grant.status(), grant.activationRequired(), grant.emailQueued()
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
            throw new IllegalArgumentException("Booking chưa có loại nhà");
        }
        if (detail.getCheckOutTarget() != null && LocalDateTime.now().isAfter(detail.getCheckOutTarget())) {
            throw new IllegalArgumentException("Đơn đặt phòng đã quá giờ trả phòng, không thể thực hiện check-in");
        }
        return detail;
    }

    private boolean isPhysicalRoomReady(Room room) {
        if (room == null) return false;
        if (room.getStatus() == null) return true;
        return "AVAILABLE".equalsIgnoreCase(room.getStatus());
    }

    private boolean isRoomAvailable(Room room, BookingDetail currentDetail) {
        if (room == null || !isPhysicalRoomReady(room)) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (bookingDetailRepository.hasActiveGuestInRoom(room.getId(), now)) {
            return false;
        }

        List<BookingDetail> overlapping = bookingDetailRepository.findOverlappingSchedule(
                currentDetail.getCheckInTarget(), currentDetail.getCheckOutTarget()
        ).stream()
        .filter(com.homestayManagement.homestayManagement.service.support.BookingInventoryPolicy::blocksInventory)
        .filter(d -> !d.getId().equals(currentDetail.getId()))
        .toList();

        boolean hasDirectConflict = overlapping.stream()
                .anyMatch(detail -> detail.getRoom() != null && room.getId().equals(detail.getRoom().getId()));
        if (hasDirectConflict) {
            return false;
        }

        if (room.getRoomType() != null && room.getRoomType().getId() != null) {
            Long rtId = room.getRoomType().getId();
            List<Room> typeRooms = roomRepository.findByRoomTypeId(rtId);
            if (typeRooms != null && !typeRooms.isEmpty()) {
                long totalUsable = typeRooms.stream()
                        .filter(rm -> isPhysicalRoomReady(rm) 
                                && !bookingDetailRepository.hasActiveGuestInRoom(rm.getId(), now))
                        .count();
                long assignedBusy = overlapping.stream()
                        .filter(d -> d.getRoom() != null && d.getRoom().getRoomType() != null && rtId.equals(d.getRoom().getRoomType().getId()))
                        .count();
                long unassignedBusy = overlapping.stream()
                        .filter(d -> (d.getRoom() == null || d.getRoom().getId() == null) && d.getRoomType() != null && rtId.equals(d.getRoomType().getId()))
                        .count();
                long avail = Math.max(0, totalUsable - (assignedBusy + unassignedBusy));
                if (avail <= 0) {
                    return false;
                }
            }
        }

        return true;
    }

    private List<AdminBookingRoomResponse> findAvailableRooms(BookingDetail detail) {
        if (detail.getRoomType() == null || detail.getRoomType().getId() == null) return List.of();
        Long typeId = detail.getRoomType().getId();
        List<Room> typeRooms = roomRepository.findByRoomTypeId(typeId);
        if (typeRooms == null || typeRooms.isEmpty()) return List.of();

        List<AdminBookingRoomResponse> result = new java.util.ArrayList<>();
        for (Room room : typeRooms) {
            if (isRoomAvailable(room, detail)) {
                result.add(new AdminBookingRoomResponse(
                        room.getId(), room.getRoomNumber(), room.getRoomType().getName()
                ));
            }
        }
        return result;
    }

    private List<AdminBookingRoomResponse> findOtherAvailableRooms(BookingDetail detail) {
        Long currentTypeId = detail.getRoomType() != null ? detail.getRoomType().getId() : null;
        List<Room> allRooms = roomRepository.findAll();
        if (allRooms == null || allRooms.isEmpty()) return List.of();

        List<AdminBookingRoomResponse> result = new java.util.ArrayList<>();
        for (Room room : allRooms) {
            if (room.getRoomType() == null || (currentTypeId != null && currentTypeId.equals(room.getRoomType().getId()))) {
                continue;
            }
            if (isRoomAvailable(room, detail)) {
                result.add(new AdminBookingRoomResponse(
                        room.getId(), room.getRoomNumber(), room.getRoomType().getName()
                ));
            }
        }
        return result;
    }

    private boolean hasCompletePreRegistration(BookingDetail detail, List<BookingGuest> guests) {
        int expectedCount = valueOrZero(detail.getNumberOfAdults()) + valueOrZero(detail.getNumberOfChildren());
        return detail.getRoom() != null
                && detail.getRoom().getId() != null
                && isPhysicalRoomReady(detail.getRoom())
                && isRoomAvailable(detail.getRoom(), detail)
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

    private void validateGuests(BookingDetail detail, List<AdminCheckInGuestRequest> guests) {
        if (guests == null || guests.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập thông tin người lưu trú");
        }
        Set<String> identities = new HashSet<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        for (AdminCheckInGuestRequest guest : guests) {
            if (guest.fullName() == null || guest.fullName().trim().isBlank()) {
                throw new IllegalArgumentException("Họ tên người lưu trú không được để trống");
            }
            boolean isUnder10 = false;
            if (guest.dateOfBirth() != null) {
                int age = java.time.Period.between(guest.dateOfBirth(), today).getYears();
                if (age < 10) {
                    isUnder10 = true;
                }
            }
            String identity = guest.identityDocumentNumber() != null ? guest.identityDocumentNumber().trim() : "";
            if (!isUnder10 && identity.isBlank()) {
                throw new IllegalArgumentException("Căn cước công dân của người lưu trú " + guest.fullName() + " không được để trống");
            }
            if (!identity.isBlank() && !identities.add(identity.toUpperCase())) {
                throw new IllegalArgumentException("Căn cước công dân của người lưu trú không được trùng nhau");
            }
        }
    }

    private List<BookingGuest> buildGuests(
            BookingDetail detail,
            List<AdminCheckInGuestRequest> requests,
            String representativeEmail
    ) {
        return java.util.stream.IntStream.range(0, requests.size())
                .mapToObj(index -> {
                    AdminCheckInGuestRequest request = requests.get(index);
                    return BookingGuest.builder()
                            .booking(detail.getBooking())
                            .bookingDetail(detail)
                            .fullName(request.fullName().trim())
                            .identityDocumentType(blankToNull(request.identityDocumentNumber()) != null ? "CCCD" : null)
                            .identityDocumentNumber(blankToNull(request.identityDocumentNumber()))
                            .dateOfBirth(request.dateOfBirth())
                            .email(index == 0
                                    ? representativeEmail.trim().toLowerCase()
                                    : blankToNull(request.email()))
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
        String email = customer.getEmail();
        if ((email == null || email.isBlank()) && customer.getAccount() != null) {
            email = customer.getAccount().getEmail();
        }
        return new AdminBookingCustomerResponse(
                customer.getId(), customer.getFullName(),
                email,
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
