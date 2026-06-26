package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RoomMiniBarItemRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;
import com.homestayManagement.homestayManagement.entity.RoomMiniBarItem;
import com.homestayManagement.homestayManagement.repository.RoomAmenitiesUsageRepository;
import com.homestayManagement.homestayManagement.repository.RoomMiniBarItemRepository;
import com.homestayManagement.homestayManagement.service.AdminMiniBarItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminMiniBarItemServiceImpl implements AdminMiniBarItemService {

    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

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

    @Override
    @Transactional
    public RoomMiniBarItemResponse uploadImage(Long id, MultipartFile file) throws IOException {
        RoomMiniBarItem item = getItemById(id);
        item.setImageUrl(saveImage(file));
        return toResponse(roomMiniBarItemRepository.save(item));
    }

    private String saveImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File ảnh không hợp lệ");
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) throw new IllegalArgumentException("Chỉ chấp nhận ảnh JPG, PNG, WEBP");
        Files.createDirectories(UPLOAD_DIR);
        String ext = getExtension(file.getOriginalFilename());
        String filename = "minibar-" + UUID.randomUUID() + ext;
        Path target = UPLOAD_DIR.resolve(filename).normalize();
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }

    private RoomMiniBarItemResponse toResponse(RoomMiniBarItem item) {
        return new RoomMiniBarItemResponse(
                item.getId(),
                item.getName(),
                item.getPrice(),
                item.getQuantityInStock(),
                item.getImageUrl()
        );
    }
}
