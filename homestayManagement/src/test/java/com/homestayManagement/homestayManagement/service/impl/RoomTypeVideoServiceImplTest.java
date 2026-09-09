package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.RoomTypeRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomTypeResponse;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomTypeVideoServiceImplTest {

    @Mock
    private DepositPolicyRepository depositPolicyRepository;
    @Mock
    private RoomTypeRepository roomTypeRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private RoomImageRepository roomImageRepository;
    @Mock
    private HousekeepingChecklistTemplateRepository housekeepingChecklistTemplateRepository;
    @Mock
    private RoomPriceConfigRepository roomPriceConfigRepository;
    @Mock
    private RoomScheduleRepository roomScheduleRepository;
    @Mock
    private HousekeepingTaskRepository housekeepingTaskRepository;
    @Mock
    private BookingDetailRepository bookingDetailRepository;

    private AdminRoomServiceImpl adminRoomService;

    @BeforeEach
    void setUp() {
        adminRoomService = new AdminRoomServiceImpl(
                depositPolicyRepository,
                roomTypeRepository,
                roomRepository,
                roomImageRepository,
                housekeepingChecklistTemplateRepository,
                roomPriceConfigRepository,
                roomScheduleRepository,
                housekeepingTaskRepository,
                bookingDetailRepository
        );
    }

    @Test
    void createRoomTypeWithVideoUrlSavesCorrectly() {
        RoomTypeRequest request = new RoomTypeRequest(
                "Deluxe Mountain View",
                2,
                1,
                null,
                "Beautiful room with balcony",
                "/uploads/preview-room-1.mp4"
        );

        RoomType savedType = RoomType.builder()
                .id(101L)
                .name("Deluxe Mountain View")
                .maxAdults(2)
                .maxChildren(1)
                .description("Beautiful room with balcony")
                .videoUrl("/uploads/preview-room-1.mp4")
                .build();

        when(roomTypeRepository.save(any(RoomType.class))).thenReturn(savedType);
        when(roomRepository.findByRoomTypeId(101L)).thenReturn(List.of());

        AdminRoomTypeResponse response = adminRoomService.createRoomType(request);

        assertNotNull(response);
        assertEquals("/uploads/preview-room-1.mp4", response.videoUrl());
        assertEquals("Deluxe Mountain View", response.name());
        verify(roomTypeRepository).save(any(RoomType.class));
    }

    @Test
    void uploadRoomTypeVideoRejectsInvalidFormats() {
        RoomType roomType = RoomType.builder()
                .id(102L)
                .name("Standard Room")
                .build();

        when(roomTypeRepository.findById(102L)).thenReturn(Optional.of(roomType));

        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "fake content".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminRoomService.uploadRoomTypeVideo(102L, textFile)
        );

        assertTrue(ex.getMessage().contains("MP4, WebM, MOV"));
    }

    @Test
    void deleteRoomTypeVideoClearsVideoUrl() {
        RoomType roomType = RoomType.builder()
                .id(103L)
                .name("Executive Suite")
                .videoUrl("/uploads/old-video.mp4")
                .build();

        when(roomTypeRepository.findById(103L)).thenReturn(Optional.of(roomType));
        when(roomTypeRepository.save(any(RoomType.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomRepository.findByRoomTypeId(103L)).thenReturn(List.of());

        AdminRoomTypeResponse response = adminRoomService.deleteRoomTypeVideo(103L);

        assertNotNull(response);
        assertNull(response.videoUrl());
        assertNull(roomType.getVideoUrl());
        verify(roomTypeRepository).save(roomType);
    }
}
