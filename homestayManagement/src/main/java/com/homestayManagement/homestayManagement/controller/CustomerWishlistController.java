package com.homestayManagement.homestayManagement.controller;

import com.homestayManagement.homestayManagement.dto.WishlistItemDto;
import com.homestayManagement.homestayManagement.dto.WishlistToggleResponseDto;
import com.homestayManagement.homestayManagement.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/wishlist")
@RequiredArgsConstructor
public class CustomerWishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/toggle/{roomTypeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WishlistToggleResponseDto> toggleWishlist(
            @PathVariable Long roomTypeId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(wishlistService.toggleWishlist(roomTypeId, email));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WishlistItemDto>> getMyWishlist(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(wishlistService.getMyWishlist(email));
    }

    @GetMapping("/check/{roomTypeId}")
    public ResponseEntity<Boolean> checkWishlisted(
            @PathVariable Long roomTypeId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(wishlistService.isWishlisted(roomTypeId, email));
    }
}
