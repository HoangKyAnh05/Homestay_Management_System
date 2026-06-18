package com.homestayManagement.homestayManagement.config;

import com.homestayManagement.homestayManagement.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/sepay/webhook").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/rooms/**").permitAll()

                        // Lễ tân/admin tạo và theo dõi; housekeeping/admin thực hiện công việc.
                        .requestMatchers(HttpMethod.GET, "/api/housekeeping/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_RECEPTIONIST", "ROLE_HOUSEKEEPING")
                        .requestMatchers(HttpMethod.POST, "/api/housekeeping/booking-details/*/request")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_RECEPTIONIST")
                        .requestMatchers("/api/housekeeping/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_HOUSEKEEPING")

                        // ── Admin + Lễ tân ────────────────────────────────────────────
                        .requestMatchers("/api/admin/bookings/**", "/api/admin/invoices/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_RECEPTIONIST")
                        // Lễ tân cần đọc gói giá khi tạo/chỉnh sửa booking.
                        .requestMatchers(HttpMethod.GET, "/api/admin/price-config/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_RECEPTIONIST")
                        .requestMatchers(HttpMethod.GET,
                                "/api/admin/services/facility/**",
                                "/api/admin/services/inventory/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_RECEPTIONIST")

                        // ── Chỉ ROLE_ADMIN ──────────────────────────────────────────────
                        // Quản lý người dùng
                        .requestMatchers("/api/admin/users/**").hasAuthority("ROLE_ADMIN")
                        // Quản lý phòng & loại phòng
                        .requestMatchers("/api/admin/rooms/**").hasAuthority("ROLE_ADMIN")
                        // Cấu hình giá
                        .requestMatchers("/api/admin/price-config/**").hasAuthority("ROLE_ADMIN")
                        // Danh mục dịch vụ & mini-bar (chỉ CRUD cấu hình, không phải gọi dịch vụ)
                        .requestMatchers("/api/admin/services/facility/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin/services/inventory/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin/services/mini-bar-items/**").hasAuthority("ROLE_ADMIN")
                        // Nội quy & phạt
                        .requestMatchers("/api/admin/rules-penalties/**").hasAuthority("ROLE_ADMIN")
                        // Dashboard tổng quan
                        .requestMatchers("/api/admin/dashboard/**").hasAuthority("ROLE_ADMIN")

                        // Các API admin còn lại không tự động mở cho role chuyên biệt.
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
