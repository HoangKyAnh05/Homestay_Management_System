package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomImageRepository extends JpaRepository<RoomImage, Long> {
    List<RoomImage> findByRoomId(Long roomId);
    Optional<RoomImage> findFirstByRoomIdAndPrimaryTrue(Long roomId);
    void deleteByRoomId(Long roomId);
}
