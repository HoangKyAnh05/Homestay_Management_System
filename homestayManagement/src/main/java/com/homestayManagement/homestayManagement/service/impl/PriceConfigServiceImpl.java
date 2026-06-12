package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.PricePolicyRequest;
import com.homestayManagement.homestayManagement.dto.request.RoomPriceConfigRequest;
import com.homestayManagement.homestayManagement.dto.response.PricePolicyResponse;
import com.homestayManagement.homestayManagement.dto.response.RoomPriceConfigResponse;
import com.homestayManagement.homestayManagement.entity.PricePolicy;
import com.homestayManagement.homestayManagement.entity.RoomPriceConfig;
import com.homestayManagement.homestayManagement.entity.RoomType;
import com.homestayManagement.homestayManagement.repository.PricePolicyRepository;
import com.homestayManagement.homestayManagement.repository.RoomPriceConfigRepository;
import com.homestayManagement.homestayManagement.repository.RoomTypeRepository;
import com.homestayManagement.homestayManagement.service.PriceConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class PriceConfigServiceImpl implements PriceConfigService {

    private static final Set<String> VALID_RENT_TYPES = Set.of("OVERNIGHT", "HOURLY", "COMBO", "DAILY");
    private static final Set<String> VALID_DAY_TYPES  = Set.of("WEEKDAY", "WEEKEND");

    private final PricePolicyRepository policyRepository;
    private final RoomPriceConfigRepository configRepository;
    private final RoomTypeRepository roomTypeRepository;

    public PriceConfigServiceImpl(
            PricePolicyRepository policyRepository,
            RoomPriceConfigRepository configRepository,
            RoomTypeRepository roomTypeRepository
    ) {
        this.policyRepository = policyRepository;
        this.configRepository = configRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    // ── PricePolicy ──────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<PricePolicyResponse> getAllPolicies() {
        return policyRepository.findAll().stream().map(this::toPolicyResponse).toList();
    }

    @Override
    @Transactional
    public PricePolicyResponse createPolicy(PricePolicyRequest request) {
        validateRentType(request.rentType());
        validateComboHours(request.rentType(), request.limitHours());
        PricePolicy policy = PricePolicy.builder()
                .policyName(request.policyName())
                .rentType(request.rentType())
                .standardCheckIn(request.standardCheckIn())
                .standardCheckOut(request.standardCheckOut())
                .limitHours(request.limitHours())
                .build();
        return toPolicyResponse(policyRepository.save(policy));
    }

    @Override
    @Transactional
    public PricePolicyResponse updatePolicy(Long id, PricePolicyRequest request) {
        validateRentType(request.rentType());
        validateComboHours(request.rentType(), request.limitHours());
        PricePolicy policy = getPolicyById(id);
        policy.setPolicyName(request.policyName());
        policy.setRentType(request.rentType());
        policy.setStandardCheckIn(request.standardCheckIn());
        policy.setStandardCheckOut(request.standardCheckOut());
        policy.setLimitHours(request.limitHours());
        return toPolicyResponse(policyRepository.save(policy));
    }

    @Override
    @Transactional
    public void deletePolicy(Long id) {
        boolean inUse = !configRepository.findByPricePolicyId(id).isEmpty();
        if (inUse) {
            throw new IllegalArgumentException("Không thể xoá gói thuê đang được cấu hình giá sử dụng");
        }
        policyRepository.deleteById(id);
    }

    // ── RoomPriceConfig ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<RoomPriceConfigResponse> getAllConfigs() {
        return configRepository.findAllWithDetails().stream().map(this::toConfigResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomPriceConfigResponse> getConfigsByRoomType(Long roomTypeId) {
        return configRepository.findByRoomTypeIdWithPolicy(roomTypeId)
                .stream().map(this::toConfigResponse).toList();
    }

    @Override
    @Transactional
    public RoomPriceConfigResponse createConfig(RoomPriceConfigRequest request) {
        validateDayType(request.dayType());
        RoomType roomType = getRoomTypeById(request.roomTypeId());
        PricePolicy policy = getPolicyById(request.pricePolicyId());

        if (configRepository.existsByRoomTypeIdAndPricePolicyIdAndDayType(
                request.roomTypeId(), request.pricePolicyId(), request.dayType())) {
            throw new IllegalArgumentException(
                "Đã tồn tại cấu hình giá cho loại phòng này với gói thuê và loại ngày đã chọn");
        }

        RoomPriceConfig config = RoomPriceConfig.builder()
                .roomType(roomType)
                .pricePolicy(policy)
                .dayType(request.dayType())
                .price(request.price())
                .build();
        return toConfigResponse(configRepository.save(config));
    }

    @Override
    @Transactional
    public RoomPriceConfigResponse updateConfig(Long id, RoomPriceConfigRequest request) {
        validateDayType(request.dayType());
        RoomPriceConfig config = getConfigById(id);
        RoomType roomType = getRoomTypeById(request.roomTypeId());
        PricePolicy policy = getPolicyById(request.pricePolicyId());

        if (configRepository.existsByRoomTypeIdAndPricePolicyIdAndDayTypeAndIdNot(
                request.roomTypeId(), request.pricePolicyId(), request.dayType(), id)) {
            throw new IllegalArgumentException(
                "Đã tồn tại cấu hình giá cho loại phòng này với gói thuê và loại ngày đã chọn");
        }

        config.setRoomType(roomType);
        config.setPricePolicy(policy);
        config.setDayType(request.dayType());
        config.setPrice(request.price());
        return toConfigResponse(configRepository.save(config));
    }

    @Override
    @Transactional
    public void deleteConfig(Long id) {
        if (!configRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy cấu hình giá");
        }
        configRepository.deleteById(id);
    }

    // ── Private helpers ──────────────────────────────────────────────

    private PricePolicy getPolicyById(Long id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói thuê"));
    }

    private RoomType getRoomTypeById(Long id) {
        return roomTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng"));
    }

    private RoomPriceConfig getConfigById(Long id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy cấu hình giá"));
    }

    private void validateRentType(String rentType) {
        if (!VALID_RENT_TYPES.contains(rentType)) {
            throw new IllegalArgumentException("Loại hình thuê không hợp lệ. Chấp nhận: OVERNIGHT, HOURLY, COMBO, DAILY");
        }
    }

    private void validateDayType(String dayType) {
        if (!VALID_DAY_TYPES.contains(dayType)) {
            throw new IllegalArgumentException("Loại ngày không hợp lệ. Chấp nhận: WEEKDAY, WEEKEND");
        }
    }

    private void validateComboHours(String rentType, Integer limitHours) {
        if ("COMBO".equals(rentType) && (limitHours == null || limitHours <= 0)) {
            throw new IllegalArgumentException("Gói COMBO cần có số giờ giới hạn (limitHours) lớn hơn 0");
        }
    }

    private PricePolicyResponse toPolicyResponse(PricePolicy p) {
        return new PricePolicyResponse(
                p.getId(), p.getPolicyName(), p.getRentType(),
                p.getStandardCheckIn(), p.getStandardCheckOut(), p.getLimitHours());
    }

    private RoomPriceConfigResponse toConfigResponse(RoomPriceConfig c) {
        return new RoomPriceConfigResponse(
                c.getId(),
                c.getRoomType().getId(),
                c.getRoomType().getName(),
                c.getPricePolicy().getId(),
                c.getPricePolicy().getPolicyName(),
                c.getPricePolicy().getRentType(),
                c.getDayType(),
                c.getPrice());
    }
}
