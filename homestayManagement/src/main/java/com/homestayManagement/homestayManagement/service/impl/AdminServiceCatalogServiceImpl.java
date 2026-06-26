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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminServiceCatalogServiceImpl implements AdminServiceCatalogService {

    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

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

    @Override
    @Transactional
    public FacilityServiceResponse uploadFacilityImage(Long id, MultipartFile file) throws IOException {
        FacilityService service = getFacilityServiceById(id);
        service.setImageUrl(saveImage(file, "facility"));
        return toFacilityResponse(facilityServiceRepository.save(service));
    }

    @Override
    @Transactional
    public InventoryServiceResponse uploadInventoryImage(Long id, MultipartFile file) throws IOException {
        InventoryService service = getInventoryServiceById(id);
        service.setImageUrl(saveImage(file, "inventory"));
        return toInventoryResponse(inventoryServiceRepository.save(service));
    }

    private String saveImage(MultipartFile file, String prefix) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File ảnh không hợp lệ");
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) throw new IllegalArgumentException("Chỉ chấp nhận ảnh JPG, PNG, WEBP");
        Files.createDirectories(UPLOAD_DIR);
        String ext = getExtension(file.getOriginalFilename());
        String filename = prefix + "-" + UUID.randomUUID() + ext;
        Path target = UPLOAD_DIR.resolve(filename).normalize();
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }

    private FacilityServiceResponse toFacilityResponse(FacilityService service) {
        return new FacilityServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.isActive(),
                service.getImageUrl()
        );
    }

    private InventoryServiceResponse toInventoryResponse(InventoryService service) {
        return new InventoryServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.getQuantityInStock(),
                service.getImageUrl()
        );
    }
}
