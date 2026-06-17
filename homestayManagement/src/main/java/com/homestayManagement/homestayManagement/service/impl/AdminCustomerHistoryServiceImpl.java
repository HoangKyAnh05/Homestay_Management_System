package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.AdminCustomerBookingHistoryResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryGuestResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminCustomerHistoryServiceResponse;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingGuest;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingGuestRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.CheckInRecordRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.AdminCustomerHistoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminCustomerHistoryServiceImpl implements AdminCustomerHistoryService {

    private final CustomerRepository customerRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingGuestRepository bookingGuestRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final InvoiceRepository invoiceRepository;

    public AdminCustomerHistoryServiceImpl(
            CustomerRepository customerRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingGuestRepository bookingGuestRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            CheckInRecordRepository checkInRecordRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.customerRepository = customerRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingGuestRepository = bookingGuestRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.checkInRecordRepository = checkInRecordRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCustomerBookingHistoryResponse getBookingHistory(Long accountId) {
        Customer customer = customerRepository.findByAccountId(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách hàng"));
        List<BookingDetail> details = bookingDetailRepository.findByCustomerAccountIdForAdminHistory(accountId);
        if (details.isEmpty()) {
            return new AdminCustomerBookingHistoryResponse(
                    accountId, customer.getId(), customer.getFullName(), 0, List.of()
            );
        }

        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        List<Long> bookingIds = details.stream().map(detail -> detail.getBooking().getId()).distinct().toList();
        Map<Long, List<BookingGuest>> guestsByDetail = bookingGuestRepository.findByBookingDetailIds(detailIds).stream()
                .collect(Collectors.groupingBy(guest -> guest.getBookingDetail().getId()));
        Map<Long, List<BookingServiceItem>> servicesByDetail = bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                .collect(Collectors.groupingBy(item -> item.getBookingDetail().getId()));
        Map<Long, CheckInRecord> checkInByDetail = checkInRecordRepository.findByBookingDetailIdsForAdmin(detailIds).stream()
                .collect(Collectors.toMap(record -> record.getBookingDetail().getId(), Function.identity()));
        Map<Long, Invoice> invoiceByBooking = invoiceRepository.findByBookingIdsForAdmin(bookingIds).stream()
                .collect(Collectors.toMap(invoice -> invoice.getBooking().getId(), Function.identity()));

        Map<Booking, List<BookingDetail>> detailsByBooking = details.stream().collect(Collectors.groupingBy(
                BookingDetail::getBooking,
                LinkedHashMap::new,
                Collectors.toList()
        ));
        List<AdminCustomerHistoryBookingResponse> bookings = detailsByBooking.entrySet().stream()
                .map(entry -> toBookingResponse(
                        entry.getKey(), entry.getValue(), guestsByDetail, servicesByDetail, checkInByDetail,
                        invoiceByBooking.get(entry.getKey().getId())
                ))
                .toList();

        return new AdminCustomerBookingHistoryResponse(
                accountId, customer.getId(), customer.getFullName(), bookings.size(), bookings
        );
    }

    private AdminCustomerHistoryBookingResponse toBookingResponse(
            Booking booking,
            List<BookingDetail> details,
            Map<Long, List<BookingGuest>> guestsByDetail,
            Map<Long, List<BookingServiceItem>> servicesByDetail,
            Map<Long, CheckInRecord> checkInByDetail,
            Invoice invoice
    ) {
        BigDecimal calculatedRoomCharge = details.stream()
                .map(detail -> nullToZero(detail.getPriceAtBooking()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal calculatedServiceCharge = details.stream()
                .flatMap(detail -> servicesByDetail.getOrDefault(detail.getId(), List.of()).stream())
                .map(this::serviceTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal roomCharge = invoice != null ? nullToZero(invoice.getRoomCharge()) : calculatedRoomCharge;
        BigDecimal serviceCharge = invoice != null ? nullToZero(invoice.getServiceCharge()) : calculatedServiceCharge;
        BigDecimal penaltyCharge = invoice != null ? nullToZero(invoice.getPenaltyCharge()) : BigDecimal.ZERO;
        BigDecimal totalAmount = invoice != null
                ? nullToZero(invoice.getTotalAmount())
                : roomCharge.add(serviceCharge).add(penaltyCharge);
        List<AdminCustomerHistoryRoomResponse> rooms = details.stream()
                .map(detail -> toRoomResponse(
                        detail,
                        guestsByDetail.getOrDefault(detail.getId(), List.of()),
                        servicesByDetail.getOrDefault(detail.getId(), List.of()),
                        checkInByDetail.get(detail.getId())
                ))
                .toList();

        return new AdminCustomerHistoryBookingResponse(
                booking.getId(),
                booking.getBookingDate(),
                booking.getStatus(),
                rooms.size(),
                details.stream().mapToInt(detail -> valueOrZero(detail.getNumberOfAdults())).sum(),
                details.stream().mapToInt(detail -> valueOrZero(detail.getNumberOfChildren())).sum(),
                roomCharge,
                serviceCharge,
                penaltyCharge,
                totalAmount,
                rooms
        );
    }

    private AdminCustomerHistoryRoomResponse toRoomResponse(
            BookingDetail detail,
            List<BookingGuest> guests,
            List<BookingServiceItem> services,
            CheckInRecord checkInRecord
    ) {
        Room room = detail.getRoom();
        RoomType roomType = detail.getRoomType() != null
                ? detail.getRoomType()
                : room != null ? room.getRoomType() : null;
        return new AdminCustomerHistoryRoomResponse(
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                roomType != null ? roomType.getName() : null,
                detail.getStatus(),
                detail.getRentType(),
                detail.getCheckInTarget(),
                detail.getCheckOutTarget(),
                checkInRecord != null ? checkInRecord.getActualCheckIn() : null,
                checkInRecord != null ? checkInRecord.getActualCheckOut() : null,
                detail.getNumberOfAdults(),
                detail.getNumberOfChildren(),
                nullToZero(detail.getPriceAtBooking()),
                services.stream().map(this::toServiceResponse).toList(),
                guests.stream().map(this::toGuestResponse).toList()
        );
    }

    private AdminCustomerHistoryServiceResponse toServiceResponse(BookingServiceItem item) {
        String name = item.getFacilityService() != null
                ? item.getFacilityService().getName()
                : item.getInventoryService() != null ? item.getInventoryService().getName() : "Dịch vụ";
        String type = item.getFacilityService() != null ? "FACILITY" : "INVENTORY";
        return new AdminCustomerHistoryServiceResponse(
                item.getId(), name, type, item.getQuantity(), item.getPriceAtBooking(), serviceTotal(item)
        );
    }

    private AdminCustomerHistoryGuestResponse toGuestResponse(BookingGuest guest) {
        return new AdminCustomerHistoryGuestResponse(
                guest.getId(),
                guest.getFullName(),
                guest.getIdentityDocumentType(),
                guest.getIdentityDocumentNumber(),
                guest.getDateOfBirth(),
                guest.getGender(),
                guest.getNationality(),
                guest.getPhone(),
                guest.getAddress(),
                guest.isPrimaryGuest()
        );
    }

    private BigDecimal serviceTotal(BookingServiceItem item) {
        return nullToZero(item.getPriceAtBooking()).multiply(BigDecimal.valueOf(valueOrZero(item.getQuantity())));
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private int valueOrZero(Integer value) {
        return value != null ? value : 0;
    }
}
