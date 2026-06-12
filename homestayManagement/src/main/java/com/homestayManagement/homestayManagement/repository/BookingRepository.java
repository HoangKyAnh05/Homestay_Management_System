package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}
