package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.WishlistItemDto;
import com.homestayManagement.homestayManagement.dto.WishlistToggleResponseDto;

import java.util.List;

public interface WishlistService {
    WishlistToggleResponseDto toggleWishlist(Long roomTypeId, String userEmail);
    List<WishlistItemDto> getMyWishlist(String userEmail);
    boolean isWishlisted(Long roomTypeId, String userEmail);
}
