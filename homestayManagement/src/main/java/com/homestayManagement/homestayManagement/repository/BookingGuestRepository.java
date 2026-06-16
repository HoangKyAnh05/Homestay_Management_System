package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingGuest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingGuestRepository extends JpaRepository<BookingGuest, Long> {
}
