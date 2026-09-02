package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.Review;
import com.homestayManagement.homestayManagement.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBooking(Booking booking);
    boolean existsByBooking(Booking booking);
    List<Review> findAllByRoomTypeOrderByCreatedAtDesc(RoomType roomType);

    @Query("SELECT r FROM Review r WHERE r.roomType = :roomType AND (r.status IS NULL OR UPPER(r.status) != 'HIDDEN') ORDER BY r.createdAt DESC")
    List<Review> findApprovedByRoomTypeOrderByCreatedAtDesc(@Param("roomType") RoomType roomType);

    @Query("SELECT AVG(r.ratingStars) FROM Review r WHERE r.roomType = :roomType AND (r.status IS NULL OR UPPER(r.status) != 'HIDDEN')")
    Double findAverageRatingByRoomType(@Param("roomType") RoomType roomType);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.roomType = :roomType AND (r.status IS NULL OR UPPER(r.status) != 'HIDDEN')")
    Integer countByRoomType(@Param("roomType") RoomType roomType);
}
