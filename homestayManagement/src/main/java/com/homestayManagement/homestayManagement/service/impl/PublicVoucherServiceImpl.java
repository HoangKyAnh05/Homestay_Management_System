package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Voucher;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.VoucherRepository;
import com.homestayManagement.homestayManagement.service.PublicVoucherService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PublicVoucherServiceImpl implements PublicVoucherService {
    private final VoucherRepository voucherRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    public PublicVoucherServiceImpl(VoucherRepository voucherRepository,
                                    AccountRepository accountRepository,
                                    CustomerRepository customerRepository) {
        this.voucherRepository = voucherRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    public List<VoucherResponse> listActiveVouchers() {
        return listActiveVouchers(null);
    }

    @Override
    public List<VoucherResponse> listActiveVouchers(String userEmail) {
        LocalDateTime now = LocalDateTime.now();
        Long currentCustomerId = null;
        if (userEmail != null && !userEmail.isBlank()) {
            Account account = accountRepository.findByEmail(userEmail).orElse(null);
            if (account != null) {
                Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);
                if (customer != null) {
                    currentCustomerId = customer.getId();
                }
            }
        }

        final Long customerId = currentCustomerId;
        return voucherRepository.findAllByOrderByEndDateAscIdDesc().stream()
                .filter(voucher -> isActive(voucher, now))
                .filter(voucher -> {
                    if (voucher.getCustomer() == null) {
                        return true;
                    }
                    return customerId != null && voucher.getCustomer().getId().equals(customerId);
                })
                .map(this::toResponse)
                .toList();
    }

    @Override
    public VoucherResponse checkVoucher(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã voucher hợp lệ");
        }
        LocalDateTime now = LocalDateTime.now();
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Mã voucher '" + code.trim() + "' không tồn tại"));
        if (!isActive(voucher, now)) {
            throw new IllegalArgumentException("Mã voucher '" + code.trim() + "' đã hết hạn hoặc hết lượt sử dụng");
        }
        return toResponse(voucher);
    }

    private boolean isActive(Voucher voucher, LocalDateTime now) {
        if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(now)) {
            return false;
        }
        if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(now)) {
            return false;
        }
        Integer limit = voucher.getUsageLimit();
        Integer used = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        return limit == null || used < limit;
    }

    private VoucherResponse toResponse(Voucher voucher) {
        return new VoucherResponse(
                voucher.getId(),
                voucher.getCode(),
                voucher.getDiscountType(),
                voucher.getDiscountValue(),
                voucher.getMinOrderValue(),
                voucher.getMaxDiscountAmount(),
                voucher.getStartDate(),
                voucher.getEndDate(),
                voucher.getUsageLimit(),
                voucher.getUsedCount() == null ? 0 : voucher.getUsedCount(),
                "active"
        );
    }
}
