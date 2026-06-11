package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByAccountId(Long accountId);

    void deleteByAccountId(Long accountId);
}
