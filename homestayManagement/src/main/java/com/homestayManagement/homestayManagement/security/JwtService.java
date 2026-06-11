package com.homestayManagement.homestayManagement.security;

import com.homestayManagement.homestayManagement.entity.Account;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Account account) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(Map.of(
                        "accountId", account.getId(),
                        "email", account.getEmail(),
                        "role", account.getRole().getName()
                ))
                .subject(account.getEmail())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    public String extractEmail(String token) {
        Claims claims = parseClaims(token);
        String subject = claims.getSubject();
        if (subject != null && !subject.isBlank()) {
            return subject;
        }
        return claims.get("email", String.class);
    }

    public boolean isTokenValid(String token, String email) {
        Claims claims = parseClaims(token);
        String tokenEmail = claims.getSubject();
        if (tokenEmail == null || tokenEmail.isBlank()) {
            tokenEmail = claims.get("email", String.class);
        }
        return tokenEmail != null && tokenEmail.equals(email) && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
