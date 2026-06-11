package com.homestayManagement.homestayManagement.security;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final AccountRepository accountRepository;

    public CustomUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay tai khoan"));

        return new org.springframework.security.core.userdetails.User(
                account.getEmail(),
                account.getPassword(),
                account.isActive(),
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority(account.getRole().getName()))
        );
    }
}
