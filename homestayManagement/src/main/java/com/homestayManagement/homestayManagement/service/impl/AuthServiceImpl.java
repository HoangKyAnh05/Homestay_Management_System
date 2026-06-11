package com.homestayManagement.homestayManagement.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestayManagement.homestayManagement.dto.request.GoogleLoginRequest;
import com.homestayManagement.homestayManagement.dto.request.LoginRequest;
import com.homestayManagement.homestayManagement.dto.request.RegisterRequest;
import com.homestayManagement.homestayManagement.dto.request.VerifyOtpRequest;
import com.homestayManagement.homestayManagement.dto.response.AuthResponse;
import com.homestayManagement.homestayManagement.dto.response.UserResponse;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.Customer;
import com.homestayManagement.homestayManagement.entity.Employee;
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.CustomerRepository;
import com.homestayManagement.homestayManagement.repository.EmployeeRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository;
import com.homestayManagement.homestayManagement.repository.OtpTokenRepository.OtpToken;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.security.JwtService;
import com.homestayManagement.homestayManagement.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {
    private static final String GOOGLE_CUSTOMER_ROLE = "ROLE_CUSTOMER";
    private static final String CUSTOMER_ROLE = "ROLE_CUSTOMER";
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    private static final String GOOGLE_ACCESS_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?access_token=";
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final int OTP_EXPIRY_MINUTES = 3;

    private final AuthenticationManager authenticationManager;
    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final OtpTokenRepository tokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;
    private final String googleClientId;
    private final String mailFrom;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            RoleRepository roleRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            EmployeeRepository employeeRepository,
            OtpTokenRepository tokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            JavaMailSender mailSender,
            @Value("${app.google.client-id:}") String googleClientId,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.authenticationManager = authenticationManager;
        this.roleRepository = roleRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.mailSender = mailSender;
        this.googleClientId = googleClientId;
        this.mailFrom = mailFrom;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Email hoac mat khau khong dung"));

        if (!account.isActive()) {
            throw new IllegalArgumentException("Tai khoan chua duoc xac minh hoac da bi khoa");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException exception) {
            throw new IllegalArgumentException("Email hoac mat khau khong dung");
        }

        String token = jwtService.generateToken(account);
        return new AuthResponse("Bearer", token, toUserResponse(account));
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (accountRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email da duoc su dung");
        }

        Role customerRole = roleRepository.findByName(CUSTOMER_ROLE)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay role mac dinh"));

        Account account = Account.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .isActive(false)
                .role(customerRole)
                .build();
        accountRepository.save(account);

        Customer customer = Customer.builder()
                .account(account)
                .fullName(request.fullName().trim())
                .phone(request.phone() != null && !request.phone().isBlank() ? request.phone().trim() : null)
                .build();
        customerRepository.save(customer);

        sendEmailOtp(request.email());
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(VerifyOtpRequest request) {
        tokenRepository.findTopByEmailOrderByExpiresAtDesc(request.email())
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .filter(t -> t.getOtp().equals(request.otp()))
                .orElseThrow(() -> new IllegalArgumentException("Ma OTP khong dung hoac da het han"));

        Account account = accountRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan"));
        account.setActive(true);
        accountRepository.save(account);

        tokenRepository.deleteAllByEmail(request.email());

        String jwtToken = jwtService.generateToken(account);
        return new AuthResponse("Bearer", jwtToken, toUserResponse(account));
    }

    @Override
    public void resendVerifyEmail(String email) {
        if (!accountRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Khong tim thay tai khoan");
        }
        sendEmailOtp(email);
    }

    private void sendEmailOtp(String email) {
        tokenRepository.deleteAllByEmail(email);

        int code = new java.security.SecureRandom().nextInt(900000) + 100000;
        String otp = String.valueOf(code);

        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        tokenRepository.save(token);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Xac minh tai khoan - Home Stays");
        message.setText(
                "Xin chao,\n\n" +
                "Cam on ban da dang ky tai khoan Home Stays.\n\n" +
                "Ma xac minh email cua ban la: " + otp + "\n\n" +
                "Ma co hieu luc trong " + OTP_EXPIRY_MINUTES + " phut.\n\n" +
                "Tran trong,\nHome Stays"
        );
        mailSender.send(message);
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenInfo googleUser = getGoogleUser(request);

        if (!Boolean.TRUE.equals(googleUser.emailVerified())) {
            throw new IllegalArgumentException("Email Google chua duoc xac thuc");
        }

        Account account = accountRepository.findByEmail(googleUser.email())
                .orElseGet(() -> createGoogleCustomer(googleUser));

        if (!account.isActive()) {
            throw new IllegalArgumentException("Tai khoan da bi khoa");
        }

        syncGoogleProfile(account, googleUser);

        String token = jwtService.generateToken(account);
        return new AuthResponse("Bearer", token, toUserResponse(account));
    }

    private GoogleTokenInfo getGoogleUser(GoogleLoginRequest request) {
        if (request.accessToken() != null && !request.accessToken().isBlank()) {
            return verifyGoogleAccessToken(request.accessToken());
        }

        if (request.credential() != null && !request.credential().isBlank()) {
            return verifyGoogleCredential(request.credential());
        }

        throw new IllegalArgumentException("Google token khong duoc de trong");
    }

    private GoogleTokenInfo verifyGoogleCredential(String credential) {
        if (googleClientId == null || googleClientId.isBlank() || googleClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
            throw new IllegalArgumentException("Chua cau hinh Google Client ID");
        }

        try {
            String encodedCredential = URLEncoder.encode(credential, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKEN_INFO_URL + encodedCredential))
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("Dang nhap Google khong hop le");
            }

            GoogleTokenInfo tokenInfo = objectMapper.readValue(response.body(), GoogleTokenInfo.class);
            if (!googleClientId.equals(tokenInfo.aud())) {
                throw new IllegalArgumentException("Google Client ID khong khop");
            }

            return tokenInfo;
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Khong doc duoc thong tin Google tra ve");
        } catch (IOException exception) {
            throw new IllegalArgumentException("Backend khong ket noi duoc Google de xac thuc token");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Qua trinh xac thuc Google bi gian doan");
        }
    }

    private GoogleTokenInfo verifyGoogleAccessToken(String accessToken) {
        if (googleClientId == null || googleClientId.isBlank() || googleClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
            throw new IllegalArgumentException("Chua cau hinh Google Client ID");
        }

        try {
            String encodedAccessToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
            HttpRequest tokenInfoRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_ACCESS_TOKEN_INFO_URL + encodedAccessToken))
                    .GET()
                    .build();
            HttpResponse<String> tokenInfoResponse = HTTP_CLIENT.send(tokenInfoRequest, HttpResponse.BodyHandlers.ofString());

            if (tokenInfoResponse.statusCode() != 200) {
                throw new IllegalArgumentException("Dang nhap Google khong hop le");
            }

            GoogleAccessTokenInfo tokenInfo = objectMapper.readValue(tokenInfoResponse.body(), GoogleAccessTokenInfo.class);
            if (!googleClientId.equals(tokenInfo.clientId())) {
                throw new IllegalArgumentException("Google Client ID khong khop");
            }

            HttpRequest userInfoRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_USER_INFO_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();
            HttpResponse<String> userInfoResponse = HTTP_CLIENT.send(userInfoRequest, HttpResponse.BodyHandlers.ofString());

            if (userInfoResponse.statusCode() != 200) {
                throw new IllegalArgumentException("Khong the lay thong tin tai khoan Google");
            }

            return objectMapper.readValue(userInfoResponse.body(), GoogleTokenInfo.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Khong doc duoc thong tin Google tra ve");
        } catch (IOException exception) {
            throw new IllegalArgumentException("Backend khong ket noi duoc Google de xac thuc token");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Qua trinh xac thuc Google bi gian doan");
        }
    }

    private Account createGoogleCustomer(GoogleTokenInfo googleUser) {
        Role customerRole = roleRepository.findByName(GOOGLE_CUSTOMER_ROLE)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(GOOGLE_CUSTOMER_ROLE);
                    role.setDescription("Customer");
                    return roleRepository.save(role);
                });

        Account account = Account.builder()
                .email(googleUser.email())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .isActive(true)
                .role(customerRole)
                .build();

        return accountRepository.save(account);
    }

    private void syncGoogleProfile(Account account, GoogleTokenInfo googleUser) {
        Customer customer = customerRepository.findByAccountId(account.getId())
                .orElseGet(() -> Customer.builder().account(account).build());

        if (customer.getFullName() == null || customer.getFullName().isBlank()) {
            customer.setFullName(googleUser.name() != null && !googleUser.name().isBlank()
                    ? googleUser.name()
                    : googleUser.email());
        }

        if (googleUser.picture() != null && !googleUser.picture().isBlank()) {
            customer.setAvatarUrl(googleUser.picture());
        }

        customerRepository.save(customer);
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
                account.getRole().getName()
        );
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GoogleTokenInfo(
            String aud,
            String email,
            String name,
            String picture,
            String sub,
            @JsonProperty("email_verified")
            Boolean emailVerified
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GoogleAccessTokenInfo(
            String aud,
            String audience,
            @JsonProperty("issued_to")
            String issuedTo,
            String scope,
            @JsonProperty("expires_in")
            Integer expiresIn
    ) {
        private String clientId() {
            if (aud != null && !aud.isBlank()) {
                return aud;
            }

            if (audience != null && !audience.isBlank()) {
                return audience;
            }

            return issuedTo;
        }
    }
}
