package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.ShiftHandoverRequest;
import com.homestayManagement.homestayManagement.dto.response.ShiftHandoverResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.ShiftHandover;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.PaymentRepository;
import com.homestayManagement.homestayManagement.repository.ShiftHandoverRepository;
import com.homestayManagement.homestayManagement.service.impl.ShiftHandoverServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShiftHandoverServiceImplTest {

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private com.homestayManagement.homestayManagement.repository.FixedFundConfigRepository fixedFundConfigRepository;
    @Mock
    private com.homestayManagement.homestayManagement.repository.FundAdjustmentLogRepository fundAdjustmentLogRepository;

    private ShiftHandoverServiceImpl service;

    private Account incomingAccount;
    private Employee incomingEmployee;
    private Account outgoingAccount;
    private Employee outgoingEmployee;

    @BeforeEach
    void setUp() {
        service = new ShiftHandoverServiceImpl(
                shiftHandoverRepository,
                accountRepository,
                employeeRepository,
                paymentRepository,
                passwordEncoder,
                fixedFundConfigRepository,
                fundAdjustmentLogRepository
        );

        Role role = Role.builder().id(2L).name("ROLE_RECEPTIONIST").build();

        com.homestayManagement.homestayManagement.entity.FixedFundConfig defaultFund = com.homestayManagement.homestayManagement.entity.FixedFundConfig.builder()
                .fundAmount(BigDecimal.valueOf(1000000))
                .fundMode("FIXED")
                .build();
        org.mockito.Mockito.lenient().when(fixedFundConfigRepository.findAll()).thenReturn(java.util.List.of(defaultFund));

        incomingAccount = Account.builder()
                .id(1L)
                .email("letan_b@homestay.com")
                .password("encoded_pwd_b")
                .role(role)
                .build();
        incomingEmployee = Employee.builder()
                .id(101L)
                .account(incomingAccount)
                .fullName("Lễ Tân B (Nhận ca)")
                .build();

        outgoingAccount = Account.builder()
                .id(2L)
                .email("letan_a@homestay.com")
                .password("encoded_pwd_a")
                .role(role)
                .build();
        outgoingEmployee = Employee.builder()
                .id(102L)
                .account(outgoingAccount)
                .fullName("Lễ Tân A (Giao ca)")
                .build();
    }

    @Test
    void handoverShiftThrowsWhenSameAccount() {
        when(accountRepository.findByEmail("letan_b@homestay.com")).thenReturn(Optional.of(incomingAccount));
        when(employeeRepository.findByAccountId(1L)).thenReturn(Optional.of(incomingEmployee));

        // Người giao ca trùng người nhận ca
        when(accountRepository.findByEmail("letan_b@homestay.com")).thenReturn(Optional.of(incomingAccount));

        ShiftHandoverRequest request = new ShiftHandoverRequest(
                "letan_b@homestay.com",
                "123456",
                BigDecimal.valueOf(1000000),
                true,
                null,
                null,
                null,
                "Test"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.handoverShift(request, "letan_b@homestay.com")
        );
        assertTrue(ex.getMessage().contains("phải là 2 tài khoản khác nhau"));
    }

    @Test
    void handoverShiftThrowsWhenOutgoingPasswordInvalid() {
        when(accountRepository.findByEmail("letan_b@homestay.com")).thenReturn(Optional.of(incomingAccount));
        when(employeeRepository.findByAccountId(1L)).thenReturn(Optional.of(incomingEmployee));

        when(accountRepository.findByEmail("letan_a@homestay.com")).thenReturn(Optional.of(outgoingAccount));
        when(employeeRepository.findByAccountId(2L)).thenReturn(Optional.of(outgoingEmployee));

        when(passwordEncoder.matches("wrong_pwd", "encoded_pwd_a")).thenReturn(false);

        ShiftHandoverRequest request = new ShiftHandoverRequest(
                "letan_a@homestay.com",
                "wrong_pwd",
                BigDecimal.valueOf(1000000),
                true,
                null,
                null,
                null,
                "Test"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.handoverShift(request, "letan_b@homestay.com")
        );
        assertTrue(ex.getMessage().contains("Mật khẩu xác nhận của nhân viên giao ca"));
    }

    @Test
    void handoverShiftThrowsWhenShortageInfoMissing() {
        when(accountRepository.findByEmail("letan_b@homestay.com")).thenReturn(Optional.of(incomingAccount));
        when(employeeRepository.findByAccountId(1L)).thenReturn(Optional.of(incomingEmployee));

        when(accountRepository.findByEmail("letan_a@homestay.com")).thenReturn(Optional.of(outgoingAccount));
        when(employeeRepository.findByAccountId(2L)).thenReturn(Optional.of(outgoingEmployee));

        when(passwordEncoder.matches("correct_pwd", "encoded_pwd_a")).thenReturn(true);

        // Thiếu số tiền thiếu
        ShiftHandoverRequest reqNoAmount = new ShiftHandoverRequest(
                "letan_a@homestay.com",
                "correct_pwd",
                BigDecimal.valueOf(800000),
                false,
                null,
                "Lý do",
                LocalDateTime.now().plusDays(1),
                "Test"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.handoverShift(reqNoAmount, "letan_b@homestay.com")
        );
        assertTrue(ex.getMessage().contains("Vui lòng nhập số tiền thiếu"));
    }

    @Test
    void handoverShiftSuccessWhenSufficient() {
        when(accountRepository.findByEmail("letan_b@homestay.com")).thenReturn(Optional.of(incomingAccount));
        when(employeeRepository.findByAccountId(1L)).thenReturn(Optional.of(incomingEmployee));

        when(accountRepository.findByEmail("letan_a@homestay.com")).thenReturn(Optional.of(outgoingAccount));
        when(employeeRepository.findByAccountId(2L)).thenReturn(Optional.of(outgoingEmployee));

        when(passwordEncoder.matches("correct_pwd", "encoded_pwd_a")).thenReturn(true);

        when(shiftHandoverRepository.findFirstByStatusOrderByHandoverTimeDesc("ACTIVE")).thenReturn(Optional.empty());
        when(shiftHandoverRepository.findFirstByOrderByHandoverTimeDesc()).thenReturn(Optional.empty());
        when(paymentRepository.sumCashPaymentsBetween(any(), any())).thenReturn(BigDecimal.valueOf(500000));

        ShiftHandover savedEntity = ShiftHandover.builder()
                .id(10L)
                .outgoingStaff(outgoingEmployee)
                .incomingStaff(incomingEmployee)
                .handoverTime(LocalDateTime.now())
                .initialCash(BigDecimal.valueOf(1000000))
                .systemCash(BigDecimal.valueOf(1500000))
                .actualCash(BigDecimal.valueOf(1500000))
                .cashStatus("ENOUGH")
                .status("ACTIVE")
                .compensationStatus("NONE")
                .build();

        when(shiftHandoverRepository.save(any(ShiftHandover.class))).thenReturn(savedEntity);

        ShiftHandoverRequest request = new ShiftHandoverRequest(
                "letan_a@homestay.com",
                "correct_pwd",
                BigDecimal.valueOf(1500000),
                true,
                null,
                null,
                null,
                "Giao ca bình thường"
        );

        ShiftHandoverResponse res = service.handoverShift(request, "letan_b@homestay.com");

        assertNotNull(res);
        assertEquals(10L, res.id());
        assertEquals("ENOUGH", res.cashStatus());
        assertEquals("ACTIVE", res.status());
        assertEquals("Lễ Tân A (Giao ca)", res.outgoingStaffName());
        assertEquals("Lễ Tân B (Nhận ca)", res.incomingStaffName());
    }
}
