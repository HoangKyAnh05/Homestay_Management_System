package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomNumber(String roomNumber);
    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);
    List<Room> findByRoomTypeId(Long roomTypeId);

    @Query("""
            select r from Room r
            join fetch r.roomType rt
            left join fetch rt.depositPolicy
            order by r.roomNumber asc
            """)
    List<Room> findAllWithRoomType();
}
