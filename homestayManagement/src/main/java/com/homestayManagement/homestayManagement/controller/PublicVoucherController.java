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
}
