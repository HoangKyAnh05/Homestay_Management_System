package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.RedeemVoucherRequest;
import com.homestayManagement.homestayManagement.dto.response.RedeemedVoucherResponse;
import com.homestayManagement.homestayManagement.dto.response.VoucherResponse;

import java.util.List;

public interface CustomerVoucherRedeemService {
    RedeemedVoucherResponse redeemVoucher(String userEmail, RedeemVoucherRequest request);

    List<VoucherResponse> getMyRedeemedVouchers(String userEmail);
}
