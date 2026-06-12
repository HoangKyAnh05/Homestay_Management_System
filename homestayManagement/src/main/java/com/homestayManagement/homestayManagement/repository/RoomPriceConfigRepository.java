package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomPriceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomPriceConfigRepository extends JpaRepository<RoomPriceConfig, Long> {

    List<RoomPriceConfig> findByRoomTypeId(Long roomTypeId);

    List<RoomPriceConfig> findByPricePolicyId(Long pricePolicyId);

    Optional<RoomPriceConfig> findByRoomTypeIdAndPricePolicyIdAndDayType(
            Long roomTypeId, Long pricePolicyId, String dayType);

    boolean existsByRoomTypeIdAndPricePolicyIdAndDayType(
            Long roomTypeId, Long pricePolicyId, String dayType);

    boolean existsByRoomTypeIdAndPricePolicyIdAndDayTypeAndIdNot(
            Long roomTypeId, Long pricePolicyId, String dayType, Long id);

    /**
     * Lấy toàn bộ config kèm theo join fetch để tránh N+1.
     */
    @Query("SELECT c FROM RoomPriceConfig c JOIN FETCH c.roomType JOIN FETCH c.pricePolicy")
    List<RoomPriceConfig> findAllWithDetails();

    /**
     * Lấy config cho 1 loại phòng cụ thể, có join fetch.
     */
    @Query("SELECT c FROM RoomPriceConfig c JOIN FETCH c.pricePolicy WHERE c.roomType.id = :roomTypeId")
    List<RoomPriceConfig> findByRoomTypeIdWithPolicy(@Param("roomTypeId") Long roomTypeId);
}
