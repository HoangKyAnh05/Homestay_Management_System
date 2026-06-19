package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.HousekeepingTaskChecklistItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HousekeepingTaskChecklistItemRepository extends JpaRepository<HousekeepingTaskChecklistItem, Long> {

    @EntityGraph(attributePaths = {"completedBy"})
    List<HousekeepingTaskChecklistItem> findByHousekeepingTaskIdOrderByDisplayOrderAsc(Long taskId);

    boolean existsByHousekeepingTaskId(Long taskId);
}
