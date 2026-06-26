package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.AddedBookingServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.EligibleServiceBookingResponse;
import com.homestayManagement.homestayManagement.dto.response.PublicAmenityResponse;
import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.Invoice;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.BookingServiceItemRepository;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.InvoiceRepository;
import com.homestayManagement.homestayManagement.service.PublicAmenityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class PublicAmenityServiceImpl implements PublicAmenityService {

    private static final Set<String> ELIGIBLE_STATUSES = Set.of("CONFIRMED", "CHECKED_IN");

    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final InvoiceRepository invoiceRepository;

    public PublicAmenityServiceImpl(
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicAmenityResponse> getActiveAmenities() {
        Stream<PublicAmenityResponse> facilities = facilityServiceRepository.findAll().stream()
                .filter(FacilityService::isActive)
                .map(service -> new PublicAmenityResponse(
                        service.getId(), service.getName(), service.getPrice(), "FACILITY", null
                ));
        Stream<PublicAmenityResponse> inventories = inventoryServiceRepository.findAll().stream()
                .filter(service -> service.getQuantityInStock() == null || service.getQuantityInStock() > 0)
                .map(service -> new PublicAmenityResponse(
                        service.getId(), service.getName(), service.getPrice(), "INVENTORY", service.getQuantityInStock()
                ));
        return Stream.concat(facilities, inventories)
                .sorted(Comparator.comparing(PublicAmenityResponse::name, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EligibleServiceBookingResponse> getEligibleBookings(String email) {
        LocalDateTime now = LocalDateTime.now();
        return bookingDetailRepository.findByCustomerEmailForHistory(email).stream()
                .collect(Collectors.groupingBy(detail -> detail.getBooking().getId()))
                .values().stream()
                .filter(details -> isEligible(details, now))
                .map(this::toEligibleResponse)
                .sorted(Comparator.comparing(EligibleServiceBookingResponse::checkInTarget))
                .toList();
    }

    @Override
    @Transactional
    public AddedBookingServiceResponse addServiceToBooking(
            String email,
            Long bookingId,
            AddBookingFacilityServiceRequest request
    ) {
        Booking booking = bookingRepository.findByIdForPaymentUpdate(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng"));
        String ownerEmail = booking.getCustomer() != null && booking.getCustomer().getAccount() != null
                ? booking.getCustomer().getAccount().getEmail() : null;
        if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật đơn đặt phòng này");
        }

        List<BookingDetail> details = bookingDetailRepository.findByBookingId(bookingId);
        if (!isEligible(details, LocalDateTime.now())) {
            throw new IllegalArgumentException("Đơn đặt phòng không còn đủ điều kiện để thêm dịch vụ");
        }

        BookingDetail targetDetail = details.stream()
                .min(Comparator.comparing(BookingDetail::getCheckInTarget))
                .orElseThrow(() -> new IllegalArgumentException("Đơn đặt phòng chưa có thông tin phòng"));

        List<Long> detailIds = details.stream().map(BookingDetail::getId).toList();
        String type = normalize(request.type());
        ServiceSelection selected = resolveService(type, request.serviceId());
        BookingServiceItem item = bookingServiceItemRepository.findByBookingDetailIds(detailIds).stream()
                .filter(existing -> matchesService(existing, selected))
                .filter(existing -> selected.price().compareTo(existing.getPriceAtBooking()) == 0)
                .findFirst()
                .orElseGet(() -> BookingServiceItem.builder()
                        .bookingDetail(targetDetail)
                        .facilityService(selected.facilityService())
                        .inventoryService(selected.inventoryService())
                        .quantity(0)
                        .priceAtBooking(selected.price())
                        .build());
        if (item.getQuantity() + request.quantity() > 20) {
            throw new IllegalArgumentException("Mỗi dịch vụ chỉ được chọn tối đa 20 lần cho một booking");
        }
        validateInventoryStock(selected, item.getQuantity() + request.quantity());
        item.setQuantity(item.getQuantity() + request.quantity());
        item = bookingServiceItemRepository.save(item);

        BigDecimal addedAmount = selected.price().multiply(BigDecimal.valueOf(request.quantity()));
        invoiceRepository.findByBookingIdForAdmin(bookingId).ifPresent(invoice -> updateInvoice(invoice, addedAmount));

        List<BookingServiceItem> currentItems = bookingServiceItemRepository.findByBookingDetailIds(detailIds);
        BigDecimal serviceCharge = currentItems.stream()
                .map(current -> current.getPriceAtBooking().multiply(BigDecimal.valueOf(current.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal roomCharge = details.stream().map(BookingDetail::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AddedBookingServiceResponse(
                bookingId,
                item.getId(),
                selected.name(),
                request.quantity(),
                selected.price(),
                addedAmount,
                serviceCharge,
                roomCharge.add(serviceCharge)
        );
    }

    private ServiceSelection resolveService(String type, Long serviceId) {
        if ("FACILITY".equals(type)) {
            FacilityService service = facilityServiceRepository.findById(serviceId)
                    .filter(FacilityService::isActive)
                    .orElseThrow(() -> new IllegalArgumentException("Dịch vụ không tồn tại hoặc đã ngừng phục vụ"));
            return new ServiceSelection(service.getId(), service.getName(), service.getPrice(), service, null);
        }
        if ("INVENTORY".equals(type)) {
            InventoryService service = inventoryServiceRepository.findById(serviceId)
                    .orElseThrow(() -> new IllegalArgumentException("Dịch vụ thuê đồ không tồn tại"));
            if (service.getQuantityInStock() != null && service.getQuantityInStock() <= 0) {
                throw new IllegalArgumentException("Dịch vụ thuê đồ đã hết tồn kho");
            }
            return new ServiceSelection(service.getId(), service.getName(), service.getPrice(), null, service);
        }
        throw new IllegalArgumentException("Loại dịch vụ không hợp lệ");
    }

    private boolean matchesService(BookingServiceItem item, ServiceSelection selected) {
        if (selected.facilityService() != null) {
            return item.getFacilityService() != null
                    && selected.id().equals(item.getFacilityService().getId());
        }
        return item.getInventoryService() != null
                && selected.id().equals(item.getInventoryService().getId());
    }

    private void validateInventoryStock(ServiceSelection selected, int requestedQuantity) {
        InventoryService inventoryService = selected.inventoryService();
        if (inventoryService != null
                && inventoryService.getQuantityInStock() != null
                && requestedQuantity > inventoryService.getQuantityInStock()) {
            throw new IllegalArgumentException("Số lượng dịch vụ thuê đồ vượt tồn kho");
        }
    }

    private boolean isEligible(List<BookingDetail> details, LocalDateTime now) {
        if (details == null || details.isEmpty()) return false;
        Booking booking = details.get(0).getBooking();
        if (!ELIGIBLE_STATUSES.contains(normalize(booking.getStatus()))) return false;
        return details.stream().anyMatch(detail ->
                ELIGIBLE_STATUSES.contains(normalize(detail.getStatus()))
                        && detail.getCheckOutTarget() != null
                        && detail.getCheckOutTarget().isAfter(now));
    }

    private EligibleServiceBookingResponse toEligibleResponse(List<BookingDetail> details) {
        Booking booking = details.get(0).getBooking();
        BookingDetail first = details.stream().min(Comparator.comparing(BookingDetail::getCheckInTarget)).orElse(details.get(0));
        LocalDateTime checkout = details.stream().map(BookingDetail::getCheckOutTarget)
                .max(LocalDateTime::compareTo).orElse(first.getCheckOutTarget());
        String roomTypeName = first.getRoomType() != null ? first.getRoomType().getName() : "Phòng tại Home Stays";
        return new EligibleServiceBookingResponse(
                booking.getId(), booking.getStatus(), roomTypeName, details.size(), first.getCheckInTarget(), checkout
        );
    }

    private void updateInvoice(Invoice invoice, BigDecimal addedAmount) {
        invoice.setServiceCharge(zeroIfNull(invoice.getServiceCharge()).add(addedAmount));
        invoice.setTotalAmount(zeroIfNull(invoice.getTotalAmount()).add(addedAmount));
        invoiceRepository.save(invoice);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private record ServiceSelection(
            Long id,
            String name,
            BigDecimal price,
            FacilityService facilityService,
            InventoryService inventoryService
    ) {
    }
}
