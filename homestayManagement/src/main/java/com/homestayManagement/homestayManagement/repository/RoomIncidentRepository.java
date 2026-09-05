package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomIncidentRepository extends JpaRepository<RoomIncident, Long> {

    @Query("SELECT i FROM RoomIncident i " +
            "JOIN FETCH i.room r " +
            "JOIN FETCH i.reportedBy rb " +
            "LEFT JOIN FETCH i.handledBy hb " +
            "LEFT JOIN FETCH i.bookingDetail bd " +
            "LEFT JOIN FETCH bd.booking b " +
            "LEFT JOIN FETCH b.customer c " +
            "ORDER BY i.reportedAt DESC")
    List<RoomIncident> findAllWithDetails();

    @Query("SELECT i FROM RoomIncident i " +
            "JOIN FETCH i.room r " +
            "JOIN FETCH i.reportedBy rb " +
            "LEFT JOIN FETCH i.handledBy hb " +
            "LEFT JOIN FETCH i.bookingDetail bd " +
            "LEFT JOIN FETCH bd.booking b " +
            "LEFT JOIN FETCH b.customer c " +
            "WHERE i.room.id = :roomId " +
            "ORDER BY i.reportedAt DESC")
    List<RoomIncident> findByRoomIdWithDetails(Long roomId);

    @Query("SELECT i FROM RoomIncident i " +
            "JOIN FETCH i.room r " +
            "JOIN FETCH i.reportedBy rb " +
            "LEFT JOIN FETCH i.handledBy hb " +
            "LEFT JOIN FETCH i.bookingDetail bd " +
            "WHERE i.bookingDetail.id = :bookingDetailId " +
            "ORDER BY i.reportedAt DESC")
    List<RoomIncident> findByBookingDetailIdWithDetails(Long bookingDetailId);

    long countByStatus(String status);

    @Query("SELECT DISTINCT i.room.id FROM RoomIncident i WHERE i.status IN ('REPORTED', 'IN_PROGRESS') AND i.room.id IS NOT NULL")
    List<Long> findRoomIdsWithInProgressIncidents();
}
