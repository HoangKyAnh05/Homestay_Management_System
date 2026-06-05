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
import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.entity.UserDetail;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.repository.UserDetailRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import com.homestayManagement.homestayManagement.repository.PasswordResetTokenRepository;
import com.homestayManagement.homestayManagement.entity.PasswordResetToken;
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
    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;
    private final String googleClientId;
    private final String mailFrom;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            RoleRepository roleRepository,
            UserRepository userRepository,
            UserDetailRepository userDetailRepository,
            PasswordResetTokenRepository tokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            JavaMailSender mailSender,
            @Value("${app.google.client-id:}") String googleClientId,
            @Value("${app.mail.from}") String mailFrom
    ) {
        this.authenticationManager = authenticationManager;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userDetailRepository = userDetailRepository;
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
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException exception) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse("Bearer", token, toUserResponse(user));
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }

        Role customerRole = roleRepository.findByName(CUSTOMER_ROLE)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy role mặc định"));

        // Tạo user với isVerified = false, chờ xác minh OTP
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .isVerified(false)
                .isActive(true)
                .role(customerRole)
                .build();
        userRepository.save(user);

        // Lưu thông tin chi tiết
        UserDetail userDetail = UserDetail.builder()
                .user(user)
                .fullName(request.fullName().trim())
                .phone(request.phone() != null && !request.phone().isBlank() ? request.phone().trim() : null)
                .build();
        userDetailRepository.save(userDetail);

        // Gửi OTP xác minh email
        sendEmailOtp(request.email());
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(VerifyOtpRequest request) {
        // Tìm token hợp lệ
        PasswordResetToken token = tokenRepository.findTopByEmailOrderByExpiresAtDesc(request.email())
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpiresAt().isAfter(java.time.LocalDateTime.now()))
                .filter(t -> t.getOtp().equals(request.otp()))
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không đúng hoặc đã hết hạn"));

        // Đánh dấu user đã xác minh
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        user.setVerified(true);
        userRepository.save(user);

        // Xóa token đã dùng
        tokenRepository.deleteAllByEmail(request.email());

        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse("Bearer", jwtToken, toUserResponse(user));
    }

    @Override
    public void resendVerifyEmail(String email) {
        // Chỉ gửi lại nếu tài khoản tồn tại và chưa xác minh
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        if (user.isVerified()) {
            throw new IllegalArgumentException("Email đã được xác minh");
        }
        sendEmailOtp(email);
    }

    private void sendEmailOtp(String email) {
        tokenRepository.deleteAllByEmail(email);

        int code = new java.security.SecureRandom().nextInt(900000) + 100000;
        String otp = String.valueOf(code);

        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .otp(otp)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        tokenRepository.save(token);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Xác minh tài khoản - Home Stays");
        message.setText(
                "Xin chào,\n\n" +
                "Cảm ơn bạn đã đăng ký tài khoản Home Stays.\n\n" +
                "Mã xác minh email của bạn là: " + otp + "\n\n" +
                "Mã có hiệu lực trong " + OTP_EXPIRY_MINUTES + " phút.\n\n" +
                "Trân trọng,\nHome Stays"
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

        User user = userRepository.findByEmail(googleUser.email())
                .orElseGet(() -> createGoogleCustomer(googleUser));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Tai khoan da bi khoa");
        }

        syncGoogleProfile(user, googleUser);

        String token = jwtService.generateToken(user);
        return new AuthResponse("Bearer", token, toUserResponse(user));
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

    private User createGoogleCustomer(GoogleTokenInfo googleUser) {
        Role customerRole = roleRepository.findByName(GOOGLE_CUSTOMER_ROLE)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(GOOGLE_CUSTOMER_ROLE);
                    role.setDescription("Customer");
                    return roleRepository.save(role);
                });

        User user = User.builder()
                .email(googleUser.email())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .isVerified(true)
                .isActive(true)
                .role(customerRole)
                .build();

        return userRepository.save(user);
    }

    private void syncGoogleProfile(User user, GoogleTokenInfo googleUser) {
        UserDetail userDetail = userDetailRepository.findById(user.getId())
                .orElseGet(() -> UserDetail.builder().user(user).build());

        if (userDetail.getFullName() == null || userDetail.getFullName().isBlank()) {
            userDetail.setFullName(googleUser.name() != null && !googleUser.name().isBlank()
                    ? googleUser.name()
                    : googleUser.email());
        }

        if (googleUser.picture() != null && !googleUser.picture().isBlank()) {
            userDetail.setAvatarUrl(googleUser.picture());
        }

        userDetailRepository.save(userDetail);
    }

    private UserResponse toUserResponse(User user) {
        UserDetail userDetail = userDetailRepository.findById(user.getId()).orElse(null);

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                userDetail != null ? userDetail.getFullName() : user.getEmail(),
                userDetail != null ? userDetail.getPhone() : null,
                userDetail != null ? userDetail.getDateOfBirth() : null,
                userDetail != null ? userDetail.getAddress() : null,
                userDetail != null ? userDetail.getAvatarUrl() : null,
                user.getRole().getName()
        );
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
