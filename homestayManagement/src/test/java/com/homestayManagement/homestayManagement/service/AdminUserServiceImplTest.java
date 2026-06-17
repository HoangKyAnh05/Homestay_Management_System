package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminUserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminUserServiceImpl(
                accountRepository,
                customerRepository,
                employeeRepository,
                roleRepository,
                passwordEncoder
        );
    }

    @Test
    void getUserByIdReturnsCustomerIdentityDocumentNumber() {
        Role role = Role.builder().id(3L).name("ROLE_CUSTOMER").build();
        Account account = Account.builder().id(10L).email("customer@example.com").role(role).build();
        Customer customer = Customer.builder()
                .account(account)
                .fullName("Nguyễn Văn A")
                .identityDocumentNumber("012345678901")
                .build();

        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));
        when(customerRepository.findByAccountId(10L)).thenReturn(Optional.of(customer));
        when(employeeRepository.findByAccountId(10L)).thenReturn(Optional.empty());

        var response = service.getUserById(10L);

        assertEquals("012345678901", response.identityDocumentNumber());
    }
}
