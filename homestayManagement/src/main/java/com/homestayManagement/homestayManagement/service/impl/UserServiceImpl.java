package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.UpdateProfileRequest;
import com.homestayManagement.homestayManagement.dto.response.UserResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {
    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;

    public UserServiceImpl(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository
    ) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        Account account = getAccountByEmail(email);
        return toUserResponse(account);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUserProfile(String email, UpdateProfileRequest request) {
        Account account = getAccountByEmail(email);
        if (isCustomer(account)) {
            validatePhoneLength(request.phone(), 10);
            Customer customer = customerRepository.findByAccountId(account.getId())
                    .orElseGet(() -> Customer.builder().account(account).build());
            customer.setFullName(request.fullName().trim());
            customer.setPhone(blankToNull(request.phone()));
            customer.setDateOfBirth(request.dateOfBirth());
            customer.setAddress(blankToNull(request.address()));
            customer.setIdentityDocumentNumber(blankToNull(request.identityDocumentNumber()));
            customerRepository.save(customer);
        } else {
            validatePhoneLength(request.phone(), 15);
            Employee employee = employeeRepository.findByAccountId(account.getId())
                    .orElseGet(() -> Employee.builder().account(account).status("WORKING").build());
            employee.setFullName(request.fullName().trim());
            employee.setPhone(blankToNull(request.phone()));
            employee.setDateOfBirth(request.dateOfBirth());
            employee.setAddress(blankToNull(request.address()));
            employeeRepository.save(employee);
        }

        return toUserResponse(account);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUserAvatar(String email, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new IllegalArgumentException("Vui long chon anh dai dien");
        }

        if (!ALLOWED_IMAGE_TYPES.contains(avatar.getContentType())) {
            throw new IllegalArgumentException("Anh dai dien chi ho tro JPG, PNG hoac WEBP");
        }

        Account account = getAccountByEmail(email);

        try {
            Files.createDirectories(UPLOAD_DIR);
            String filename = "avatar-" + account.getId() + "-" + UUID.randomUUID() + getExtension(avatar.getOriginalFilename());
            Path targetPath = UPLOAD_DIR.resolve(filename).normalize();
            avatar.transferTo(targetPath);

            if (isCustomer(account)) {
                Customer customer = customerRepository.findByAccountId(account.getId())
                        .orElseGet(() -> Customer.builder().account(account).fullName(account.getEmail()).build());
                customer.setAvatarUrl("/uploads/" + filename);
                customerRepository.save(customer);
            } else {
                Employee employee = employeeRepository.findByAccountId(account.getId())
                        .orElseGet(() -> Employee.builder()
                                .account(account)
                                .fullName(account.getEmail())
                                .status("WORKING")
                                .build());
                employee.setAvatarUrl("/uploads/" + filename);
                employeeRepository.save(employee);
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the luu anh dai dien");
        }

        return toUserResponse(account);
    }

    private Account getAccountByEmail(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay nguoi dung"));
    }

    private UserResponse toUserResponse(Account account) {
        Customer customer = customerRepository.findByAccountId(account.getId()).orElse(null);
        Employee employee = employeeRepository.findByAccountId(account.getId()).orElse(null);

        return new UserResponse(
                account.getId(),
                account.getEmail(),
                profileName(account, customer, employee),
                customer != null ? customer.getPhone() : employee != null ? employee.getPhone() : null,
                customer != null ? customer.getDateOfBirth() : employee != null ? employee.getDateOfBirth() : null,
                customer != null ? customer.getAddress() : employee != null ? employee.getAddress() : null,
                customer != null ? customer.getAvatarUrl() : employee != null ? employee.getAvatarUrl() : null,
                account.getRole().getName(),
                customer != null ? customer.getIdentityDocumentNumber() : null
        );
    }

    private boolean isCustomer(Account account) {
        return "ROLE_CUSTOMER".equals(account.getRole().getName());
    }

    private String profileName(Account account, Customer customer, Employee employee) {
        if (customer != null && customer.getFullName() != null) {
            return customer.getFullName();
        }
        if (employee != null && employee.getFullName() != null) {
            return employee.getFullName();
        }
        return account.getEmail();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private void validatePhoneLength(String phone, int maxLength) {
        if (phone != null && phone.length() > maxLength) {
            throw new IllegalArgumentException("So dien thoai toi da " + maxLength + " ky tu");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }

        String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
        if (!Set.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
            return ".jpg";
        }

        return extension;
    }
}
