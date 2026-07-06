package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.ActivateStayAccountRequest;
import com.homestayManagement.homestayManagement.dto.request.AddBookingFacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.security.JwtService;
import com.homestayManagement.homestayManagement.service.StayAccessService;
import com.homestayManagement.homestayManagement.service.event.StayAccessEmailEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class StayAccessServiceImpl implements StayAccessService {

    private static final String CUSTOMER_ROLE = "ROLE_CUSTOMER";
    private static final int ACTIVATION_EXPIRY_HOURS = 24;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StayAccessRepository stayAccessRepository;
    private final AccountActivationTokenRepository activationTokenRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final RoleRepository roleRepository;
    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final InvoiceRepository invoiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;

    public StayAccessServiceImpl(
            StayAccessRepository stayAccessRepository,
            AccountActivationTokenRepository activationTokenRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            BookingServiceItemRepository bookingServiceItemRepository,
            ServiceUsageRepository serviceUsageRepository,
            InvoiceRepository invoiceRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.stayAccessRepository = stayAccessRepository;
        this.activationTokenRepository = activationTokenRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.bookingServiceItemRepository = bookingServiceItemRepository;
        this.serviceUsageRepository = serviceUsageRepository;
        this.invoiceRepository = invoiceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public GrantResult grantAccess(
            BookingDetail bookingDetail,
            CheckInRecord checkInRecord,
            String representativeName,
            String representativeEmail
    ) {
        if (stayAccessRepository.findByBookingDetailId(bookingDetail.getId()).isPresent()) {
            throw new IllegalArgumentException("Phòng này đã được cấp quyền truy cập lưu trú");
        }

        String email = normalizeEmail(representativeEmail);
        Account account = accountRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> createCustomerAccount(email, representativeName));
        requireCustomerAccount(account);
        ensureCustomerProfile(account, representativeName);

        LocalDateTime now = LocalDateTime.now();
        boolean activationRequired = !account.isActive();
        StayAccess access = StayAccess.builder()
                .account(account)
                .bookingDetail(bookingDetail)
                .checkInRecord(checkInRecord)
                .representativeName(representativeName.trim())
                .status(activationRequired ? StayAccess.INVITED : StayAccess.ACTIVE)
                .invitedAt(now)
                .activatedAt(activationRequired ? null : now)
                .build();
        access = stayAccessRepository.save(access);

        String activationToken = activationRequired ? createActivationToken(account) : null;
        Room room = bookingDetail.getRoom();
        eventPublisher.publishEvent(new StayAccessEmailEvent(
                email,
                representativeName.trim(),
                room != null ? room.getRoomNumber() : "chưa xác định",
                bookingDetail.getBooking().getBookingCode(),
                bookingDetail.getCheckOutTarget(),
                activationToken
        ));

        return new GrantResult(
                access.getId(),
                email,
                access.getStatus(),
                activationRequired,
                true
        );
    }

    @Override
    @Transactional
    public void expireAccess(Long bookingDetailId) {
        stayAccessRepository.findByBookingDetailId(bookingDetailId).ifPresent(access -> {
            if (!StayAccess.EXPIRED.equals(access.getStatus())) {
                access.setStatus(StayAccess.EXPIRED);
                access.setExpiresAt(LocalDateTime.now());
                stayAccessRepository.save(access);
            }
        });
    }

    @Override
    @Transactional
    public AuthResponse activate(ActivateStayAccountRequest request) {
        AccountActivationToken token = activationTokenRepository.findByTokenHash(hashToken(request.token()))
                .orElseThrow(() -> new IllegalArgumentException("Link kích hoạt không hợp lệ"));
        LocalDateTime now = LocalDateTime.now();
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw new IllegalArgumentException("Link kích hoạt đã được sử dụng hoặc hết hạn");
        }

        Account account = token.getAccount();
        requireCustomerAccount(account);
        if (account.isActive()) {
            throw new IllegalArgumentException("Tài khoản đã được kích hoạt");
        }

        account.setPassword(passwordEncoder.encode(request.password()));
        account.setActive(true);
        accountRepository.save(account);

        token.setUsedAt(now);
        activationTokenRepository.save(token);
        stayAccessRepository.findByAccountIdAndStatus(account.getId(), StayAccess.INVITED).forEach(access -> {
            access.setStatus(StayAccess.ACTIVE);
            access.setActivatedAt(now);
            stayAccessRepository.save(access);
        });

        String jwt = jwtService.generateToken(account);
        return new AuthResponse("Bearer", jwt, toUserResponse(account));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaySummaryResponse> getCurrentStays(String email) {
        return stayAccessRepository.findCurrentByAccountEmail(email).stream()
                .map(this::toStaySummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicAmenityResponse> getAvailableServices() {
        Stream<PublicAmenityResponse> facilities = facilityServiceRepository.findAll().stream()
                .filter(FacilityService::isActive)
                .map(service -> new PublicAmenityResponse(
                        service.getId(), service.getName(), service.getPrice(),
                        "FACILITY", null, service.getImageUrl()
                ));
        Stream<PublicAmenityResponse> inventories = inventoryServiceRepository.findAll().stream()
                .filter(service -> service.getQuantityInStock() == null || service.getQuantityInStock() > 0)
                .map(service -> new PublicAmenityResponse(
                        service.getId(), service.getName(), service.getPrice(),
                        "INVENTORY", service.getQuantityInStock(), service.getImageUrl()
                ));
        return Stream.concat(facilities, inventories)
                .sorted(Comparator.comparing(PublicAmenityResponse::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    @Transactional
    public StayServiceOrderResponse addService(
            String email,
            Long accessId,
            AddBookingFacilityServiceRequest request
    ) {
        StayAccess access = stayAccessRepository.findByIdAndAccountEmail(accessId, email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quyền lưu trú"));
        requireOpenAccess(access);

        String type = request.type().trim().toUpperCase(Locale.ROOT);
        ServiceUsage.ServiceUsageBuilder usageBuilder = ServiceUsage.builder()
                .checkInRecord(access.getCheckInRecord())
                .quantity(request.quantity());
        String serviceName;
        Long serviceId;
        BigDecimal unitPrice;

        if ("FACILITY".equals(type)) {
            FacilityService service = facilityServiceRepository.findById(request.serviceId())
                    .filter(FacilityService::isActive)
                    .orElseThrow(() -> new IllegalArgumentException("Dịch vụ không tồn tại hoặc đã ngừng phục vụ"));
            serviceName = service.getName();
            serviceId = service.getId();
            unitPrice = service.getPrice();
            usageBuilder.facilityService(service).priceAtUse(unitPrice);
        } else if ("INVENTORY".equals(type)) {
            InventoryService service = inventoryServiceRepository.findById(request.serviceId())
                    .orElseThrow(() -> new IllegalArgumentException("Dịch vụ thuê đồ không tồn tại"));
            Integer stock = service.getQuantityInStock();
            if (stock != null && request.quantity() > stock) {
                throw new IllegalArgumentException("Số lượng yêu cầu vượt quá tồn kho");
            }
            if (stock != null) {
                service.setQuantityInStock(stock - request.quantity());
                inventoryServiceRepository.save(service);
            }
            serviceName = service.getName();
            serviceId = service.getId();
            unitPrice = service.getPrice();
            usageBuilder.inventoryService(service).priceAtUse(unitPrice);
        } else {
            throw new IllegalArgumentException("Loại dịch vụ không hợp lệ");
        }

        ServiceUsage usage = serviceUsageRepository.save(usageBuilder.build());
        BigDecimal addedAmount = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));
        invoiceRepository.findByBookingIdForAdmin(access.getBookingDetail().getBooking().getId())
                .ifPresent(invoice -> {
                    invoice.setServiceCharge(zero(invoice.getServiceCharge()).add(addedAmount));
                    invoice.setTotalAmount(zero(invoice.getTotalAmount()).add(addedAmount));
                    invoiceRepository.save(invoice);
                });

        StayServiceUsageResponse serviceResponse = new StayServiceUsageResponse(
                usage.getId(), "STAY", type, serviceId, serviceName,
                request.quantity(), unitPrice, addedAmount
        );
        String roomNumber = access.getBookingDetail().getRoom() != null
                ? access.getBookingDetail().getRoom().getRoomNumber()
                : null;
        return new StayServiceOrderResponse(access.getId(), roomNumber, serviceResponse);
    }

    private Account createCustomerAccount(String email, String representativeName) {
        Role customerRole = roleRepository.findByName(CUSTOMER_ROLE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vai trò khách hàng"));
        Account account = accountRepository.save(Account.builder()
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(customerRole)
                .isActive(false)
                .build());
        customerRepository.save(Customer.builder()
                .account(account)
                .fullName(representativeName.trim())
                .build());
        return account;
    }

    private void ensureCustomerProfile(Account account, String representativeName) {
        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);
        if (customer == null) {
            customerRepository.save(Customer.builder()
                    .account(account)
                    .fullName(representativeName.trim())
                    .build());
        }
    }

    private String createActivationToken(Account account) {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        activationTokenRepository.save(AccountActivationToken.builder()
                .account(account)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusHours(ACTIVATION_EXPIRY_HOURS))
                .build());
        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 không được hỗ trợ", exception);
        }
    }

    private void requireOpenAccess(StayAccess access) {
        if (!StayAccess.ACTIVE.equals(access.getStatus())) {
            throw new IllegalArgumentException("Quyền truy cập phòng không còn hiệu lực");
        }
        if (access.getCheckInRecord().getActualCheckOut() != null
                || !"CHECKED_IN".equalsIgnoreCase(access.getBookingDetail().getStatus())) {
            throw new IllegalArgumentException("Phòng đã checkout, không thể đặt thêm dịch vụ");
        }
    }

    private void requireCustomerAccount(Account account) {
        if (account.getRole() == null || !CUSTOMER_ROLE.equals(account.getRole().getName())) {
            throw new IllegalArgumentException("Email này đang thuộc tài khoản nhân viên, vui lòng dùng email khách hàng");
        }
    }

    private StaySummaryResponse toStaySummary(StayAccess access) {
        BookingDetail detail = access.getBookingDetail();
        Room room = detail.getRoom();
        List<StayServiceUsageResponse> services = Stream.concat(
                        bookingServiceItemRepository.findByBookingDetailIds(List.of(detail.getId())).stream()
                                .map(this::toPreBookedService),
                        serviceUsageRepository.findByBookingDetailIdForAdmin(detail.getId()).stream()
                                .map(this::toServiceUsage)
                )
                .toList();
        return new StaySummaryResponse(
                access.getId(),
                access.getStatus(),
                detail.getBooking().getId(),
                detail.getBooking().getBookingCode(),
                detail.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getRoomNumber() : null,
                detail.getRoomType() != null ? detail.getRoomType().getName() : null,
                access.getRepresentativeName(),
                access.getCheckInRecord().getActualCheckIn(),
                detail.getCheckOutTarget(),
                services
        );
    }

    private StayServiceUsageResponse toServiceUsage(ServiceUsage usage) {
        boolean facility = usage.getFacilityService() != null;
        Long serviceId = facility ? usage.getFacilityService().getId() : usage.getInventoryService().getId();
        String serviceName = facility ? usage.getFacilityService().getName() : usage.getInventoryService().getName();
        BigDecimal total = usage.getPriceAtUse().multiply(BigDecimal.valueOf(usage.getQuantity()));
        return new StayServiceUsageResponse(
                usage.getId(),
                "STAY",
                facility ? "FACILITY" : "INVENTORY",
                serviceId,
                serviceName,
                usage.getQuantity(),
                usage.getPriceAtUse(),
                total
        );
    }

    private StayServiceUsageResponse toPreBookedService(BookingServiceItem item) {
        boolean facility = item.getFacilityService() != null;
        Long serviceId = facility ? item.getFacilityService().getId() : item.getInventoryService().getId();
        String serviceName = facility ? item.getFacilityService().getName() : item.getInventoryService().getName();
        BigDecimal total = item.getPriceAtBooking().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new StayServiceUsageResponse(
                item.getId(),
                "PRE_BOOKED",
                facility ? "FACILITY" : "INVENTORY",
                serviceId,
                serviceName,
                item.getQuantity(),
                item.getPriceAtBooking(),
                total
        );
    }

    private UserResponse toUserResponse(Account account) {
        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);
        return new UserResponse(
                account.getId(),
                account.getEmail(),
                customer != null ? customer.getFullName() : account.getEmail(),
                customer != null ? customer.getPhone() : null,
                customer != null ? customer.getDateOfBirth() : null,
                customer != null ? customer.getAddress() : null,
                customer != null ? customer.getAvatarUrl() : null,
                account.getRole().getName(),
                customer != null ? customer.getIdentityDocumentNumber() : null
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
