package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.FacilityServiceRequest;
import com.homestayManagement.homestayManagement.dto.request.InventoryServiceRequest;
import com.homestayManagement.homestayManagement.dto.response.FacilityServiceResponse;
import com.homestayManagement.homestayManagement.dto.response.InventoryServiceResponse;
import com.homestayManagement.homestayManagement.entity.FacilityService;
import com.homestayManagement.homestayManagement.entity.InventoryService;
import com.homestayManagement.homestayManagement.repository.FacilityServiceRepository;
import com.homestayManagement.homestayManagement.repository.InventoryServiceRepository;
import com.homestayManagement.homestayManagement.repository.ServiceUsageRepository;
import com.homestayManagement.homestayManagement.service.AdminServiceCatalogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminServiceCatalogServiceImpl implements AdminServiceCatalogService {

    private final FacilityServiceRepository facilityServiceRepository;
    private final InventoryServiceRepository inventoryServiceRepository;
    private final ServiceUsageRepository serviceUsageRepository;

    public AdminServiceCatalogServiceImpl(
            FacilityServiceRepository facilityServiceRepository,
            InventoryServiceRepository inventoryServiceRepository,
            ServiceUsageRepository serviceUsageRepository
    ) {
        this.facilityServiceRepository = facilityServiceRepository;
        this.inventoryServiceRepository = inventoryServiceRepository;
        this.serviceUsageRepository = serviceUsageRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacilityServiceResponse> getAllFacilityServices() {
        return facilityServiceRepository.findAll().stream()
                .map(this::toFacilityResponse)
                .toList();
    }

    @Override
    @Transactional
    public FacilityServiceResponse createFacilityService(FacilityServiceRequest request) {
        FacilityService service = FacilityService.builder()
                .name(request.name().trim())
                .price(request.price())
                .isActive(request.isActive())
                .build();
        return toFacilityResponse(facilityServiceRepository.save(service));
    }

    @Override
    @Transactional
    public FacilityServiceResponse updateFacilityService(Long id, FacilityServiceRequest request) {
        FacilityService service = getFacilityServiceById(id);
        service.setName(request.name().trim());
        service.setPrice(request.price());
        service.setActive(request.isActive());
        return toFacilityResponse(facilityServiceRepository.save(service));
    }

    @Override
    @Transactional
    public void deleteFacilityService(Long id) {
        if (!facilityServiceRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy dịch vụ tiện ích");
        }
        if (serviceUsageRepository.existsByFacilityServiceId(id)) {
            throw new IllegalArgumentException("Không thể xoá dịch vụ đã phát sinh sử dụng");
        }
        facilityServiceRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryServiceResponse> getAllInventoryServices() {
        return inventoryServiceRepository.findAll().stream()
                .map(this::toInventoryResponse)
                .toList();
    }

    @Override
    @Transactional
    public InventoryServiceResponse createInventoryService(InventoryServiceRequest request) {
        InventoryService service = InventoryService.builder()
                .name(request.name().trim())
                .price(request.price())
                .quantityInStock(request.quantityInStock())
                .build();
        return toInventoryResponse(inventoryServiceRepository.save(service));
    }

    @Override
    @Transactional
    public InventoryServiceResponse updateInventoryService(Long id, InventoryServiceRequest request) {
        InventoryService service = getInventoryServiceById(id);
        service.setName(request.name().trim());
        service.setPrice(request.price());
        service.setQuantityInStock(request.quantityInStock());
        return toInventoryResponse(inventoryServiceRepository.save(service));
    }

    @Override
    @Transactional
    public void deleteInventoryService(Long id) {
        if (!inventoryServiceRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy dịch vụ thuê đồ");
        }
        if (serviceUsageRepository.existsByInventoryServiceId(id)) {
            throw new IllegalArgumentException("Không thể xoá dịch vụ đã phát sinh sử dụng");
        }
        inventoryServiceRepository.deleteById(id);
    }

    private FacilityService getFacilityServiceById(Long id) {
        return facilityServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ tiện ích"));
    }

    private InventoryService getInventoryServiceById(Long id) {
        return inventoryServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ thuê đồ"));
    }

    private FacilityServiceResponse toFacilityResponse(FacilityService service) {
        return new FacilityServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.isActive()
        );
    }

    private InventoryServiceResponse toInventoryResponse(InventoryService service) {
        return new InventoryServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.getQuantityInStock()
        );
    }
}
