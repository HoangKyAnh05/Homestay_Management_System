package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.entity.Voucher;
import com.homestayManagement.homestayManagement.repository.VoucherRepository;
import com.homestayManagement.homestayManagement.service.PublicVoucherService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PublicVoucherServiceImpl implements PublicVoucherService {
    private final VoucherRepository voucherRepository;

    public PublicVoucherServiceImpl(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    @Override
    public List<VoucherResponse> listActiveVouchers() {
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findAllByOrderByEndDateAscIdDesc().stream()
                .filter(voucher -> isActive(voucher, now))
                .map(this::toResponse)
                .toList();
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
