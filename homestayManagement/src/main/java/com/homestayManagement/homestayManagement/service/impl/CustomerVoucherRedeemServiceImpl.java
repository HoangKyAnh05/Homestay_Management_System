package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RedeemVoucherRequest;
import com.homestayManagement.homestayManagement.dto.response.RedeemedVoucherResponse;
import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Voucher;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.VoucherRepository;
import com.homestayManagement.homestayManagement.service.CustomerVoucherRedeemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CustomerVoucherRedeemServiceImpl implements CustomerVoucherRedeemService {

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final VoucherRepository voucherRepository;

    public CustomerVoucherRedeemServiceImpl(CustomerRepository customerRepository,
                                           AccountRepository accountRepository,
                                           VoucherRepository voucherRepository) {
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.voucherRepository = voucherRepository;
    }

    private record RewardPackage(
            String id,
            String name,
            int requiredPoints,
            String discountType,
            BigDecimal discountValue,
            BigDecimal minOrderValue,
            BigDecimal maxDiscountAmount,
            int validDays
    ) {}

    private RewardPackage getPackage(String packageId) {
        if (packageId == null) {
            throw new IllegalArgumentException("Vui lòng chọn gói đổi voucher");
        }
        return switch (packageId.trim().toUpperCase(Locale.ROOT)) {
            case "PACKAGE_20K" -> new RewardPackage(
                    "PACKAGE_20K", "Voucher Lá Đỏ 20.000đ", 5,
                    "FIXED_AMOUNT", BigDecimal.valueOf(20_000), BigDecimal.valueOf(200_000), BigDecimal.valueOf(20_000), 30
            );
            case "PACKAGE_50K" -> new RewardPackage(
                    "PACKAGE_50K", "Voucher Lá Đỏ 50.000đ", 10,
                    "FIXED_AMOUNT", BigDecimal.valueOf(50_000), BigDecimal.valueOf(400_000), BigDecimal.valueOf(50_000), 30
            );
            case "PACKAGE_100K" -> new RewardPackage(
                    "PACKAGE_100K", "Voucher Lá Đỏ 100.000đ", 20,
                    "FIXED_AMOUNT", BigDecimal.valueOf(100_000), BigDecimal.valueOf(800_000), BigDecimal.valueOf(100_000), 30
            );
            case "PACKAGE_10PCT" -> new RewardPackage(
                    "PACKAGE_10PCT", "Voucher Giảm 10% Tối Đa 150.000đ", 30,
                    "PERCENTAGE", BigDecimal.valueOf(10), BigDecimal.valueOf(600_000), BigDecimal.valueOf(150_000), 30
            );
            case "PACKAGE_200K" -> new RewardPackage(
                    "PACKAGE_200K", "Voucher Tri Ân Lá Đỏ 200.000đ", 50,
                    "FIXED_AMOUNT", BigDecimal.valueOf(200_000), BigDecimal.valueOf(1_500_000), BigDecimal.valueOf(200_000), 45
            );
            case "PACKAGE_500K" -> new RewardPackage(
                    "PACKAGE_500K", "Voucher VIP Lá Đỏ 500.000đ", 100,
                    "FIXED_AMOUNT", BigDecimal.valueOf(500_000), BigDecimal.valueOf(3_000_000), BigDecimal.valueOf(500_000), 60
            );
            default -> throw new IllegalArgumentException("Gói đổi điểm không hợp lệ hoặc đã hết hạn");
        };
    }

    @Override
    @Transactional
    public RedeemedVoucherResponse redeemVoucher(String userEmail, RedeemVoucherRequest request) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng"));
        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ khách hàng"));

        RewardPackage pkg = getPackage(request.packageId());

        int currentPoints = customer.getMemberPoints() == null ? 0 : customer.getMemberPoints();
        if (currentPoints < pkg.requiredPoints()) {
            throw new IllegalArgumentException(String.format(
                    "Bạn không đủ điểm thưởng để đổi gói này. Điểm hiện có: %d, cần: %d điểm.",
                    currentPoints, pkg.requiredPoints()
            ));
        }

        int remainingPoints = currentPoints - pkg.requiredPoints();
        customer.setMemberPoints(remainingPoints);
        customer.setMemberDiscountPercent(BigDecimal.valueOf(Math.min(15, remainingPoints / 10)));
        customerRepository.save(customer);

        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
        String code = "LP" + customer.getId() + "-" + randomSuffix;
        if (code.length() > 20) {
            code = code.substring(0, 20);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusDays(pkg.validDays());

        Voucher voucher = Voucher.builder()
                .code(code)
                .discountType(pkg.discountType())
                .discountValue(pkg.discountValue())
                .minOrderValue(pkg.minOrderValue())
                .maxDiscountAmount(pkg.maxDiscountAmount())
                .startDate(now)
                .endDate(expiry)
                .usageLimit(1)
                .usedCount(0)
                .customer(customer)
                .build();
        voucherRepository.save(voucher);

        return new RedeemedVoucherResponse(
                voucher.getId(),
                voucher.getCode(),
                pkg.name(),
                voucher.getDiscountType(),
                voucher.getDiscountValue(),
                voucher.getMinOrderValue(),
                voucher.getMaxDiscountAmount(),
                voucher.getStartDate(),
                voucher.getEndDate(),
                voucher.getUsageLimit(),
                voucher.getUsedCount(),
                pkg.requiredPoints(),
                remainingPoints
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getMyRedeemedVouchers(String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng"));
        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ khách hàng"));

        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findByCustomerIdOrderByStartDateDescIdDesc(customer.getId()).stream()
                .map(v -> {
                    String status = "ACTIVE";
                    if (v.getUsedCount() != null && v.getUsageLimit() != null && v.getUsedCount() >= v.getUsageLimit()) {
                        status = "USED";
                    } else if (v.getEndDate() != null && v.getEndDate().isBefore(now)) {
                        status = "EXPIRED";
                    }
                    return new VoucherResponse(
                            v.getId(),
                            v.getCode(),
                            v.getDiscountType(),
                            v.getDiscountValue(),
                            v.getMinOrderValue(),
                            v.getMaxDiscountAmount(),
                            v.getStartDate(),
                            v.getEndDate(),
                            v.getUsageLimit(),
                            v.getUsedCount(),
                            status
                    );
                })
                .toList();
    }
}
