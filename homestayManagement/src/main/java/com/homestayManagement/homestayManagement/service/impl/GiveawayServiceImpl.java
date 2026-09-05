package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import com.homestayManagement.homestayManagement.entity.*;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.GiveawayService;
import com.homestayManagement.homestayManagement.service.MarketingSocialPublisher;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class GiveawayServiceImpl implements GiveawayService {

    private final GiveawayLeadRepository giveawayLeadRepository;
    private final VoucherRepository voucherRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final MarketingPostRepository marketingPostRepository;
    private final MarketingPostChannelRepository marketingPostChannelRepository;
    private final MarketingPostMediaRepository marketingPostMediaRepository;
    private final MarketingSocialPublisher marketingSocialPublisher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.public-base-url:http://localhost:5173}")
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

    private static final List<GiveawayConfigResponse.PrizeOption> PRIZES = List.of(
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(0)
                    .name("Chuyến Đi Giảm Giá 50%")
                    .codePrefix("LADO50")
                    .discountPercent(50)
                    .color("#E11D48")
                    .icon("👑")
                    .badge("HOT NHẤT")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(1)
                    .name("Voucher Giảm 30% Tiền Phòng")
                    .codePrefix("LADO30")
                    .discountPercent(30)
                    .color("#D97706")
                    .icon("🎟️")
                    .badge("GIẢM SỐC")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(2)
                    .name("Tặng 01 Set Nướng BBQ Sân Vườn")
                    .codePrefix("LADOBBQ")
                    .discountPercent(0)
                    .color("#059669")
                    .icon("🍢")
                    .badge("ĐẶC BIỆT")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(3)
                    .name("Voucher Giảm 20% Tiền Phòng")
                    .codePrefix("LADO20")
                    .discountPercent(20)
                    .color("#2563EB")
                    .icon("🎁")
                    .badge("ƯU ĐÃI")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(4)
                    .name("Miễn Phí 02 Đồ Uống Ngắm Mây")
                    .codePrefix("LADODRINK")
                    .discountPercent(0)
                    .color("#7C3AED")
                    .icon("☕")
                    .badge("THƯ GIÃN")
                    .build(),
            GiveawayConfigResponse.PrizeOption.builder()
                    .index(5)
                    .name("Voucher Giảm 100K Khi Đặt Phòng")
                    .codePrefix("LADO100K")
                    .discountPercent(10)
                    .color("#0D9488")
                    .icon("🧧")
                    .badge("MAY MẮN")
                    .build()
    );

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
                .prizes(PRIZES)
                .build();
    }

    @Override
    @Transactional
    public String registerSpin(GiveawayRegisterSpinRequest request, String ipAddress) {
        String cleanPhone = normalizePhone(request.getPhone());
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        if (giveawayLeadRepository.existsByPhoneAndCreatedAtAfter(cleanPhone, oneDayAgo)) {
            throw new IllegalArgumentException("Số điện thoại này đã nhận lượt quay trong 24h qua. Mỗi khách hàng nhận 1 lượt quay miễn phí mỗi ngày!");
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

        GiveawayConfigResponse.PrizeOption wonPrize = PRIZES.get(targetIndex);

        // Sinh mã code độc nhất
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String prizeCode = wonPrize.getCodePrefix() + "-" + randomSuffix;

        // Nếu là giải có giảm giá %, tự động tạo Voucher thực tế trong DB để khách có thể đặt trực tiếp
        if (wonPrize.getDiscountPercent() > 0) {
            try {
                Voucher voucher = Voucher.builder()
                        .code(prizeCode)
                        .discountType("PERCENT")
                        .discountValue(BigDecimal.valueOf(wonPrize.getDiscountPercent()))
                        .minOrderValue(BigDecimal.valueOf(500000))
                        .maxDiscountAmount(BigDecimal.valueOf(2000000))
                        .startDate(LocalDateTime.now())
                        .endDate(LocalDateTime.now().plusDays(30))
                        .usageLimit(1)
                        .usedCount(0)
                        .build();
                voucherRepository.save(voucher);
            } catch (Exception ignored) {
                // Bỏ qua nếu mã trùng lặp hiếm gặp
            }
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
        String clean = phone.replaceAll("[^0-9+]", "");
        if (clean.startsWith("+84")) {
            clean = "0" + clean.substring(3);
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
