package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByAccountId(Long accountId);
    Optional<Employee> findByAccountEmail(String email);

    void deleteByAccountId(Long accountId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e JOIN e.account a JOIN a.role r " +
            "WHERE (UPPER(r.name) = UPPER(:roleName) OR UPPER(r.name) = UPPER(CONCAT('ROLE_', :roleName)) OR UPPER(CONCAT('ROLE_', r.name)) = UPPER(:roleName)) " +
            "AND (e.status IS NULL OR UPPER(e.status) = 'WORKING')")
    java.util.List<Employee> findActiveEmployeesByRole(@org.springframework.data.repository.query.Param("roleName") String roleName);
}
