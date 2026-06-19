package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistItemRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistRequest;
import com.homestayManagement.homestayManagement.dto.response.*;
import com.homestayManagement.homestayManagement.entity.HousekeepingChecklistItem;
import com.homestayManagement.homestayManagement.entity.HousekeepingChecklistTemplate;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.HousekeepingChecklistTemplateRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.service.AdminHousekeepingChecklistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminHousekeepingChecklistServiceImpl implements AdminHousekeepingChecklistService {

    private final HousekeepingChecklistTemplateRepository templateRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;

    public AdminHousekeepingChecklistServiceImpl(
            HousekeepingChecklistTemplateRepository templateRepository,
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository
    ) {
        this.templateRepository = templateRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminHousekeepingRoomTypeChecklistResponse> getOverview() {
        List<HousekeepingChecklistTemplate> templates = templateRepository.findAllByOrderByRoomTypeIdAscRoomIdAsc();
        Map<Long, HousekeepingChecklistTemplate> defaults = templates.stream()
                .filter(template -> template.getRoom() == null)
                .collect(Collectors.toMap(template -> template.getRoomType().getId(), Function.identity(), (first, ignored) -> first));
        Map<Long, HousekeepingChecklistTemplate> overrides = templates.stream()
                .filter(template -> template.getRoom() != null)
                .collect(Collectors.toMap(template -> template.getRoom().getId(), Function.identity()));
        Map<Long, List<Room>> roomsByType = roomRepository.findAll().stream()
                .sorted(Comparator.comparing(Room::getRoomNumber, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.groupingBy(room -> room.getRoomType().getId()));

        return roomTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(RoomType::getName, String.CASE_INSENSITIVE_ORDER))
                .map(roomType -> new AdminHousekeepingRoomTypeChecklistResponse(
                        roomType.getId(),
                        roomType.getName(),
                        toResponse(defaults.get(roomType.getId())),
                        roomsByType.getOrDefault(roomType.getId(), List.of()).stream()
                                .map(room -> {
                                    HousekeepingChecklistTemplate override = overrides.get(room.getId());
                                    return new AdminHousekeepingRoomChecklistResponse(
                                            room.getId(), room.getRoomNumber(), override != null, toResponse(override)
                                    );
                                })
                                .toList()
                ))
                .toList();
    }

    @Override
    @Transactional
    public AdminHousekeepingChecklistTemplateResponse saveRoomTypeChecklist(
            Long roomTypeId,
            AdminHousekeepingChecklistRequest request
    ) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng"));
        HousekeepingChecklistTemplate template = templateRepository.findByRoomTypeIdAndRoomIsNull(roomTypeId)
                .orElseGet(() -> HousekeepingChecklistTemplate.builder().roomType(roomType).build());
        applyRequest(template, request);
        return toResponse(templateRepository.save(template));
    }

    @Override
    @Transactional
    public AdminHousekeepingChecklistTemplateResponse saveRoomChecklist(
            Long roomId,
            AdminHousekeepingChecklistRequest request
    ) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));
        HousekeepingChecklistTemplate template = templateRepository.findByRoomId(roomId)
                .orElseGet(() -> HousekeepingChecklistTemplate.builder()
                        .roomType(room.getRoomType())
                        .room(room)
                        .build());
        if (!template.getRoomType().getId().equals(room.getRoomType().getId())) {
            throw new IllegalArgumentException("Checklist tùy chỉnh không khớp loại phòng hiện tại");
        }
        applyRequest(template, request);
        return toResponse(templateRepository.save(template));
    }

    @Override
    @Transactional
    public void resetRoomChecklist(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("Không tìm thấy phòng");
        }
        templateRepository.findByRoomId(roomId).ifPresent(templateRepository::delete);
    }

    private void applyRequest(HousekeepingChecklistTemplate template, AdminHousekeepingChecklistRequest request) {
        assertCurrentVersion(template, request.version());
        validateItems(request.items());
        template.setName(request.name().trim());
        template.setActive(request.active());
        List<HousekeepingChecklistItem> items = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            AdminHousekeepingChecklistItemRequest item = request.items().get(index);
            items.add(HousekeepingChecklistItem.builder()
                    .title(item.title().trim())
                    .description(blankToNull(item.description()))
                    .required(item.required())
                    .active(item.active())
                    .displayOrder(index + 1)
                    .build());
        }
        template.replaceItems(items);
    }

    private void validateItems(List<AdminHousekeepingChecklistItemRequest> items) {
        Set<String> titles = new HashSet<>();
        boolean hasActiveItem = false;
        for (AdminHousekeepingChecklistItemRequest item : items) {
            String normalized = item.title().trim().toLowerCase(Locale.ROOT);
            if (!titles.add(normalized)) {
                throw new IllegalArgumentException("Checklist không được có hạng mục trùng tên");
            }
            hasActiveItem = hasActiveItem || item.active();
        }
        if (!hasActiveItem) {
            throw new IllegalArgumentException("Checklist phải có ít nhất một hạng mục đang áp dụng");
        }
    }

    private void assertCurrentVersion(HousekeepingChecklistTemplate template, Long requestedVersion) {
        if (template.getId() != null && requestedVersion != null && !Objects.equals(template.getVersion(), requestedVersion)) {
            throw new IllegalArgumentException("Checklist đã được người khác cập nhật, vui lòng tải lại trang");
        }
    }

    private AdminHousekeepingChecklistTemplateResponse toResponse(HousekeepingChecklistTemplate template) {
        if (template == null) return null;
        return new AdminHousekeepingChecklistTemplateResponse(
                template.getId(),
                template.getName(),
                template.isActive(),
                template.getVersion(),
                template.getRoomType().getId(),
                template.getRoom() == null ? null : template.getRoom().getId(),
                template.getItems().stream()
                        .map(item -> new AdminHousekeepingChecklistItemResponse(
                                item.getId(), item.getTitle(), item.getDescription(), item.isRequired(),
                                item.isActive(), item.getDisplayOrder()
                        ))
                        .toList()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
