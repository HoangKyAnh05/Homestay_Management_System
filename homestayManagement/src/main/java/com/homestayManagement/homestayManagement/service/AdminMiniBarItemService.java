package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.RoomMiniBarItemRequest;
import com.homestayManagement.homestayManagement.dto.response.RoomMiniBarItemResponse;

import java.util.List;

public interface AdminMiniBarItemService {
    List<RoomMiniBarItemResponse> getAllItems();
    RoomMiniBarItemResponse createItem(RoomMiniBarItemRequest request);
    RoomMiniBarItemResponse updateItem(Long id, RoomMiniBarItemRequest request);
    void deleteItem(Long id);
}
