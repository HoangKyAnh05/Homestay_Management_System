package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.response.IdentityOcrResponse;
import org.springframework.web.multipart.MultipartFile;

public interface IdentityOcrService {
    IdentityOcrResponse extractIdentity(MultipartFile imageFront, MultipartFile imageBack);
}
