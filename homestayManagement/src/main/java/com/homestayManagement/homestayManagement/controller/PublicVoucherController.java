package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;
import com.homestayManagement.homestayManagement.service.PublicVoucherService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
public class PublicVoucherController {
    private final PublicVoucherService publicVoucherService;

    public PublicVoucherController(PublicVoucherService publicVoucherService) {
        this.publicVoucherService = publicVoucherService;
    }

    @GetMapping("/active")
    public List<VoucherResponse> listActiveVouchers() {
        return publicVoucherService.listActiveVouchers();
    }

    @GetMapping("/check/{code}")
    public org.springframework.http.ResponseEntity<?> checkVoucher(@org.springframework.web.bind.annotation.PathVariable String code) {
        try {
            return org.springframework.http.ResponseEntity.ok(publicVoucherService.checkVoucher(code));
        } catch (IllegalArgumentException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
