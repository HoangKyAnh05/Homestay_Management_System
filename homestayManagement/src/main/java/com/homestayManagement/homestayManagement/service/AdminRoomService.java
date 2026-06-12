package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.DepositPolicyRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomTypeRequest;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomResponse;
import com.homestayManagement.homestayManagement.dto.response.AdminRoomTypeResponse;
import com.homestayManagement.homestayManagement.dto.response.DepositPolicyResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AdminRoomService {
    // DepositPolicy
    List<DepositPolicyResponse> getAllDepositPolicies();
    DepositPolicyResponse createDepositPolicy(DepositPolicyRequest request);
    DepositPolicyResponse updateDepositPolicy(Long id, DepositPolicyRequest request);
    void deleteDepositPolicy(Long id);

    // RoomType
    List<AdminRoomTypeResponse> getAllRoomTypes();
    AdminRoomTypeResponse createRoomType(RoomTypeRequest request);
    AdminRoomTypeResponse updateRoomType(Long id, RoomTypeRequest request);
    void deleteRoomType(Long id);

    // Images (per physical room)
    AdminRoomResponse addImages(Long roomId, List<MultipartFile> files, Long primaryImageId);
    AdminRoomResponse deleteImage(Long roomId, Long imageId);
    AdminRoomResponse setPrimaryImage(Long roomId, Long imageId);

    // Room
    List<AdminRoomResponse> getAllRooms();
    AdminRoomResponse createRoom(RoomRequest request);
    AdminRoomResponse updateRoom(Long id, RoomRequest request);
    void deleteRoom(Long id);
}
