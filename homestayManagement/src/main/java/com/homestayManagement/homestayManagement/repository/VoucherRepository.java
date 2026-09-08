package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findAllByOrderByStartDateDescIdDesc();

    List<Voucher> findAllByOrderByEndDateAscIdDesc();

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<Voucher> findByCustomerIdOrderByStartDateDescIdDesc(Long customerId);
}
