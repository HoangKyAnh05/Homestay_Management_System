package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingGuestRepository extends JpaRepository<BookingGuest, Long> {
    void deleteByBookingDetailId(Long bookingDetailId);

    @Query("""
            select guest
            from BookingGuest guest
            join fetch guest.bookingDetail bd
            where bd.id in :bookingDetailIds
            order by guest.primaryGuest desc, guest.fullName asc
            """)
    List<BookingGuest> findByBookingDetailIds(@Param("bookingDetailIds") List<Long> bookingDetailIds);
}
