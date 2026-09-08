package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.WishlistItemDto;
import com.homestayManagement.homestayManagement.dto.WishlistToggleResponseDto;
import com.homestayManagement.homestayManagement.entity.Account;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.entity.Wishlist;
import com.homestayManagement.homestayManagement.repository.AccountRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.repository.WishlistRepository;
import com.homestayManagement.homestayManagement.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final AccountRepository accountRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final com.homestayManagement.homestayManagement.repository.RoomRepository roomRepository;
    private final com.homestayManagement.homestayManagement.repository.RoomImageRepository roomImageRepository;

    @Override
    @Transactional
    public WishlistToggleResponseDto toggleWishlist(Long roomTypeId, String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan nguoi dung"));

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseGet(() -> roomRepository.findById(roomTypeId)
                        .map(com.homestayManagement.homestayManagement.entity.Room::getRoomType)
                        .orElseThrow(() -> new IllegalArgumentException("Khong tim thay loai phong")));

        Optional<Wishlist> existingOpt = wishlistRepository.findByAccountAndRoomType(account, roomType);

        if (existingOpt.isPresent()) {
            wishlistRepository.delete(existingOpt.get());
            return WishlistToggleResponseDto.builder()
                    .roomTypeId(roomTypeId)
                    .isWishlisted(false)
                    .message("Da xoa khoi danh sach yeu thich")
                    .build();
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .account(account)
                    .roomType(roomType)
                    .build();
            wishlistRepository.save(wishlist);
            return WishlistToggleResponseDto.builder()
                    .roomTypeId(roomTypeId)
                    .isWishlisted(true)
                    .message("Da them vao danh sach yeu thich")
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistItemDto> getMyWishlist(String userEmail) {
        Account account = accountRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan nguoi dung"));

        List<Wishlist> wishlists = wishlistRepository.findAllByAccountOrderByCreatedAtDesc(account);

        return wishlists.stream().map(w -> {
            RoomType rt = w.getRoomType();
            List<String> imageUrls = buildRoomTypeImageUrls(rt.getId());
            String primaryImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

            return WishlistItemDto.builder()
                    .wishlistId(w.getId())
                    .roomTypeId(rt.getId())
                    .roomTypeName(rt.getName())
                    .description(rt.getDescription())
                    .maxAdults(rt.getMaxAdults())
                    .maxChildren(rt.getMaxChildren())
                    .averageRating(rt.getAverageRating() != null ? rt.getAverageRating() : 5.0)
                    .totalReviews(rt.getTotalReviews() != null ? rt.getTotalReviews() : 0)
                    .primaryImageUrl(primaryImageUrl)
                    .imageUrls(imageUrls)
                    .addedAt(w.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private List<String> buildRoomTypeImageUrls(Long roomTypeId) {
        return roomRepository.findByRoomTypeId(roomTypeId).stream()
                .flatMap(room -> roomImageRepository.findByRoomId(room.getId()).stream())
                .sorted(java.util.Comparator.comparing(com.homestayManagement.homestayManagement.entity.RoomImage::isPrimary).reversed()
                        .thenComparing(com.homestayManagement.homestayManagement.entity.RoomImage::getId))
                .map(com.homestayManagement.homestayManagement.entity.RoomImage::getImageUrl)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public boolean isWishlisted(Long roomTypeId, String userEmail) {
        if (userEmail == null || userEmail.isBlank()) return false;
        Account account = accountRepository.findByEmail(userEmail).orElse(null);
        if (account == null) return false;
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseGet(() -> roomRepository.findById(roomTypeId)
                        .map(com.homestayManagement.homestayManagement.entity.Room::getRoomType)
                        .orElse(null));
        if (roomType == null) return false;

        return wishlistRepository.existsByAccountAndRoomType(account, roomType);
    }
}
