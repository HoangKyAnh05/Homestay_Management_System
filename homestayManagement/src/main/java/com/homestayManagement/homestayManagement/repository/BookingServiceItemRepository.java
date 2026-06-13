package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingServiceItemRepository extends JpaRepository<BookingServiceItem, Long> {
    @Query("""
            select item
            from BookingServiceItem item
            join fetch item.bookingDetail bd
            left join fetch item.facilityService
            left join fetch item.inventoryService
            where bd.id in :bookingDetailIds
            order by item.id asc
            """)
    List<BookingServiceItem> findByBookingDetailIds(@Param("bookingDetailIds") List<Long> bookingDetailIds);
}
