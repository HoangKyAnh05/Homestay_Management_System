package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistItemRequest;
import com.homestayManagement.homestayManagement.dto.request.AdminHousekeepingChecklistRequest;
import com.homestayManagement.homestayManagement.entity.HousekeepingChecklistTemplate;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.HousekeepingChecklistTemplateRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.service.impl.AdminHousekeepingChecklistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminHousekeepingChecklistServiceImplTest {

    @Mock private HousekeepingChecklistTemplateRepository templateRepository;
    @Mock private RoomTypeRepository roomTypeRepository;
    @Mock private RoomRepository roomRepository;

    private AdminHousekeepingChecklistServiceImpl service;
    private RoomType deluxe;
    private Room room101;

    @BeforeEach
    void setUp() {
        service = new AdminHousekeepingChecklistServiceImpl(templateRepository, roomTypeRepository, roomRepository);
        deluxe = RoomType.builder().id(1L).name("Deluxe").build();
        room101 = Room.builder().id(10L).roomNumber("101").roomType(deluxe).status("AVAILABLE").build();
        lenient().when(templateRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saveRoomTypeChecklistCreatesOrderedDefaultTemplate() {
        when(roomTypeRepository.findById(1L)).thenReturn(Optional.of(deluxe));
        when(templateRepository.findByRoomTypeIdAndRoomIsNull(1L)).thenReturn(Optional.empty());

        var response = service.saveRoomTypeChecklist(1L, request("Checklist Deluxe"));

        assertEquals("Checklist Deluxe", response.name());
        assertNull(response.roomId());
        assertEquals(3, response.items().size());
        assertEquals(1, response.items().get(0).displayOrder());
        assertEquals(3, response.items().get(2).displayOrder());
        verify(templateRepository).save(argThat(template -> template.getRoomType().getId().equals(1L)));
    }

    @Test
    void saveRoomChecklistCreatesRoomOverride() {
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room101));
        when(templateRepository.findByRoomId(10L)).thenReturn(Optional.empty());

        var response = service.saveRoomChecklist(10L, request("Checklist riêng phòng 101"));

        assertEquals(10L, response.roomId());
        assertEquals(1L, response.roomTypeId());
        assertEquals("Checklist riêng phòng 101", response.name());
    }

    @Test
    void saveChecklistRejectsDuplicateItemTitles() {
        when(roomTypeRepository.findById(1L)).thenReturn(Optional.of(deluxe));
        when(templateRepository.findByRoomTypeIdAndRoomIsNull(1L)).thenReturn(Optional.empty());
        AdminHousekeepingChecklistRequest invalid = new AdminHousekeepingChecklistRequest(
                "Checklist Deluxe", true, null,
                List.of(
                        new AdminHousekeepingChecklistItemRequest("Lau phòng tắm", null, true, true),
                        new AdminHousekeepingChecklistItemRequest(" lau PHÒNG TẮM ", null, true, true)
                )
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.saveRoomTypeChecklist(1L, invalid)
        );

        assertTrue(exception.getMessage().contains("trùng tên"));
        verify(templateRepository, never()).save(any());
    }

    @Test
    void resetRoomChecklistDeletesOnlyOverride() {
        HousekeepingChecklistTemplate override = HousekeepingChecklistTemplate.builder()
                .id(20L).roomType(deluxe).room(room101).name("Riêng 101").items(new ArrayList<>()).build();
        when(roomRepository.existsById(10L)).thenReturn(true);
        when(templateRepository.findByRoomId(10L)).thenReturn(Optional.of(override));

        service.resetRoomChecklist(10L);

        verify(templateRepository).delete(override);
    }

    private AdminHousekeepingChecklistRequest request(String name) {
        return new AdminHousekeepingChecklistRequest(
                name, true, null,
                List.of(
                        new AdminHousekeepingChecklistItemRequest("Thay chăn ga gối", "Thay mới", true, true),
                        new AdminHousekeepingChecklistItemRequest("Lau dọn phòng tắm", null, true, true),
                        new AdminHousekeepingChecklistItemRequest("Bổ sung nước suối", null, true, true)
                )
        );
    }
}
