package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByAccountId(Long accountId);

    void deleteByAccountId(Long accountId);
}
