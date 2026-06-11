package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.request.FacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.InventoryServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;

import java.util.List;

public interface AdminServiceCatalogService {
    List<FacilityServiceResponse> getAllFacilityServices();
    FacilityServiceResponse createFacilityService(FacilityServiceRequest request);
    FacilityServiceResponse updateFacilityService(Long id, FacilityServiceRequest request);
    void deleteFacilityService(Long id);

    List<InventoryServiceResponse> getAllInventoryServices();
    InventoryServiceResponse createInventoryService(InventoryServiceRequest request);
    InventoryServiceResponse updateInventoryService(Long id, InventoryServiceRequest request);
    void deleteInventoryService(Long id);
}
