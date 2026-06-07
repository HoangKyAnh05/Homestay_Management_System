package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomNumber(String roomNumber);
    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);
    List<Room> findByRoomTypeId(Long roomTypeId);
}
