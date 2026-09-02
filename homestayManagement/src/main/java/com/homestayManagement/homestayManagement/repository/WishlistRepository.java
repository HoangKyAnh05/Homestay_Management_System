package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Optional<Wishlist> findByAccountAndRoomType(Account account, RoomType roomType);
    boolean existsByAccountAndRoomType(Account account, RoomType roomType);
    List<Wishlist> findAllByAccountOrderByCreatedAtDesc(Account account);
    void deleteByAccountAndRoomType(Account account, RoomType roomType);
}
