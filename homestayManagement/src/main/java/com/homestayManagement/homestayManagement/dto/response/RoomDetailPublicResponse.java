package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record RoomDetailPublicResponse(
        Long roomId,
        String roomNumber,
        Long roomTypeId,
        String roomTypeName,
        Integer maxAdults,
        Integer maxChildren,
        String description,
        String primaryImageUrl,
        List<String> imageUrls,
        List<RoomPublicPriceResponse> prices,
        List<RoomBusySlotResponse> busySlots
) {
}
