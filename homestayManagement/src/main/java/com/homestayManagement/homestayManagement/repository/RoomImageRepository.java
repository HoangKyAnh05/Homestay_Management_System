package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomImageRepository extends JpaRepository<RoomImage, Long> {
    List<RoomImage> findByRoomTypeId(Long roomTypeId);
    java.util.Optional<RoomImage> findFirstByRoomTypeIdAndPrimaryTrue(Long roomTypeId);
}
