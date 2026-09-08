package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.request.RedeemVoucherRequest;
import com.homestayManagement.homestayManagement.dto.response.RedeemedVoucherResponse;
import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.service.CustomerVoucherRedeemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/vouchers")
public class CustomerVoucherRedeemController {

    private final CustomerVoucherRedeemService customerVoucherRedeemService;

    public CustomerVoucherRedeemController(CustomerVoucherRedeemService customerVoucherRedeemService) {
        this.customerVoucherRedeemService = customerVoucherRedeemService;
    }

    @PostMapping("/redeem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> redeemVoucher(
            @Valid @RequestBody RedeemVoucherRequest request,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đổi voucher"));
        }
        try {
            RedeemedVoucherResponse response = customerVoucherRedeemService.redeemVoucher(authentication.getName(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-redeemed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyRedeemedVouchers(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập"));
        }
        try {
            List<VoucherResponse> vouchers = customerVoucherRedeemService.getMyRedeemedVouchers(authentication.getName());
            return ResponseEntity.ok(vouchers);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
