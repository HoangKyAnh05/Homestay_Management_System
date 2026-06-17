package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.AdminCustomerBookingHistoryResponse;

public interface AdminCustomerHistoryService {
    AdminCustomerBookingHistoryResponse getBookingHistory(Long accountId);
}
