package com.homestayManagement.homestayManagement.config;

import com.homestayManagement.homestayManagement.entity.Role;
import com.homestayManagement.homestayManagement.entity.User;
import com.homestayManagement.homestayManagement.entity.UserDetail;
import com.homestayManagement.homestayManagement.repository.RoleRepository;
import com.homestayManagement.homestayManagement.repository.UserDetailRepository;
import com.homestayManagement.homestayManagement.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            UserDetailRepository userDetailRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userDetailRepository = userDetailRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ROLE_CUSTOMER");
                    role.setDescription("Khách hàng");
                    return roleRepository.save(role);
                });

        if (!userRepository.existsByEmail("customer@example.com")) {
            User user = User.builder()
                    .email("customer@example.com")
                    .password(passwordEncoder.encode("123456"))
                    .isVerified(true)
                    .isActive(true)
                    .role(customerRole)
                    .build();

            User savedUser = userRepository.save(user);

            UserDetail userDetail = UserDetail.builder()
                    .user(savedUser)
                    .fullName("Nguyễn Văn A")
                    .phone("0900000000")
                    .build();

            userDetailRepository.save(userDetail);
        }
    }
}
