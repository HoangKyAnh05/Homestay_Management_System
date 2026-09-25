package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.GiveawayService;
import com.homestayManagement.homestayManagement.service.MarketingSocialPublisher;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class GiveawayServiceImpl implements GiveawayService {

    private static final Logger log = LoggerFactory.getLogger(GiveawayServiceImpl.class);
    private static final String PRIZES_FILE_PATH = "giveaway_prizes.json";

    private final GiveawayLeadRepository giveawayLeadRepository;
    private final VoucherRepository voucherRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final MarketingPostRepository marketingPostRepository;
    private final MarketingPostChannelRepository marketingPostChannelRepository;
    private final MarketingPostMediaRepository marketingPostMediaRepository;
    private final MarketingSocialPublisher marketingSocialPublisher;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.public-base-url:https://homestay-sapa.myvnc.com}")
    private String publicBaseUrl;

    public GiveawayServiceImpl(
            GiveawayLeadRepository giveawayLeadRepository,
            VoucherRepository voucherRepository,
            SocialAccountRepository socialAccountRepository,
            MarketingPostRepository marketingPostRepository,
            MarketingPostChannelRepository marketingPostChannelRepository,
            MarketingPostMediaRepository marketingPostMediaRepository,
            MarketingSocialPublisher marketingSocialPublisher
    ) {
        this.giveawayLeadRepository = giveawayLeadRepository;
        this.voucherRepository = voucherRepository;
        this.socialAccountRepository = socialAccountRepository;
        this.marketingPostRepository = marketingPostRepository;
        this.marketingPostChannelRepository = marketingPostChannelRepository;
        this.marketingPostMediaRepository = marketingPostMediaRepository;
        this.marketingSocialPublisher = marketingSocialPublisher;
    }

    private static final List<GiveawayConfigResponse.PrizeOption> DEFAULT_PRIZES = List.of(
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(0)
                    .shortTitle("GIẢM 50%")
                    .subText("Toàn Chuyến Đi")
                    .fullName("Chuyến Đi Giảm Giá 50%")
                    .name("Chuyến Đi Giảm Giá 50%")
                    .codePrefix("LADO50")
                    .discountPercent(50)
                    .color("#b91c1c")
                    .sliceColor1("#b91c1c")
                    .sliceColor2("#991b1b")
                    .textColor("#fef08a")
                    .icon("👑")
                    .badge("HOT NHẤT")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(1)
                    .shortTitle("GIẢM 30%")
                    .subText("Tiền Phòng Sa Pa")
                    .fullName("Voucher Giảm 30% Tiền Phòng")
                    .name("Voucher Giảm 30% Tiền Phòng")
                    .codePrefix("LADO30")
                    .discountPercent(30)
                    .color("#d97706")
                    .sliceColor1("#d97706")
                    .sliceColor2("#b45309")
                    .textColor("#fef08a")
                    .icon("🎟️")
                    .badge("GIẢM SỐC")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(2)
                    .shortTitle("TẶNG BBQ")
                    .subText("Tiệc Nướng Sân Vườn")
                    .fullName("Tặng 01 Set Nướng BBQ Sân Vườn")
                    .name("Tặng 01 Set Nướng BBQ Sân Vườn")
                    .codePrefix("LADOBBQ")
                    .discountPercent(0)
                    .color("#15803d")
                    .sliceColor1("#15803d")
                    .sliceColor2("#166534")
                    .textColor("#ffffff")
                    .icon("🍢")
                    .badge("ĐẶC BIỆT")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(3)
                    .shortTitle("GIẢM 20%")
                    .subText("Phòng View Săn Mây")
                    .fullName("Voucher Giảm 20% Tiền Phòng")
                    .name("Voucher Giảm 20% Tiền Phòng")
                    .codePrefix("LADO20")
                    .discountPercent(20)
                    .color("#be185d")
                    .sliceColor1("#be185d")
                    .sliceColor2("#9d174d")
                    .textColor("#ffffff")
                    .icon("🎁")
                    .badge("ƯU ĐÃI")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(4)
                    .shortTitle("02 ĐỒ UỐNG")
                    .subText("Ngắm Hoàng Hôn")
                    .fullName("Miễn Phí 02 Đồ Uống Ngắm Hoàng Hôn")
                    .name("Miễn Phí 02 Đồ Uống Ngắm Hoàng Hôn")
                    .codePrefix("LADODRINK")
                    .discountPercent(0)
                    .color("#0d9488")
                    .sliceColor1("#0d9488")
                    .sliceColor2("#0f766e")
                    .textColor("#ffffff")
                    .icon("☕")
                    .badge("THƯ GIÃN")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(5)
                    .shortTitle("VOUCHER 100K")
                    .subText("Đặt Phòng Ngay")
                    .fullName("Voucher Giảm 100K Khi Đặt Phòng")
                    .name("Voucher Giảm 100K Khi Đặt Phòng")
                    .codePrefix("LADO100K")
                    .discountPercent(10)
                    .color("#ea580c")
                    .sliceColor1("#ea580c")
                    .sliceColor2("#c2410c")
                    .textColor("#ffffff")
                    .icon("🧧")
                    .badge("MAY MẮN")
                    .build()
    );

    private final List<GiveawayConfigResponse.PrizeOption> activePrizes = new java.util.concurrent.CopyOnWriteArrayList<>(DEFAULT_PRIZES);

    @PostConstruct
    public void init() {
        loadPrizesFromFile();
    }

    private void loadPrizesFromFile() {
        try {
            File file = new File(PRIZES_FILE_PATH);
            if (file.exists() && file.isFile()) {
                List<GiveawayConfigResponse.PrizeOption> loaded = objectMapper.readValue(
                        file,
                        new TypeReference<List<GiveawayConfigResponse.PrizeOption>>() {}
                );
                if (loaded != null && !loaded.isEmpty()) {
                    activePrizes.clear();
                    for (int i = 0; i < loaded.size(); i++) {
                        GiveawayConfigResponse.PrizeOption p = loaded.get(i);
                        p.setIndex(i);
                        if (p.getName() == null || p.getName().trim().isEmpty()) {
                            p.setName(p.getFullName() != null && !p.getFullName().trim().isEmpty() ? p.getFullName().trim() : p.getShortTitle());
                        }
                        activePrizes.add(p);
                    }
                    log.info("Loaded {} lucky wheel prizes from file: {}", activePrizes.size(), PRIZES_FILE_PATH);
                }
            }
        } catch (Exception e) {
            log.warn("Could not load custom lucky wheel prizes from file, using defaults: {}", e.getMessage());
        }
    }

    private void savePrizesToFile() {
        try {
            File file = new File(PRIZES_FILE_PATH);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, new ArrayList<>(activePrizes));
            log.info("Saved {} lucky wheel prizes to file: {}", activePrizes.size(), PRIZES_FILE_PATH);
        } catch (Exception e) {
            log.error("Failed to save lucky wheel prizes to file: {}", e.getMessage(), e);
        }
    }

    @Override
    public List<GiveawayConfigResponse.PrizeOption> getPrizes() {
        return new java.util.ArrayList<>(activePrizes);
    }

    @Override
    public List<GiveawayConfigResponse.PrizeOption> updatePrizes(List<GiveawayConfigResponse.PrizeOption> newPrizes) {
        if (newPrizes != null && !newPrizes.isEmpty()) {
            activePrizes.clear();
            for (int i = 0; i < newPrizes.size(); i++) {
                GiveawayConfigResponse.PrizeOption p = newPrizes.get(i);
                p.setIndex(i);
                if (p.getFullName() != null && !p.getFullName().trim().isEmpty()) {
                    p.setName(p.getFullName().trim());
                } else if (p.getName() == null || p.getName().trim().isEmpty()) {
                    p.setName(p.getShortTitle());
                }
                if (p.getSliceColor1() == null || p.getSliceColor1().trim().isEmpty()) {
                    p.setSliceColor1(i % 2 == 0 ? "#b91c1c" : "#d97706");
                }
                if (p.getSliceColor2() == null || p.getSliceColor2().trim().isEmpty()) {
                    p.setSliceColor2(i % 2 == 0 ? "#991b1b" : "#b45309");
                }
                if (p.getTextColor() == null || p.getTextColor().trim().isEmpty()) {
                    p.setTextColor("#ffffff");
                }
                activePrizes.add(p);
            }
            savePrizesToFile();
        }
        return getPrizes();
    }

    @Override
    public List<GiveawayConfigResponse.PrizeOption> resetPrizes() {
        activePrizes.clear();
        activePrizes.addAll(DEFAULT_PRIZES);
        savePrizesToFile();
        return getPrizes();
    }

    @Override
    public GiveawayConfigResponse getConfig() {
        return GiveawayConfigResponse.builder()
                .campaignTitle("Vòng Quay May Mắn - Lá Đỏ Homestay Sa Pa")
                .campaignSubtitle("Điền thông tin nhận ngay 1 lượt quay miễn phí - Cơ hội trúng chuyến đi giảm 50% cùng nhiều quà tặng hấp dẫn!")
                .homestayName("Lá Đỏ Homestay Sa Pa")
                .hotline("0981 123 456")
                .zaloNumber("0981123456")
                .facebookMessengerUrl("https://m.me/ladohomestaysapa")
                .address("Đường Fansipan, Thị xã Sa Pa, Lào Cai")
                .prizes(new java.util.ArrayList<>(activePrizes))
                .build();
    }

    @Override
    @Transactional
    public String registerSpin(GiveawayRegisterSpinRequest request, String ipAddress) {
        String cleanPhone = normalizePhone(request.getPhone());

        if (giveawayLeadRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Số điện thoại này (" + cleanPhone + ") đã tham gia vòng quay may mắn trước đó! Mỗi số điện thoại chỉ được quay 1 lần duy nhất. Vui lòng nhập số điện thoại mới để nhận lượt quay tiếp theo.");
        }

        String spinToken = UUID.randomUUID().toString();

        GiveawayLead lead = GiveawayLead.builder()
                .fullName(request.getFullName().trim())
                .phone(cleanPhone)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .travelPlan(request.getTravelPlan())
                .notes(request.getNotes())
                .prizeName("Đang chờ quay...")
                .prizeCode(null)
                .discountPercent(0)
                .status("PENDING_SPIN")
                .spinToken(spinToken)
                .ipAddress(ipAddress)
                .build();

        giveawayLeadRepository.save(lead);
        return spinToken;
    }

    @Override
    @Transactional
    public GiveawaySpinResponse spin(GiveawaySpinRequest request) {
        GiveawayLead lead = giveawayLeadRepository.findBySpinToken(request.getSpinToken())
                .orElseThrow(() -> new IllegalArgumentException("Lượt quay không hợp lệ hoặc đã được sử dụng."));

        if (!"PENDING_SPIN".equals(lead.getStatus())) {
            throw new IllegalArgumentException("Lượt quay này đã được hoàn tất trước đó.");
        }

        // Tỉ lệ trúng thưởng hấp dẫn (Ưu tiên giải 50% và 30% để kích cầu du lịch như mong muốn của user)
        // Phân phối xác suất: 50% (35%), 30% (30%), BBQ (15%), 20% (10%), Drink (5%), 100k (5%)
        int roll = secureRandom.nextInt(100);
        int targetIndex;
        if (roll < 35) {
            targetIndex = 0; // 50%
        } else if (roll < 65) {
            targetIndex = 1; // 30%
        } else if (roll < 80) {
            targetIndex = 2; // BBQ
        } else if (roll < 90) {
            targetIndex = 3; // 20%
        } else if (roll < 95) {
            targetIndex = 4; // Drinks
        } else {
            targetIndex = 5; // 100k
        }

        GiveawayConfigResponse.PrizeOption wonPrize = targetIndex < activePrizes.size()
                ? activePrizes.get(targetIndex)
                : DEFAULT_PRIZES.get(targetIndex % DEFAULT_PRIZES.size());

        String prefix = wonPrize.getCodePrefix() != null && !wonPrize.getCodePrefix().isEmpty() ? wonPrize.getCodePrefix() : "LADO";
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String prizeCode = prefix + "-" + randomSuffix;

        // Tự động tạo Voucher thực tế trong DB để khách có thể áp dụng khi đặt phòng trực tuyến
        try {
            BigDecimal discountVal;
            String type;
            BigDecimal minOrder = BigDecimal.valueOf(300000);
            BigDecimal maxDiscount = BigDecimal.valueOf(2000000);

            if (wonPrize.getDiscountPercent() > 0) {
                type = "PERCENT";
                discountVal = BigDecimal.valueOf(wonPrize.getDiscountPercent());
            } else if (wonPrize.getShortTitle() != null && wonPrize.getShortTitle().toUpperCase().contains("100K")) {
                type = "AMOUNT";
                discountVal = BigDecimal.valueOf(100000);
            } else if (wonPrize.getShortTitle() != null && wonPrize.getShortTitle().toUpperCase().contains("BBQ")) {
                type = "AMOUNT";
                discountVal = BigDecimal.valueOf(150000);
            } else {
                type = "AMOUNT";
                discountVal = BigDecimal.valueOf(50000);
            }

            Voucher voucher = Voucher.builder()
                    .code(prizeCode)
                    .discountType(type)
                    .discountValue(discountVal)
                    .minOrderValue(minOrder)
                    .maxDiscountAmount(maxDiscount)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(30))
                    .usageLimit(1)
                    .usedCount(0)
                    .build();
            voucherRepository.save(voucher);
        } catch (Exception ignored) {
            // Bỏ qua nếu mã trùng lặp hiếm gặp
        }

        // Cập nhật Lead trong database
        lead.setPrizeName(wonPrize.getName());
        lead.setPrizeCode(prizeCode);
        lead.setDiscountPercent(wonPrize.getDiscountPercent());
        lead.setStatus("NEW");
        lead.setSpinToken(null); // Vô hiệu hóa token sau khi quay xong
        giveawayLeadRepository.save(lead);

        String congratsMsg = wonPrize.getDiscountPercent() >= 50
                ? "CHÚC MỪNG BẠN ĐÃ TRÚNG ĐỈNH CHÓP: Chuyến đi giảm giá 50% tại Lá Đỏ Homestay Sa Pa!"
                : "Chúc mừng bạn đã trúng: " + wonPrize.getName() + "!";

        return GiveawaySpinResponse.builder()
                .targetIndex(targetIndex)
                .prizeName(wonPrize.getName())
                .prizeCode(prizeCode)
                .discountPercent(wonPrize.getDiscountPercent())
                .congratulationsMessage(congratsMsg)
                .voucherExpiry("Hạn sử dụng trong vòng 30 ngày kể từ hôm nay")
                .contact(GiveawaySpinResponse.ContactDetails.builder()
                        .hotline("0981 123 456")
                        .zalo("https://zalo.me/0981123456")
                        .facebookUrl("https://m.me/ladohomestaysapa")
                        .address("Đường Fansipan, Thị xã Sa Pa, Lào Cai")
                        .build())
                .build();
    }

    @Override
    public Page<GiveawayLeadResponse> getLeads(String search, String status, Pageable pageable) {
        String cleanSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String cleanStatus = status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status) ? status.trim() : null;

        return giveawayLeadRepository.searchLeads(cleanSearch, cleanStatus, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public GiveawayLeadResponse updateLeadStatus(Long id, GiveawayLeadUpdateStatusRequest request) {
        GiveawayLead lead = giveawayLeadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin khách hàng với ID: " + id));

        lead.setStatus(request.getStatus().trim().toUpperCase());
        if (request.getStaffNote() != null) {
            lead.setStaffNote(request.getStaffNote().trim());
        }
        giveawayLeadRepository.save(lead);
        return mapToResponse(lead);
    }

    @Override
    public GiveawayStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return GiveawayStatsResponse.builder()
                .totalInteractions(giveawayLeadRepository.count())
                .newLeadsCount(giveawayLeadRepository.countByStatus("NEW"))
                .contactedCount(giveawayLeadRepository.countByStatus("CONTACTED"))
                .bookedCount(giveawayLeadRepository.countByStatus("BOOKED"))
                .todayLeadsCount(giveawayLeadRepository.countByCreatedAtAfter(startOfDay))
                .topPrizesWon(giveawayLeadRepository.countTopPrizesWon())
                .build();
    }

    @Override
    public byte[] exportLeadsToExcel() {
        List<GiveawayLead> leads = giveawayLeadRepository.findAllByOrderByCreatedAtDesc();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Khach_Hang_Tiem_Nang_Giveaway");

            // Font & Style Header
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] columns = {"ID", "Họ và Tên", "Số Điện Thoại", "Email", "Dự Định Du Lịch", "Ghi Chú Khách Hàng", "Giải Thưởng", "Mã Voucher", "Giảm (%)", "Trạng Thái", "Ghi Chú Nhân Viên", "Ngày Tham Gia"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            int rowIdx = 1;
            for (GiveawayLead lead : leads) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(lead.getId());
                row.createCell(1).setCellValue(lead.getFullName() != null ? lead.getFullName() : "");
                row.createCell(2).setCellValue(lead.getPhone() != null ? lead.getPhone() : "");
                row.createCell(3).setCellValue(lead.getEmail() != null ? lead.getEmail() : "");
                row.createCell(4).setCellValue(lead.getTravelPlan() != null ? lead.getTravelPlan() : "");
                row.createCell(5).setCellValue(lead.getNotes() != null ? lead.getNotes() : "");
                row.createCell(6).setCellValue(lead.getPrizeName() != null ? lead.getPrizeName() : "");
                row.createCell(7).setCellValue(lead.getPrizeCode() != null ? lead.getPrizeCode() : "");
                row.createCell(8).setCellValue(lead.getDiscountPercent() != null ? lead.getDiscountPercent() : 0);
                row.createCell(9).setCellValue(translateStatus(lead.getStatus()));
                row.createCell(10).setCellValue(lead.getStaffNote() != null ? lead.getStaffNote() : "");
                row.createCell(11).setCellValue(lead.getCreatedAt() != null ? lead.getCreatedAt().format(formatter) : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi xuất file Excel khách hàng tiềm năng: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void publishGiveawayPost(GiveawayPostPublishRequest request) {
        SocialAccount account;
        if (request.getSocialAccountId() != null) {
            account = socialAccountRepository.findById(request.getSocialAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kênh mạng xã hội đã chọn"));
        } else {
            account = socialAccountRepository.findFirstByPlatformAndActiveTrueOrderByIdAsc("FACEBOOK")
                    .orElseThrow(() -> new IllegalArgumentException("Chưa có Facebook Fanpage nào được kết nối. Hãy kết nối Facebook Fanpage trước khi đăng bài!"));
        }

        // Ghép nội dung bài viết kèm link
        String finalUrl = request.getGiveawayUrl() != null && !request.getGiveawayUrl().trim().isEmpty()
                ? request.getGiveawayUrl().trim()
                : publicBaseUrl + "/giveaway";

        String finalContent = request.getContent() + "\n\n👉 THAM GIA VÒNG QUAY MAY MẮN NGAY TẠI: " + finalUrl;

        MarketingPost post = MarketingPost.builder()
                .title(request.getTitle())
                .status("PUBLISHED")
                .sourceType("GIVEAWAY_CAMPAIGN")
                .build();
        marketingPostRepository.save(post);

        MarketingPostChannel channel = MarketingPostChannel.builder()
                .post(post)
                .socialAccount(account)
                .platform(account.getPlatform())
                .pageName(account.getAccountName())
                .pageUrl(account.getPageUrl())
                .content(finalContent)
                .hashtags(request.getHashtags() != null ? String.join(" ", request.getHashtags()) : "#LaDoHomestay #SaPa #Giveaway #VongQuayMayMan")
                .status("PUBLISHING")
                .build();
        marketingPostChannelRepository.save(channel);

        if (request.getImageUrls() != null) {
            for (String img : request.getImageUrls()) {
                if (img != null && !img.trim().isEmpty()) {
                    MarketingPostMedia media = MarketingPostMedia.builder()
                            .post(post)
                            .channel(channel)
                            .mediaUrl(img.trim())
                            .mediaType("IMAGE")
                            .build();
                    marketingPostMediaRepository.save(media);
                }
            }
        }

        MarketingSocialPublisher.PublishResult result = marketingSocialPublisher.publish(channel);
        if (!result.success()) {
            channel.setStatus("FAILED");
            channel.setErrorMessage(result.errorMessage());
            marketingPostChannelRepository.save(channel);
            throw new IllegalStateException("Đăng bài Facebook thất bại: " + result.errorMessage());
        }

        channel.setStatus("PUBLISHED");
        channel.setExternalPostId(result.externalPostId());
        channel.setExternalUrl(result.externalUrl());
        marketingPostChannelRepository.save(channel);
    }

    private GiveawayLeadResponse mapToResponse(GiveawayLead lead) {
        return GiveawayLeadResponse.builder()
                .id(lead.getId())
                .fullName(lead.getFullName())
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .travelPlan(lead.getTravelPlan())
                .notes(lead.getNotes())
                .prizeName(lead.getPrizeName())
                .prizeCode(lead.getPrizeCode())
                .discountPercent(lead.getDiscountPercent())
                .status(lead.getStatus())
                .staffNote(lead.getStaffNote())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("84") && clean.length() == 11) {
            clean = "0" + clean.substring(2);
        } else if (clean.startsWith("0084") && clean.length() == 13) {
            clean = "0" + clean.substring(4);
        }
        return clean;
    }

    private String translateStatus(String status) {
        if (status == null) return "";
        return switch (status) {
            case "NEW" -> "Mới - Chưa liên hệ";
            case "CONTACTED" -> "Đã liên hệ tư vấn";
            case "BOOKED" -> "Đã chốt đặt phòng";
            case "CANCELLED" -> "Hủy / Không nghe máy";
            case "PENDING_SPIN" -> "Chưa hoàn tất quay";
            default -> status;
        };
    }
}
