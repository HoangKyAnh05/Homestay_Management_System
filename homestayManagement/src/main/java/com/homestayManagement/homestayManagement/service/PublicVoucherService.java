package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;

import java.util.List;

public interface PublicVoucherService {
    List<VoucherResponse> listActiveVouchers();
    List<VoucherResponse> listActiveVouchers(String userEmail);
    VoucherResponse checkVoucher(String code);
}
