package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminCreateUserRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminUpdateUserRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminUserResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.service.AdminUserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserServiceImpl(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return accountRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));
        return toResponse(account);
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        if (accountRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email da duoc su dung");
        }

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay role"));

        Account account = Account.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .isActive(request.isActive())
                .role(role)
                .build();
        accountRepository.save(account);

        if (isCustomer(role)) {
            validatePhoneLength(request.phone(), 10);
            Customer detail = Customer.builder()
                    .account(account)
                    .fullName(request.fullName().trim())
                    .phone(blankToNull(request.phone()))
                    .build();
            customerRepository.save(detail);
        } else {
            validatePhoneLength(request.phone(), 15);
            Employee employee = Employee.builder()
                    .account(account)
                    .fullName(request.fullName().trim())
                    .phone(blankToNull(request.phone()))
                    .status("WORKING")
                    .build();
            employeeRepository.save(employee);
        }

        return toResponse(account);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay role"));

        account.setRole(role);
        account.setActive(request.isActive());
        accountRepository.save(account);

        if (isCustomer(role)) {
            validatePhoneLength(request.phone(), 10);
            employeeRepository.deleteByAccountId(id);
            Customer detail = customerRepository.findByAccountId(id)
                    .orElseGet(() -> Customer.builder().account(account).build());
            detail.setFullName(request.fullName().trim());
            detail.setPhone(blankToNull(request.phone()));
            customerRepository.save(detail);
        } else {
            validatePhoneLength(request.phone(), 15);
            customerRepository.deleteByAccountId(id);
            Employee employee = employeeRepository.findByAccountId(id)
                    .orElseGet(() -> Employee.builder().account(account).status("WORKING").build());
            employee.setFullName(request.fullName().trim());
            employee.setPhone(blankToNull(request.phone()));
            employeeRepository.save(employee);
        }

        return toResponse(account);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!accountRepository.existsById(id)) {
            throw new IllegalArgumentException("Khong tim thay tai khoan");
        }
        customerRepository.deleteByAccountId(id);
        employeeRepository.deleteByAccountId(id);
        accountRepository.deleteById(id);
    }

    @Override
    @Transactional
    public AdminUserResponse toggleActive(Long id, boolean isActive) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));
        account.setActive(isActive);
        accountRepository.save(account);
        return toResponse(account);
    }

    private AdminUserResponse toResponse(Account account) {
        Customer detail = customerRepository.findByAccountId(account.getId()).orElse(null);
        Employee employee = employeeRepository.findByAccountId(account.getId()).orElse(null);
        return new AdminUserResponse(
                account.getId(),
                account.getEmail(),
                detail != null ? detail.getFullName() : employee != null ? employee.getFullName() : null,
                detail != null ? detail.getPhone() : employee != null ? employee.getPhone() : null,
                detail != null ? detail.getAvatarUrl() : employee != null ? employee.getAvatarUrl() : null,
                account.getRole().getName(),
                account.getRole().getId(),
                account.isActive(),
                true,
                account.getCreatedAt()
        );
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private boolean isCustomer(Role role) {
        return "ROLE_CUSTOMER".equals(role.getName());
    }

    private void validatePhoneLength(String phone, int maxLength) {
        if (phone != null && phone.length() > maxLength) {
            throw new IllegalArgumentException("So dien thoai toi da " + maxLength + " ky tu");
        }
    }
}
