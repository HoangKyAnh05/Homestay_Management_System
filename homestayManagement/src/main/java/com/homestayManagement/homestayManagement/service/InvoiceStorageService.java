package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.email.CheckoutInvoiceEmailSnapshot;

import java.nio.file.Path;

public interface InvoiceStorageService {

    /**
     * Lưu trữ bản thể hiện HTML của hóa đơn điện tử vào thư mục được cấu hình.
     *
     * @param invoice Snapshot thông tin hóa đơn
     * @param htmlContent Nội dung HTML hóa đơn điện tử
     * @return Đường dẫn Path của file đã được lưu
     */
    Path saveInvoiceHtml(CheckoutInvoiceEmailSnapshot invoice, String htmlContent);

    /**
     * Lấy đường dẫn thư mục lưu trữ hóa đơn.
     *
     * @return Path thư mục lưu trữ
     */
    Path getStorageDirectory();
}
