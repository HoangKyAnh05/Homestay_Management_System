package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.HousekeepingChecklistTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HousekeepingChecklistTemplateRepository extends JpaRepository<HousekeepingChecklistTemplate, Long> {

    @EntityGraph(attributePaths = {"roomType", "room", "items"})
    List<HousekeepingChecklistTemplate> findAllByOrderByRoomTypeIdAscRoomIdAsc();

    @EntityGraph(attributePaths = {"roomType", "room", "items"})
    Optional<HousekeepingChecklistTemplate> findByRoomTypeIdAndRoomIsNull(Long roomTypeId);

    @EntityGraph(attributePaths = {"roomType", "room", "items"})
    Optional<HousekeepingChecklistTemplate> findByRoomId(Long roomId);
}
