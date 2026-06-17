package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomNumber(String roomNumber);
    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);
    List<Room> findByRoomTypeId(Long roomTypeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r join fetch r.roomType where r.id = :id")
    Optional<Room> findByIdForCheckIn(@Param("id") Long id);

    @Query("""
            select r from Room r
            join fetch r.roomType rt
            left join fetch rt.depositPolicy
            order by r.roomNumber asc
            """)
    List<Room> findAllWithRoomType();
}
