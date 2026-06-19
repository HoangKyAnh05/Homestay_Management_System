package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.DepositPolicyRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomTypeRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomTypeResponse;
import com.homestayManagement.homestayManagement.dto.response.DepositPolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomImageResponse;
import com.homestayManagement.homestayManagement.entity.DepositPolicy;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.DepositPolicyRepository;
import com.homestayManagement.homestayManagement.repository.HousekeepingChecklistTemplateRepository;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.service.AdminRoomService;
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
public class AdminRoomServiceImpl implements AdminRoomService {

    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_STATUSES = Set.of("AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE");
    private static final Set<String> ALLOWED_DEPOSIT_TYPES = Set.of("PERCENTAGE", "FIXED_AMOUNT");

    private final DepositPolicyRepository depositPolicyRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;
    private final HousekeepingChecklistTemplateRepository housekeepingChecklistTemplateRepository;

    public AdminRoomServiceImpl(
            DepositPolicyRepository depositPolicyRepository,
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository,
            HousekeepingChecklistTemplateRepository housekeepingChecklistTemplateRepository
    ) {
        this.depositPolicyRepository = depositPolicyRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
        this.housekeepingChecklistTemplateRepository = housekeepingChecklistTemplateRepository;
    }

    // ── DepositPolicy ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<DepositPolicyResponse> getAllDepositPolicies() {
        return depositPolicyRepository.findAll().stream().map(this::toDepositPolicyResponse).toList();
    }

    @Override
    @Transactional
    public DepositPolicyResponse createDepositPolicy(DepositPolicyRequest request) {
        validateDepositType(request.calculationType());
        DepositPolicy policy = DepositPolicy.builder()
                .policyName(request.policyName())
                .calculationType(request.calculationType())
                .policyValue(request.policyValue())
                .description(request.description())
                .build();
        return toDepositPolicyResponse(depositPolicyRepository.save(policy));
    }

    @Override
    @Transactional
    public DepositPolicyResponse updateDepositPolicy(Long id, DepositPolicyRequest request) {
        validateDepositType(request.calculationType());
        DepositPolicy policy = getDepositPolicyById(id);
        policy.setPolicyName(request.policyName());
        policy.setCalculationType(request.calculationType());
        policy.setPolicyValue(request.policyValue());
        policy.setDescription(request.description());
        return toDepositPolicyResponse(depositPolicyRepository.save(policy));
    }

    @Override
    @Transactional
    public void deleteDepositPolicy(Long id) {
        boolean inUse = roomTypeRepository.findAll().stream()
                .anyMatch(roomType -> roomType.getDepositPolicy() != null && roomType.getDepositPolicy().getId().equals(id));
        if (inUse) {
            throw new IllegalArgumentException("Không thể xoá chính sách đang được loại phòng sử dụng");
        }
        depositPolicyRepository.deleteById(id);
    }

    // ── RoomType ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<AdminRoomTypeResponse> getAllRoomTypes() {
        return roomTypeRepository.findAll().stream().map(this::toRoomTypeResponse).toList();
    }

    @Override
    @Transactional
    public AdminRoomTypeResponse createRoomType(RoomTypeRequest request) {
        RoomType roomType = RoomType.builder()
                .name(request.name())
                .maxAdults(request.maxAdults())
                .maxChildren(request.maxChildren())
                .depositPolicy(getOptionalDepositPolicy(request.depositPolicyId()))
                .description(request.description())
                .build();
        return toRoomTypeResponse(roomTypeRepository.save(roomType));
    }

    @Override
    @Transactional
    public AdminRoomTypeResponse updateRoomType(Long id, RoomTypeRequest request) {
        RoomType roomType = getRoomTypeById(id);
        roomType.setName(request.name());
        roomType.setMaxAdults(request.maxAdults());
        roomType.setMaxChildren(request.maxChildren());
        roomType.setDepositPolicy(getOptionalDepositPolicy(request.depositPolicyId()));
        roomType.setDescription(request.description());
        return toRoomTypeResponse(roomTypeRepository.save(roomType));
    }

    @Override
    @Transactional
    public void deleteRoomType(Long id) {
        if (!roomRepository.findByRoomTypeId(id).isEmpty()) {
            throw new IllegalArgumentException("Không thể xoá loại phòng đang có phòng sử dụng");
        }
        housekeepingChecklistTemplateRepository.findByRoomTypeIdAndRoomIsNull(id)
                .ifPresent(housekeepingChecklistTemplateRepository::delete);
        roomTypeRepository.deleteById(id);
    }

    // ── Images ────────────────────────────────────────────

    @Override
    @Transactional
    public AdminRoomResponse addImages(Long roomId, List<MultipartFile> files, Long primaryImageId) {
        Room room = getRoomById(roomId);
        List<RoomImage> existing = roomImageRepository.findByRoomId(roomId);
        boolean hasExistingPrimary = existing.stream().anyMatch(RoomImage::isPrimary);

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (!ALLOWED_TYPES.contains(file.getContentType())) {
                throw new IllegalArgumentException("Chỉ hỗ trợ JPG, PNG, WEBP");
            }
            String url = saveFile(file);
            boolean isPrimary = !hasExistingPrimary && i == 0;
            roomImageRepository.save(RoomImage.builder()
                    .room(room)
                    .imageUrl(url)
                    .primary(isPrimary)
                    .build());
            if (isPrimary) hasExistingPrimary = true;
        }
        return toRoomResponse(room);
    }

    @Override
    @Transactional
    public AdminRoomResponse deleteImage(Long roomId, Long imageId) {
        Room room = getRoomById(roomId);
        RoomImage image = roomImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ảnh"));
        if (!image.getRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("Ảnh không thuộc phòng này");
        }

        boolean wasPrimary = image.isPrimary();
        deleteFile(image.getImageUrl());
        roomImageRepository.delete(image);

        if (wasPrimary) {
            List<RoomImage> remaining = roomImageRepository.findByRoomId(roomId);
            if (!remaining.isEmpty()) {
                remaining.get(0).setPrimary(true);
                roomImageRepository.save(remaining.get(0));
            }
        }
        return toRoomResponse(room);
    }

    @Override
    @Transactional
    public AdminRoomResponse setPrimaryImage(Long roomId, Long imageId) {
        Room room = getRoomById(roomId);
        List<RoomImage> images = roomImageRepository.findByRoomId(roomId);
        boolean found = images.stream().anyMatch(img -> img.getId().equals(imageId));
        if (!found) {
            throw new IllegalArgumentException("Ảnh không thuộc phòng này");
        }
        images.forEach(img -> {
            img.setPrimary(img.getId().equals(imageId));
            roomImageRepository.save(img);
        });
        return toRoomResponse(room);
    }

    // ── Room ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<AdminRoomResponse> getAllRooms() {
        return roomRepository.findAll().stream().map(this::toRoomResponse).toList();
    }

    @Override
    @Transactional
    public AdminRoomResponse createRoom(RoomRequest request) {
        validateStatus(request.status());
        if (roomRepository.existsByRoomNumber(request.roomNumber())) {
            throw new IllegalArgumentException("Số phòng đã tồn tại");
        }
        RoomType roomType = getRoomTypeById(request.roomTypeId());
        Room room = Room.builder()
                .roomNumber(request.roomNumber())
                .roomType(roomType)
                .status(request.status())
                .build();
        return toRoomResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public AdminRoomResponse updateRoom(Long id, RoomRequest request) {
        validateStatus(request.status());
        Room room = getRoomById(id);
        if (roomRepository.existsByRoomNumberAndIdNot(request.roomNumber(), id)) {
            throw new IllegalArgumentException("Số phòng đã tồn tại");
        }
        RoomType nextRoomType = getRoomTypeById(request.roomTypeId());
        if (!room.getRoomType().getId().equals(nextRoomType.getId())) {
            housekeepingChecklistTemplateRepository.findByRoomId(id)
                    .ifPresent(housekeepingChecklistTemplateRepository::delete);
        }
        room.setRoomNumber(request.roomNumber());
        room.setRoomType(nextRoomType);
        room.setStatus(request.status());
        return toRoomResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        housekeepingChecklistTemplateRepository.findByRoomId(id)
                .ifPresent(housekeepingChecklistTemplateRepository::delete);
        roomImageRepository.findByRoomId(id).forEach(img -> deleteFile(img.getImageUrl()));
        roomImageRepository.deleteByRoomId(id);
        roomRepository.delete(room);
    }

    // ── Helpers ───────────────────────────────────────────

    private RoomType getRoomTypeById(Long id) {
        return roomTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng"));
    }

    private DepositPolicy getDepositPolicyById(Long id) {
        return depositPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách đặt cọc"));
    }

    private DepositPolicy getOptionalDepositPolicy(Long id) {
        return id == null ? null : getDepositPolicyById(id);
    }

    private Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
    }

    private void validateStatus(String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Trạng thái phòng không hợp lệ");
        }
    }

    private void validateDepositType(String calculationType) {
        if (!ALLOWED_DEPOSIT_TYPES.contains(calculationType)) {
            throw new IllegalArgumentException("Cách tính tiền cọc không hợp lệ");
        }
    }

    private AdminRoomTypeResponse toRoomTypeResponse(RoomType rt) {
        int roomCount = roomRepository.findByRoomTypeId(rt.getId()).size();
        DepositPolicy policy = rt.getDepositPolicy();
        return new AdminRoomTypeResponse(rt.getId(), rt.getName(),
                rt.getMaxAdults(), rt.getMaxChildren(),
                policy != null ? policy.getId() : null,
                policy != null ? policy.getPolicyName() : null,
                rt.getDescription(), roomCount);
    }

    private DepositPolicyResponse toDepositPolicyResponse(DepositPolicy policy) {
        return new DepositPolicyResponse(
                policy.getId(),
                policy.getPolicyName(),
                policy.getCalculationType(),
                policy.getPolicyValue(),
                policy.getDescription()
        );
    }

    private AdminRoomResponse toRoomResponse(Room room) {
        List<RoomImageResponse> images = roomImageRepository.findByRoomId(room.getId()).stream()
                .map(img -> new RoomImageResponse(img.getId(), img.getImageUrl(), img.isPrimary()))
                .toList();
        return new AdminRoomResponse(room.getId(), room.getRoomNumber(),
                room.getStatus(), room.getRoomType().getId(), room.getRoomType().getName(), images);
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(UPLOAD_DIR);
            String ext = getExtension(file.getOriginalFilename());
            String filename = "room-" + UUID.randomUUID() + ext;
            Path target = UPLOAD_DIR.resolve(filename).normalize();
            file.transferTo(target);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể lưu ảnh");
        }
    }

    private void deleteFile(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        try {
            Files.deleteIfExists(Paths.get(url.substring(1)));
        } catch (IOException ignored) {}
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
