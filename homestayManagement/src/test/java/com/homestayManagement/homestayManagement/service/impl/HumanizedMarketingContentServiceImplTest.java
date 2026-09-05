package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.HumanizedContentGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.HumanizedContentResponse;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HumanizedMarketingContentServiceImplTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomImageRepository roomImageRepository;

    @InjectMocks
    private HumanizedMarketingContentServiceImpl service;

    private Room sampleRoom;
    private RoomType sampleRoomType;

    @BeforeEach
    void setUp() {
        sampleRoomType = RoomType.builder()
                .id(1L)
                .name("Phòng Deluxe Săn Mây")
                .maxAdults(2)
                .maxChildren(1)
                .description("Phòng view trọn thung lũng Mường Hoa.")
                .build();

        sampleRoom = Room.builder()
                .id(101L)
                .roomNumber("201")
                .roomType(sampleRoomType)
                .status("AVAILABLE")
                .build();
    }

    @Test
    @DisplayName("Should return available presets including themes, tones and platforms")
    void getPresets_success() {
        Map<String, Object> presets = service.getPresets();
        assertNotNull(presets);
        assertTrue(presets.containsKey("themes"));
        assertTrue(presets.containsKey("tones"));
        assertTrue(presets.containsKey("platforms"));
    }

    @Test
    @DisplayName("Should generate natural cloud-hunting content without spammy bot tags")
    void generateContent_sanMay_success() {
        when(roomRepository.findById(101L)).thenReturn(Optional.of(sampleRoom));
        when(roomImageRepository.findByRoomId(101L)).thenReturn(List.of(
                RoomImage.builder().id(1L).room(sampleRoom).imageUrl("/uploads/rooms/201.jpg").primary(true).build()
        ));

        HumanizedContentGenerateRequest request = new HumanizedContentGenerateRequest(
                101L,
                "SAN_MAY",
                "WARM",
                "FACEBOOK",
                "Khách đặt trước 2 ngày"
        );

        HumanizedContentResponse response = service.generateContent(request);

        assertNotNull(response);
        assertNotNull(response.getTitle());
        assertTrue(response.getTitle().contains("biển mây") || response.getTitle().contains("Lá Đỏ"));
        assertTrue(response.getCaption().contains("Lá Đỏ Homestay"));
        assertTrue(response.getCaption().contains("Khách đặt trước 2 ngày"));
        assertTrue(response.getHashtags().contains("#LaDoHomestay"));
        assertFalse(response.getHashtags().contains("#fyp"));
        assertEquals(1, response.getSuggestedImages().size());
    }

    @Test
    @DisplayName("Should generate cozy room chill content with room information")
    void generateContent_phongChill_success() {
        when(roomRepository.findById(101L)).thenReturn(Optional.of(sampleRoom));
        when(roomImageRepository.findByRoomId(101L)).thenReturn(List.of());

        HumanizedContentGenerateRequest request = new HumanizedContentGenerateRequest(
                101L,
                "PHONG_CHILL",
                "LOCAL_STORY",
                "TIKTOK",
                ""
        );

        HumanizedContentResponse response = service.generateContent(request);

        assertNotNull(response);
        assertTrue(response.getTitle().contains("201"));
        assertTrue(response.getCaption().contains("201"));
        assertTrue(response.getHashtags().contains("#LaDoHomestay"));
        assertTrue(response.getHashtags().contains("#SaPa"));
    }
}
