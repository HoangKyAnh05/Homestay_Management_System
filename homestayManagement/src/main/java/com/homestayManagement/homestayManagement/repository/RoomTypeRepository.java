package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rt from RoomType rt where rt.id in :ids order by rt.id")
    List<RoomType> findAllByIdForInventoryUpdate(@Param("ids") Collection<Long> ids);
}
