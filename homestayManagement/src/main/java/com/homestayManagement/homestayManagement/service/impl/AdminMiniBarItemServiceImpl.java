package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RoomMiniBarItemRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.entity.RoomMiniBarItem;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.service.AdminMiniBarItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminMiniBarItemServiceImpl implements AdminMiniBarItemService {

    private final RoomMiniBarItemRepository roomMiniBarItemRepository;
    private final RoomAmenitiesUsageRepository roomAmenitiesUsageRepository;

    public AdminMiniBarItemServiceImpl(
            RoomMiniBarItemRepository roomMiniBarItemRepository,
            RoomAmenitiesUsageRepository roomAmenitiesUsageRepository
    ) {
        this.roomMiniBarItemRepository = roomMiniBarItemRepository;
        this.roomAmenitiesUsageRepository = roomAmenitiesUsageRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomMiniBarItemResponse> getAllItems() {
        return roomMiniBarItemRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomMiniBarItemResponse createItem(RoomMiniBarItemRequest request) {
        RoomMiniBarItem item = RoomMiniBarItem.builder()
                .name(request.name().trim())
                .price(request.price())
                .quantityInStock(request.quantityInStock())
                .build();
        return toResponse(roomMiniBarItemRepository.save(item));
    }

    @Override
    @Transactional
    public RoomMiniBarItemResponse updateItem(Long id, RoomMiniBarItemRequest request) {
        RoomMiniBarItem item = getItemById(id);
        item.setName(request.name().trim());
        item.setPrice(request.price());
        item.setQuantityInStock(request.quantityInStock());
        return toResponse(roomMiniBarItemRepository.save(item));
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        if (!roomMiniBarItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy mặt hàng mini-bar");
        }
        if (roomAmenitiesUsageRepository.existsByItemId(id)) {
            throw new IllegalArgumentException("Không thể xoá mặt hàng đã phát sinh sử dụng");
        }
        roomMiniBarItemRepository.deleteById(id);
    }

    private RoomMiniBarItem getItemById(Long id) {
        return roomMiniBarItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mặt hàng mini-bar"));
    }

    private RoomMiniBarItemResponse toResponse(RoomMiniBarItem item) {
        return new RoomMiniBarItemResponse(
                item.getId(),
                item.getName(),
                item.getPrice(),
                item.getQuantityInStock()
        );
    }
}
