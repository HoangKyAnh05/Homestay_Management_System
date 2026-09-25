package com.homestayManagement.homestayManagement.service;

import com.homestayManagement.homestayManagement.dto.giveaway.*;
import com.homestayManagement.homestayManagement.entity.GiveawayLead;
import com.homestayManagement.homestayManagement.entity.Voucher;
import com.homestayManagement.homestayManagement.repository.*;
import com.homestayManagement.homestayManagement.service.event.GiveawayPrizeEmailEvent;
import com.homestayManagement.homestayManagement.service.impl.GiveawayServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GiveawayServiceImplTest {

    @Mock
    private GiveawayLeadRepository giveawayLeadRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private SocialAccountRepository socialAccountRepository;

    @Mock
    private MarketingPostRepository marketingPostRepository;

    @Mock
    private MarketingPostChannelRepository marketingPostChannelRepository;

    @Mock
    private MarketingPostMediaRepository marketingPostMediaRepository;

    @Mock
    private MarketingSocialPublisher marketingSocialPublisher;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private GiveawayServiceImpl giveawayService;

    @BeforeEach
    void setUp() {
        giveawayService = new GiveawayServiceImpl(
                giveawayLeadRepository,
                voucherRepository,
                socialAccountRepository,
                marketingPostRepository,
                marketingPostChannelRepository,
                marketingPostMediaRepository,
                marketingSocialPublisher,
                eventPublisher
        );
    }

    @Test
    @DisplayName("getConfig: Trả về đầy đủ cấu hình giải thưởng vòng quay và liên hệ")
    void testGetConfig() {
        GiveawayConfigResponse config = giveawayService.getConfig();

        assertNotNull(config);
        assertNotNull(config.getPrizes());
        assertEquals(6, config.getPrizes().size());
        assertEquals("Chuyến Đi Giảm Giá 50%", config.getPrizes().get(0).getName());
        assertEquals(50, config.getPrizes().get(0).getDiscountPercent());
    }

    @Test
    @DisplayName("registerSpin: Đăng ký lượt quay thành công và trả về spinToken khi có email hợp lệ")
    void testRegisterSpinSuccess() {
        when(giveawayLeadRepository.existsByPhone(anyString()))
                .thenReturn(false);
        when(giveawayLeadRepository.save(any(GiveawayLead.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        GiveawayRegisterSpinRequest request = GiveawayRegisterSpinRequest.builder()
                .fullName("Nguyễn Văn A")
                .phone("0912345678")
                .email("vana@gmail.com")
                .travelPlan("Cuối tuần này")
                .notes("Cần phòng view mây")
                .build();

        String token = giveawayService.registerSpin(request, "127.0.0.1");

        assertNotNull(token);
        verify(giveawayLeadRepository, times(1)).save(any(GiveawayLead.class));
    }

    @Test
    @DisplayName("registerSpin: Báo lỗi nếu thiếu email hoặc để trống email")
    void testRegisterSpinMissingEmail() {
        GiveawayRegisterSpinRequest request = GiveawayRegisterSpinRequest.builder()
                .fullName("Nguyễn Văn A")
                .phone("0912345678")
                .email("")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> giveawayService.registerSpin(request, "127.0.0.1"));

        assertTrue(ex.getMessage().contains("Vui lòng nhập địa chỉ Gmail/Email"));
    }

    @Test
    @DisplayName("registerSpin: Báo lỗi nếu email sai định dạng")
    void testRegisterSpinInvalidEmail() {
        GiveawayRegisterSpinRequest request = GiveawayRegisterSpinRequest.builder()
                .fullName("Nguyễn Văn A")
                .phone("0912345678")
                .email("invalid-email-format")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> giveawayService.registerSpin(request, "127.0.0.1"));

        assertTrue(ex.getMessage().contains("không đúng định dạng"));
    }

    @Test
    @DisplayName("registerSpin: Báo lỗi nếu số điện thoại đã quay trước đó")
    void testRegisterSpinDuplicatePhone() {
        when(giveawayLeadRepository.existsByPhone(anyString()))
                .thenReturn(true);

        GiveawayRegisterSpinRequest request = GiveawayRegisterSpinRequest.builder()
                .fullName("Nguyễn Văn A")
                .phone("0912345678")
                .email("vana@gmail.com")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> giveawayService.registerSpin(request, "127.0.0.1"));

        assertTrue(ex.getMessage().contains("đã tham gia vòng quay"));
    }

    @Test
    @DisplayName("spin: Quay số thành công, cập nhật giải thưởng, vô hiệu token và phát sự kiện gửi email")
    void testSpinSuccess() {
        String token = "test-spin-token";
        GiveawayLead lead = GiveawayLead.builder()
                .id(1L)
                .fullName("Nguyễn Văn A")
                .phone("0912345678")
                .email("vana@gmail.com")
                .status("PENDING_SPIN")
                .spinToken(token)
                .build();

        when(giveawayLeadRepository.findBySpinToken(token)).thenReturn(Optional.of(lead));
        when(giveawayLeadRepository.save(any(GiveawayLead.class))).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.lenient().when(voucherRepository.save(any(Voucher.class))).thenAnswer(inv -> inv.getArgument(0));

        GiveawaySpinResponse response = giveawayService.spin(new GiveawaySpinRequest(token));

        assertNotNull(response);
        assertNotNull(response.getPrizeName());
        assertNotNull(response.getPrizeCode());
        assertEquals("NEW", lead.getStatus());
        assertNull(lead.getSpinToken());
        verify(eventPublisher, times(1)).publishEvent(any(GiveawayPrizeEmailEvent.class));
    }

    @Test
    @DisplayName("updateLeadStatus: Cập nhật trạng thái và ghi chú nhân viên thành công")
    void testUpdateLeadStatus() {
        GiveawayLead lead = GiveawayLead.builder()
                .id(1L)
                .fullName("Trần Thị B")
                .phone("0987654321")
                .status("NEW")
                .build();

        when(giveawayLeadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(giveawayLeadRepository.save(any(GiveawayLead.class))).thenAnswer(inv -> inv.getArgument(0));

        GiveawayLeadResponse res = giveawayService.updateLeadStatus(1L,
                new GiveawayLeadUpdateStatusRequest("CONTACTED", "Đã gọi, khách muốn đi ngày 15/9"));

        assertNotNull(res);
        assertEquals("CONTACTED", res.getStatus());
        assertEquals("Đã gọi, khách muốn đi ngày 15/9", res.getStaffNote());
    }
}
