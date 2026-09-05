package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.HumanizedContentGenerateRequest;
import com.homestayManagement.homestayManagement.dto.response.HumanizedContentResponse;
import com.homestayManagement.homestayManagement.entity.Room;
import com.homestayManagement.homestayManagement.entity.RoomImage;
import com.homestayManagement.homestayManagement.repository.RoomImageRepository;
import com.homestayManagement.homestayManagement.repository.RoomRepository;
import com.homestayManagement.homestayManagement.service.HumanizedMarketingContentService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HumanizedMarketingContentServiceImpl implements HumanizedMarketingContentService {

    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    public HumanizedMarketingContentServiceImpl(RoomRepository roomRepository, RoomImageRepository roomImageRepository) {
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
    }

    @Override
    public Map<String, Object> getPresets() {
        Map<String, Object> presets = new LinkedHashMap<>();

        List<Map<String, String>> themes = List.of(
                Map.of("id", "SAN_MAY", "label", "Săn mây & Bình minh Sa Pa", "desc", "Khung cảnh biển mây bồng bềnh, đón ngày mới thảnh thơi"),
                Map.of("id", "PHONG_CHILL", "label", "Phòng gỗ gác mái & View Mường Hoa", "desc", "Không gian ấm cúng, cửa sổ chạm mây ngắm trọn thung lũng"),
                Map.of("id", "AM_THUC", "label", "Ẩm thực bản địa & Bếp lửa ấm", "desc", "Lẩu cá tầm, nướng than hồng và hương vị đặc sản Tây Bắc"),
                Map.of("id", "CAM_NANG", "label", "Mẹo du lịch & Góc chụp hình đẹp", "desc", "Kinh nghiệm thực tế, điểm check-in ít người biết tại Sa Pa"),
                Map.of("id", "UU_DAI", "label", "Gói nghỉ dưỡng & Ưu đãi thảnh thơi", "desc", "Combo cuối tuần, ưu đãi cặp đôi và gia đình"),
                Map.of("id", "CHECKIN_KHACH", "label", "Khoảnh khắc khách hàng trải nghiệm", "desc", "Cảm nhận chân thực, nụ cười và kỷ niệm của khách lưu trú")
        );

        List<Map<String, String>> tones = List.of(
                Map.of("id", "WARM", "label", "Ấm áp, thong thả & Chữa lành", "desc", "Văn phong thư giãn, nhẹ nhàng, gợi cảm giác bình yên"),
                Map.of("id", "LOCAL_STORY", "label", "Chân thực, bản địa & Kể chuyện", "desc", "Đậm chất host người bản xứ, thân thiện và nhiệt tình"),
                Map.of("id", "YOUTHFUL", "label", "Trẻ trung, tươi mới & Khám phá", "desc", "Gợi mở năng lượng tích cực cho giới trẻ du lịch trải nghiệm"),
                Map.of("id", "LUXURY", "label", "Tinh tế, sang trọng & Riêng tư", "desc", "Lịch thiệp, nhấn mạnh vào chất lượng dịch vụ và sự yên tĩnh")
        );

        List<Map<String, String>> platforms = List.of(
                Map.of("id", "FACEBOOK", "label", "Facebook Fanpage / Group", "icon", "facebook"),
                Map.of("id", "TIKTOK", "label", "TikTok Short Video", "icon", "tiktok"),
                Map.of("id", "INSTAGRAM", "label", "Instagram Post / Reel", "icon", "instagram"),
                Map.of("id", "YOUTUBE", "label", "YouTube Shorts / Community", "icon", "youtube")
        );

        presets.put("themes", themes);
        presets.put("tones", tones);
        presets.put("platforms", platforms);
        return presets;
    }

    @Override
    public HumanizedContentResponse generateContent(HumanizedContentGenerateRequest request) {
        String theme = request.getTheme() != null ? request.getTheme().toUpperCase() : "SAN_MAY";
        String tone = request.getTone() != null ? request.getTone().toUpperCase() : "WARM";
        String platform = request.getPlatform() != null ? request.getPlatform().toUpperCase() : "FACEBOOK";
        String customNotes = request.getCustomNotes() != null ? request.getCustomNotes().trim() : "";

        String roomName = "Lá Đỏ Homestay";
        String roomType = "Phòng view thung lũng";
        String roomSummary = "Không gian nghỉ dưỡng ấm cúng giữa lòng Sa Pa.";
        List<String> suggestedImages = new ArrayList<>();

        if (request.getRoomId() != null) {
            Optional<Room> roomOpt = roomRepository.findById(request.getRoomId());
            if (roomOpt.isPresent()) {
                Room r = roomOpt.get();
                roomName = "Phòng " + r.getRoomNumber();
                if (r.getRoomType() != null) {
                    roomType = r.getRoomType().getName();
                    roomSummary = String.format("Phòng %s (%s) - Sức chứa %d người lớn. %s",
                            r.getRoomNumber(),
                            r.getRoomType().getName(),
                            r.getRoomType().getMaxAdults() != null ? r.getRoomType().getMaxAdults() : 2,
                            r.getRoomType().getDescription() != null ? r.getRoomType().getDescription() : "");
                }
                List<RoomImage> images = roomImageRepository.findByRoomId(r.getId());
                suggestedImages = images.stream().map(RoomImage::getImageUrl).collect(Collectors.toList());
            }
        }

        // Generate natural storytelling content based on theme and tone
        String title;
        StringBuilder caption = new StringBuilder();
        String cta;
        String hashtags;

        switch (theme) {
            case "PHONG_CHILL":
                title = "Thức dậy ở một nơi chỉ có mây và tiếng thông reo | " + roomName;
                if ("WARM".equals(tone)) {
                    caption.append("Một sớm mai thức giấc, kéo nhẹ rèm cửa là cả thung lũng Mường Hoa bảng lảng sương mây ùa vào tầm mắt.\n\n");
                    caption.append("Ở ").append(roomName).append(" (").append(roomType).append("), mọi thứ được giữ mộc mạc nhất có thể: sàn gỗ ấm, hương tinh dầu quế dịu nhẹ và chiếc ban công nhỏ xinh để bạn có thể ngồi hàng giờ nhâm nhi tách trà nóng.\n\n");
                    caption.append("Chẳng cần vội vã lịch trình, đôi khi một chuyến đi trọn vẹn chỉ là được ngủ một giấc thật sâu trong không gian yên tĩnh thế này thôi.");
                } else if ("LOCAL_STORY".equals(tone)) {
                    caption.append("Nhiều bạn ghé Lá Đỏ bảo thích nhất căn ").append(roomName).append(" vì chiều tà ngồi góc ban công này đón hoàng hôn buông xuống dãy Hoàng Liên Sơn là đẹp nhất.\n\n");
                    caption.append("Phòng thiết kế theo kiến trúc nhà gỗ Tây Bắc mộc mạc nhưng đầy đủ tiện nghi ấm cúng. Tối đến bật đèn vàng, mở một bản nhạc acoustic nhẹ nhàng là thấy lòng nhẹ bẫng sau những ngày dài bận rộn.");
                } else {
                    caption.append("Góc phòng chữa lành chuẩn vibe Sa Pa dành cho bạn: ").append(roomName).append(" - ").append(roomType).append(".\n\n");
                    caption.append("✨ Cửa sổ kính lớn đón trọn view núi rừng Hoàng Liên\n");
                    caption.append("✨ Không gian gỗ ấm áp, thơm mùi tự nhiên\n");
                    caption.append("✨ Góc sống ảo thơ mộng ngay tại giường nằm\n\n");
                    caption.append("Rủ ngay người thương lên Sa Pa trốn khói bụi thành phố nào!");
                }
                cta = "👉 Nhắn tin cho Lá Đỏ Homestay để giữ góc phòng đẹp này cho kỳ nghỉ sắp tới của bạn nhé!";
                break;

            case "AM_THUC":
                title = "Tối Sa Pa se lạnh, quây quần bên nồi lẩu nóng hổi tại Lá Đỏ";
                caption.append("Trời Sa Pa về đêm bắt đầu se lạnh, còn gì tuyệt hơn khi cùng người thương và bạn bè ngồi quanh bàn ăn nghi ngút khói?\n\n");
                caption.append("Tại Lá Đỏ, chúng mình chuẩn bị những mâm cơm gia đình ấm cúng và set lẩu cá tầm tươi ngon chuẩn vị Tây Bắc. Rau cải mèo giòn ngọt, chút rượu táo mèo thơm êm và những câu chuyện trò rôm rả dưới ánh đèn vàng.\n\n");
                caption.append("Một bữa tối bình dị nhưng chắc chắn sẽ là kỷ niệm thật ấm áp trong hành trình của bạn.");
                cta = "🥢 Đừng quên đặt trước bữa tối ấm cúng cùng tụi mình khi bạn check-in nhé!";
                break;

            case "CAM_NANG":
                title = "3 khung giờ săn mây và check-in đẹp nhất tại Sa Pa tuần này";
                caption.append("Mách bạn kinh nghiệm săn mây chuẩn chỉnh từ góc nhìn của tụi mình ở Sa Pa:\n\n");
                caption.append("🌤️ 06:00 - 07:30: Sương sớm bắt đầu tan, biển mây bồng bềnh tràn qua thung lũng Mường Hoa. Ánh nắng đầu tiên chiếu rọi là thời điểm chụp ảnh thơ nhất.\n");
                caption.append("☀️ 16:30 - 17:45: Hoàng hôn nhuộm vàng đỉnh Fansipan, gió se lạnh và mây chuyển màu tím hồng cực kỳ lãng mạn.\n");
                caption.append("🌙 20:00 trở đi: Bầu trời quang đãng ngắm sao đêm tĩnh mịch bên tách trà quế nóng.\n\n");
                caption.append("Lưu lại ngay bài viết để chuyến đi Sa Pa sắp tới của bạn thêm trọn vẹn nhé!");
                cta = "📌 Nhấn Lưu bài viết và chia sẻ cho người bạn đồng hành của bạn ngay!";
                break;

            case "UU_DAI":
                title = "Gói nghỉ dưỡng thảnh thơi dành riêng cho mùa này tại Lá Đỏ Homestay";
                caption.append("Dành tặng bạn một kỳ nghỉ trọn vẹn không âu lo giữa mây trời Sa Pa:\n\n");
                caption.append("🌿 Tặng kèm bữa sáng đặc sản Tây Bắc và set trà chiều ngắm thung lũng\n");
                caption.append("🌿 Ưu đãi linh hoạt khi đặt phòng trước từ 2 đêm\n");
                caption.append("🌿 Miễn phí hỗ trợ tư vấn lịch trình khám phá bản làng không xô bồ\n\n");
                caption.append("Áp dụng cho các hạng phòng tại Lá Đỏ Homestay (đặc biệt là ").append(roomName).append("). Số lượng phòng view đẹp có hạn để đảm bảo sự riêng tư tốt nhất.");
                cta = "💌 Inbox ngay cho fanpage Lá Đỏ để nhận báo giá chi tiết và giữ phòng view đẹp nhất!";
                break;

            case "CHECKIN_KHACH":
                title = "Những khoảnh khắc thảnh thơi của khách thương tại Lá Đỏ";
                caption.append("“Lên đây chỉ muốn ngồi ngắm mây cả ngày mà không muốn về...” - Lời nhắn nhủ dễ thương từ một vị khách sau 3 ngày lưu trú tại Lá Đỏ.\n\n");
                caption.append("Cảm ơn bạn đã chọn góc nhỏ của chúng mình làm nơi dừng chân để nạp lại năng lượng. Mỗi nụ cười và kỷ niệm đẹp của các bạn chính là niềm vui lớn nhất của đội ngũ Lá Đỏ Homestay.\n\n");
                caption.append("Hẹn gặp lại bạn vào một mùa hoa hay một mùa mây mới!");
                cta = "📸 Chia sẻ ảnh kỷ niệm của bạn cùng Lá Đỏ dưới phần bình luận nhé!";
                break;

            case "SAN_MAY":
            default:
                title = "Một sớm Sa Pa thức dậy giữa biển mây bồng bềnh tại Lá Đỏ";
                caption.append("Sa Pa sáng nay mây tràn qua ô cửa sổ, không gian tĩnh lặng chỉ có tiếng chim hót và hương núi rừng thoang thoảng.\n\n");
                caption.append("Tự thưởng cho bản thân một buổi sáng thong thả: nhấp ngụm cà phê phin đậm đà, cuộn mình trong chăn ấm và ngắm nhìn từng dải mây lững lờ trôi qua sườn đồi.\n\n");
                caption.append("Nếu bạn đang tìm một nơi để 'chữa lành' và tạm gác lại những bộn bề nơi phố thị, Lá Đỏ Homestay luôn sẵn sàng mở cửa chào đón bạn.");
                cta = "📍 Lá Đỏ Homestay Sa Pa - Nơi bạn tìm về với sự bình yên giữa mây trời Tây Bắc.";
                break;
        }

        if (!customNotes.isEmpty()) {
            caption.append("\n\n💡 Ghi chú thêm: ").append(customNotes);
        }

        // Smart Localized Hashtags (No spammy bot tags like #fyp #viral)
        if ("TIKTOK".equals(platform)) {
            hashtags = "#LaDoHomestay #SaPa #DuLichSaPa #SanMaySaPa #ReviewSaPa #HomestayDepSaPa #MuongHoa #CheckinSaPa";
        } else if ("INSTAGRAM".equals(platform)) {
            hashtags = "#ladohomestay #sapavietnam #travelvietnam #muonghoavalley #sapahomestay #cloudhunting #vietnamtravel #wanderlust";
        } else if ("YOUTUBE".equals(platform)) {
            hashtags = "#LaDoHomestay #SaPa #Shorts #DuLichSaPa #SanMay #KhamPhaSaPa";
        } else {
            hashtags = "#LaDoHomestay #SaPa #HomestaySaPa #DuLichSaPa #SanMaySaPa #MuongHoaValley #GocNghiDuong";
        }

        return new HumanizedContentResponse(
                title,
                caption.toString(),
                hashtags,
                cta,
                roomSummary,
                suggestedImages
        );
    }
}
