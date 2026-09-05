package com.homestayManagement.homestayManagement.service.impl;

import com.homestayManagement.homestayManagement.dto.request.TravelArticleRequest;
import com.homestayManagement.homestayManagement.dto.response.TravelArticleResponse;
import com.homestayManagement.homestayManagement.entity.TravelArticle;
import com.homestayManagement.homestayManagement.repository.TravelArticleRepository;
import com.homestayManagement.homestayManagement.service.TravelArticleService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelArticleServiceImpl implements TravelArticleService {

    private final TravelArticleRepository travelArticleRepository;

    @PostConstruct
    @Transactional
    public void initDefaultArticles() {
        try {
            if (travelArticleRepository.count() == 0) {
                log.info("Initializing 4 default Sapa travel review articles...");
                seedDefaultArticles();
            }
        } catch (Exception e) {
            log.warn("Could not seed default travel articles: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TravelArticleResponse> getPublicActiveArticles() {
        return travelArticleRepository.findByIsActiveTrueOrderBySortOrderAscIdAsc()
                .stream()
                .map(TravelArticleResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TravelArticleResponse getArticleByIdOrKey(String idOrKey) {
        TravelArticle article = null;
        try {
            Long id = Long.parseLong(idOrKey);
            article = travelArticleRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (article == null) {
            article = travelArticleRepository.findByArticleKey(idOrKey)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết: " + idOrKey));
        }

        return TravelArticleResponse.fromEntity(article);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TravelArticleResponse> getAllArticlesForAdmin() {
        return travelArticleRepository.findAllByOrderBySortOrderAscIdAsc()
                .stream()
                .map(TravelArticleResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public TravelArticleResponse createArticle(TravelArticleRequest request) {
        String key = request.getArticleKey();
        if (key == null || key.isBlank()) {
            key = generateSlug(request.getTitle());
        }

        TravelArticle article = TravelArticle.builder()
                .articleKey(key)
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .tag(request.getTag())
                .category(request.getCategory())
                .readTime(request.getReadTime())
                .author(request.getAuthor())
                .dateTag(request.getDateTag())
                .coverImageUrl(request.getCoverImageUrl())
                .rating(request.getRating())
                .location(request.getLocation())
                .distance(request.getDistance())
                .bestTime(request.getBestTime())
                .cost(request.getCost())
                .highlightsJson(request.getHighlightsJson())
                .intro(request.getIntro())
                .sectionsJson(request.getSectionsJson())
                .homestayAdvice(request.getHomestayAdvice())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        TravelArticle saved = travelArticleRepository.save(article);
        return TravelArticleResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public TravelArticleResponse updateArticle(Long id, TravelArticleRequest request) {
        TravelArticle article = travelArticleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết ID: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            article.setTitle(request.getTitle());
        }
        if (request.getSubtitle() != null) article.setSubtitle(request.getSubtitle());
        if (request.getTag() != null) article.setTag(request.getTag());
        if (request.getCategory() != null) article.setCategory(request.getCategory());
        if (request.getReadTime() != null) article.setReadTime(request.getReadTime());
        if (request.getAuthor() != null) article.setAuthor(request.getAuthor());
        if (request.getDateTag() != null) article.setDateTag(request.getDateTag());
        if (request.getCoverImageUrl() != null) article.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getRating() != null) article.setRating(request.getRating());
        if (request.getLocation() != null) article.setLocation(request.getLocation());
        if (request.getDistance() != null) article.setDistance(request.getDistance());
        if (request.getBestTime() != null) article.setBestTime(request.getBestTime());
        if (request.getCost() != null) article.setCost(request.getCost());
        if (request.getHighlightsJson() != null) article.setHighlightsJson(request.getHighlightsJson());
        if (request.getIntro() != null) article.setIntro(request.getIntro());
        if (request.getSectionsJson() != null) article.setSectionsJson(request.getSectionsJson());
        if (request.getHomestayAdvice() != null) article.setHomestayAdvice(request.getHomestayAdvice());
        if (request.getSortOrder() != null) article.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) article.setIsActive(request.getIsActive());

        TravelArticle saved = travelArticleRepository.save(article);
        return TravelArticleResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteArticle(Long id) {
        if (!travelArticleRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy bài viết ID: " + id);
        }
        travelArticleRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TravelArticleResponse toggleArticleStatus(Long id) {
        TravelArticle article = travelArticleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết ID: " + id));
        article.setIsActive(!Boolean.TRUE.equals(article.getIsActive()));
        return TravelArticleResponse.fromEntity(travelArticleRepository.save(article));
    }

    private String generateSlug(String input) {
        if (input == null) return "article-" + System.currentTimeMillis();
        String slug = input.toLowerCase().replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", "-");
        if (slug.isBlank()) return "article-" + System.currentTimeMillis();
        return slug;
    }

    private void seedDefaultArticles() {
        travelArticleRepository.save(TravelArticle.builder()
                .articleKey("bien-may-hoang-lien")
                .title("Săn Biển Mây Hoàng Liên Sơn & Đỉnh Đèo Ô Quy Hồ: Tọa Độ Ngắm Hoàng Hôn Đỉnh Cao Sa Pa")
                .subtitle("Hành trình vượt ngàn mây trắng, chiêm ngưỡng khoảnh khắc bình minh và hoàng hôn kỳ vĩ bậc nhất vùng Tây Bắc.")
                .tag("Bình Minh • 05:45 AM")
                .category("Săn Mây & Check-in")
                .readTime("5 phút đọc")
                .author("Lá Đỏ Travel Editorial")
                .dateTag("Mùa Săn Mây 2026")
                .coverImageUrl("/landing/images/check-in-canh-dep/8-dia-diem-check-in-dep-quen-sau-o-hoa-binh-image-exa0-1720971802-683-width780height439.jpg")
                .rating("4.9 ★ (1,280+ đánh giá)")
                .location("Đỉnh Đèo Ô Quy Hồ & Cổng Trời Sa Pa, ranh giới Lào Cai - Lai Châu")
                .distance("Cách Lá Đỏ Homestay khoảng 14km (khoảng 25 phút đi xe máy/taxi)")
                .bestTime("05:30 - 07:00 (Bình minh mây tràn) và 16:45 - 18:00 (Hoàng hôn nhuộm vàng)")
                .cost("Vé tham quan Cổng Trời: 80.000đ - 100.000đ/người (Tự do ngắm đèo miễn phí)")
                .highlightsJson("[\"Top 4 con đèo hùng vĩ và hiểm trở bậc nhất Việt Nam\",\"Tầm nhìn panorama 360 độ ôm trọn thung lũng mây Hoàng Liên\",\"Quán cà phê săn mây trên đỉnh núi với xích đu vô cực sống ảo\",\"Thưởng thức thịt xiên nướng than hồng, cơm lam nướng và trà gừng ấm nóng\"]")
                .intro("Nếu hỏi đâu là khoảnh khắc làm xiêu lòng bất kỳ kẻ lữ hành nào khi đến Sa Pa, câu trả lời chắc chắn là giây phút đứng trên đỉnh đèo Ô Quy Hồ nhìn từng đợt sóng mây trắng muốt cuộn trào qua những khe núi đá vôi hùng vĩ. Được mệnh danh là 'Vua của tứ đại đỉnh đèo' miền Bắc, nơi đây không chỉ mang vẻ đẹp hoang sơ kỳ bí mà còn là tọa độ săn hoàng hôn tráng lệ nhất xứ sở sương mù.")
                .sectionsJson("[{\"heading\":\"1. Thời Điểm Vàng Săn Biển Mây Trong Ngày\",\"content\":\"Khoảng thời gian từ tháng 9 đến tháng 3 năm sau là 'mùa vàng săn mây' tại Sa Pa. Vào lúc 5:45 sáng, khi nhiệt độ thung lũng còn đẫm hơi sương và mặt trời bắt đầu nhô lên sau dãy Hoàng Liên Sơn, biển mây dày đặc bắt đầu dâng cao như thác lũ, tràn qua từng sườn dốc quanh co.\\n\\nVào buổi chiều tà (khoảng 17:15 - 17:45), bầu trời chuyển từ sắc cam rực sang tím thẫm lãng mạn. Toàn bộ thung lũng phía dưới biến thành đại dương mây bồng bềnh, phản chiếu những vạt nắng cuối ngày đẹp đến ngỡ ngàng.\",\"tip\":\"Mẹo săn mây: Hãy theo dõi dự báo thời tiết từ hôm trước. Những ngày có độ ẩm cao ban đêm và nắng nhẹ vào ban ngày sẽ có tỷ lệ mây dày đặc lên đến 95%.\"},{\"heading\":\"2. Trải Nghiệm Ăn Chơi & Check-in Không Thể Bỏ Lỡ\",\"content\":\"Dọc theo sườn đèo có rất nhiều điểm dừng chân độc đáo với các góc chụp 'triệu view':\\n\\n• Cổng Trời Sa Pa & Quán Cà Phê Mây: Nơi sở hữu các tiểu cảnh như xích đu vô cực, cầu kính ngắm biển mây, bậc thang lên thiên đường.\\n• Các lán nướng ven đèo mộc mạc: Ngồi quây quần bên bếp than củi rực hồng, hít hà mùi thơm của ngô nếp nướng mỡ hành, trứng nướng lòng đào và những xiên thịt lợn bản cuốn cải mèo cay nồng chấm muối ớt Mường Khương.\\n• Thưởng thức tách trà gừng sả quế ấm lòng giữa cơn gió se lạnh của vùng cao Tây Bắc.\",\"tip\":\"Nhiệt độ trên đèo Ô Quy Hồ luôn thấp hơn trung tâm Sa Pa từ 3 - 5°C và gió khá mạnh, bạn nhớ mang theo áo khoác ấm, khăn quàng cổ và găng tay.\"},{\"heading\":\"3. Ẩm Thực Đặc Sản Quanh Khu Vực Đèo Ô Quy Hồ\",\"content\":\"Sau chuyến săn mây, trên đường trở về, bạn nhất định phải ghé các quán ven đường để thưởng thức:\\n\\n• Gà nướng mắc khén than hoa chấm chẩm chéo thơm phức.\\n• Cơm lam ngũ sắc ống tre dẻo ngọt chấm muối lạc vừng.\\n• Trâu gác bếp xé sợi nhắm cùng ly rượu ngô Bản Phố ủ men lá.\",\"tip\":\"Giá các món nướng tại đây rất bình dân: xiên nướng từ 15.000đ - 25.000đ, cơm lam 15.000đ/ống.\"}]")
                .homestayAdvice("Từ Lá Đỏ Homestay, bạn có thể thuê xe máy ngay tại quầy lễ tân (chỉ 120.000đ - 150.000đ/ngày) hoặc nhờ homestay gọi taxi trọn gói khứ hồi với mức giá ưu đãi dành riêng cho khách lưu trú. Nhân viên Lá Đỏ sẽ chuẩn bị sẵn nước ấm và bình giữ nhiệt để bạn mang theo trên đường săn mây sáng sớm.")
                .sortOrder(1)
                .isActive(true)
                .build());

        travelArticleRepository.save(TravelArticle.builder()
                .articleKey("cau-go-suoi-mo")
                .title("Khám Phá Cầu Gỗ Bên Suối Mơ Bản Cát Cát: Bản Làng Cổ Đẹp Như Tranh Vẽ")
                .subtitle("Dạo bước trên cây cầu gỗ mộc mạc bắc qua dòng suối Tiên Sa trong vắt, lắng nghe khúc ca róc rách của đại ngàn.")
                .tag("Suối Ngầm Tự Nhiên")
                .category("Văn Hóa Bản Làng")
                .readTime("4 phút đọc")
                .author("Lá Đỏ Travel Editorial")
                .dateTag("Cập nhật 2026")
                .coverImageUrl("/landing/images/check-in-canh-dep/images-1.jpg")
                .rating("4.8 ★ (950+ đánh giá)")
                .location("Bản Cát Cát, xã San Sả Hồ, Sa Pa, Lào Cai")
                .distance("Cách Lá Đỏ Homestay chỉ 2.8km (khoảng 8 phút đi xe máy)")
                .bestTime("08:30 - 11:00 sáng hoặc 14:00 - 16:30 chiều (ánh sáng rực rỡ len qua suối)")
                .cost("Vé vào cổng Bản Cát Cát: 150.000đ/người lớn, 70.000đ/trẻ em")
                .highlightsJson("[\"Bản làng cổ của người H'Mông với kiến trúc nhà gỗ lợp ván pơ-mu\",\"Cầu gỗ mộc mạc vắt ngang dòng suối Tiên Sa và thác nước trắng xóa\",\"Hệ thống cối xay nước khổng lồ bằng tre quay đều theo dòng chảy\",\"Thuê váy thổ cẩm truyền thống hóa thân thành cô gái chàng trai miền sơn cước\"]")
                .intro("Nằm nép mình dưới chân dãy Hoàng Liên Sơn, bản Cát Cát từ lâu đã trở thành biểu tượng văn hóa của Sa Pa. Giữa thung lũng xanh mướt, cây cầu gỗ bắc ngang suối Mơ và dòng thác Cát Cát rì rào như một nét chấm phá thơ mộng, đưa du khách lạc bước vào không gian cổ tích của những câu chuyện tình người H'Mông xưa cũ.")
                .sectionsJson("[{\"heading\":\"1. Cung Đường Dạo Bộ Lãng Mạn Ven Suối Tiên Sa\",\"content\":\"Bước chân qua cổng bản, bạn sẽ men theo những bậc đá bậc thang dẫn xuống thung lũng. Càng đi sâu, tiếng suối reo càng rõ rệt. Cây cầu gỗ nối hai bờ suối được ghép từ những thân cây cổ thụ mộc mạc, hai bên bờ hoa cúc họa mi và hoa tam giác mạch khoe sắc quanh năm.\\n\\nĐứng trên cầu, bạn có thể ngắm nhìn đàn cá bơi lội dưới làn nước trong vắt nhìn thấy đáy, cảm nhận từng làn gió mát lạnh từ đỉnh Fansipan thổi tràn về thung lũng.\",\"tip\":\"Nên mang giày thể thao hoặc giày bệt có độ ma sát tốt vì đường đá dốc thoai thoải có thể hơi trơn sau những cơn mưa sương.\"},{\"heading\":\"2. Hóa Thân Thành Đồng Bào Bản Địa & Sống Ảo Triệu View\",\"content\":\"Một trong những trải nghiệm được du khách yêu thích nhất tại Cát Cát là thuê trang phục dân tộc:\\n\\n• Hàng chục tiệm cho thuê trang phục H'Mông, Dao đỏ, Thái với phụ kiện vòng bạc, dù che, gùi hoa lộng lẫy (giá chỉ 50.000đ - 100.000đ/bộ).\\n• Điểm chụp ảnh đẹp nhất: Cầu gỗ suối Mơ, guồng nước tre khổng lồ, võng mây tổ chim ven suối và trước những gian nhà dệt thổ cẩm cổ truyền.\\n• Thưởng thức tiết mục múa khèn, nhảy sạp rộn rã tại nhà văn hóa trung tâm bản Cát Cát.\",\"tip\":\"Nên thuê trang phục có tông màu đỏ, cam hoặc vàng đồng để nổi bật giữa nền xanh của rừng cây và suối đá.\"},{\"heading\":\"3. Ẩm Thực Khó Quên Tại Bản Cát Cát\",\"content\":\"Tại các chòi nghỉ ven suối, bạn sẽ được thưởng thức:\\n\\n• Thịt lợn cắp nách quay bì giòn tan thơm mùi hạt dổi, thảo quả.\\n• Lẩu cá tầm nước lạnh Sa Pa ăn cùng rau mầm đá và ngọn su su xanh giòn.\\n• Bánh ngô (Pó pổ) nướng dẻo thơm và kẹo táo mèo chua ngọt thanh mát.\",\"tip\":\"Bạn có thể ghé quán Cà phê Nhà Của Mị hoặc Haven Camp Site ngay gần lối ra của bản để ngắm trọn thung lũng từ trên cao.\"}]")
                .homestayAdvice("Sau một buổi sáng đi bộ khám phá bản làng Cát Cát, hãy quay trở về Lá Đỏ Homestay thưởng thức bữa trưa nóng hổi và trải nghiệm bồn ngâm khoáng nóng thảo dược người Dao Đỏ ngay tại homestay để thư giãn cơ bắp tuyệt đối.")
                .sortOrder(2)
                .isActive(true)
                .build());

        travelArticleRepository.save(TravelArticle.builder()
                .articleKey("tra-quan-rung-truc")
                .title("Thưởng Trà Shan Tuyết Giữa Rừng Trúc Bạt Ngàn: Chốn Thiền Định Thanh Tịnh")
                .subtitle("Tách biệt hoàn toàn khỏi phố thị ồn ào, tìm về sự an yên tĩnh lặng bên tách trà Shan Tuyết cổ thụ 300 năm.")
                .tag("Không Gian Thiền Định")
                .category("Thư Giãn & Trà Đạo")
                .readTime("4 phút đọc")
                .author("Lá Đỏ Travel Editorial")
                .dateTag("Mùa Thu Đông 2026")
                .coverImageUrl("/landing/images/check-in-canh-dep/images-2.jpg")
                .rating("5.0 ★ (620+ đánh giá)")
                .location("Rừng Trúc & Đồi Chè Ô Long, đường đèo hướng Tả Van - Mường Hoa")
                .distance("Cách Lá Đỏ Homestay 4.5km (khoảng 12 phút di chuyển)")
                .bestTime("09:00 - 11:30 sáng hoặc 15:00 - 17:00 chiều lúc hoàng hôn buông")
                .cost("Thưởng trà & ngắm cảnh: 45.000đ - 90.000đ/người")
                .highlightsJson("[\"Không gian trà quán gỗ mộc nằm lọt thỏm giữa rừng trúc xanh mướt ngút ngàn\",\"Trà Shan Tuyết cổ thụ ngàn năm được pha bằng nguồn nước suối nguồn thanh khiết\",\"Tiếng gió vi vu qua tán trúc hòa cùng thanh âm chuông gió thiền định\",\"Trải nghiệm văn hóa trà đạo Wabi-sabi tương đồng với triết lý của Lá Đỏ Homestay\"]")
                .intro("Giữa nhịp sống hối hả, có một nơi tại Sa Pa mà thời gian dường như ngưng đọng: quán trà nhỏ ẩn mình giữa bạt ngàn rừng trúc xanh rợp bóng. Được thiết kế theo phong cách Wabi-sabi tối giản với vật liệu tre nứa và gỗ thông tự nhiên, nơi đây là thiên đường cho những ai mong muốn tìm kiếm một nốt lặng cho tâm hồn, hít thở bầu không khí ngát hương thảo mộc.")
                .sectionsJson("[{\"heading\":\"1. Hương Vị Trà Shan Tuyết Cổ Thụ Đệ Nhất Tây Bắc\",\"content\":\"Đến đây, bạn sẽ được thưởng thức những búp trà Shan Tuyết cổ thụ được đồng bào thu hái từ những cây chè hàng trăm năm tuổi mọc tự nhiên trên vách đá mù sương Hoàng Liên Sơn.\\n\\nTrà được ủ và pha bằng nước suối nguồn đun trên bếp than củi thơm mùi gỗ thông. Nước trà vàng óng như mật ong rừng, nhấp một ngụm đầu thấy chan chát nhẹ nơi đầu lưỡi, nhưng ngay sau đó là vị ngọt hậu thanh tao đọng lại sâu trong cuống họng suốt cả giờ đồng hồ.\",\"tip\":\"Hãy thử dùng kèm trà với bánh hạt dẻ Sa Pa hoặc ô mai mận tam hoa để hương vị trà được tôn lên trọn vẹn nhất.\"},{\"heading\":\"2. Chữa Lành Thân Tâm Trong Không Gian Tĩnh Mịch\",\"content\":\"Ngồi trên sàn gỗ mộc, hướng mắt qua ô cửa sổ kính rộng mở nhìn ra rừng trúc đu đưa theo gió:\\n\\n• Đọc một cuốn sách yêu thích trong tiếng nước suối róc rách và tiếng chim hót lảnh lót.\\n• Hít thở sâu làn không khí chứa đầy ion âm thanh khiết giúp giải tỏa mọi căng thẳng mệt mỏi.\\n• Chụp những bức ảnh mang phong cách hoài niệm, cổ phong cực kỳ nghệ thuật.\",\"tip\":\"Khung giờ chiều từ 15:30 trở đi có ánh nắng xiên qua kẽ trúc tạo thành những luồng sáng 'Tyndall effect' vô cùng ảo diệu.\"},{\"heading\":\"3. Đặc Sản & Món Ăn Nhẹ Nên Thử\",\"content\":\"Ngoài trà đạo, quán còn phục vụ các món ăn nhẹ dân dã:\\n\\n• Bánh dày nướng mè đen dẻo quánh chấm mật ong rừng nguyên chất.\\n• Hạt dẻ rừng Sa Pa rang bơ bùi ngậy, thơm nức mũi.\\n• Trà táo mèo quế hồi ấm bụng, xua tan cái lạnh mùa đông.\",\"tip\":\"Bạn có thể mua những túi trà Shan Tuyết búp tôm đóng gói thủ công về làm quà biếu người thân đầy ý nghĩa.\"}]")
                .homestayAdvice("Tại Lá Đỏ Homestay, chúng tôi cũng dành riêng một gian trà đạo view thung lũng phục vụ miễn phí cho khách lưu trú. Bạn có thể nhờ lễ tân chỉ đường tắt đi qua bản Tả Van đến thẳng rừng trúc này mà không cần đi vòng đường lớn.")
                .sortOrder(3)
                .isActive(true)
                .build());

        travelArticleRepository.save(TravelArticle.builder()
                .articleKey("anh-nang-rung-thong")
                .title("Săn Ánh Nắng Komorebi Rừng Thông Sa Pa: Tọa Độ Nhiếp Ảnh Mê Hoặc Lòng Người")
                .subtitle("Hiện tượng ánh sáng mặt trời huyền ảo xuyên qua kẽ lá thông già trong buổi hoàng hôn tĩnh mịch nơi núi rừng.")
                .tag("Hoàng Hôn • 17:30 PM")
                .category("Nhiếp Ảnh & Sống Ảo")
                .readTime("5 phút đọc")
                .author("Lá Đỏ Travel Editorial")
                .dateTag("Mùa Săn Nắng 2026")
                .coverImageUrl("/landing/images/check-in-canh-dep/images.jpg")
                .rating("4.9 ★ (1,150+ đánh giá)")
                .location("Đồi thông ven triền núi Hàm Rồng & Thung lũng Mường Hoa, Sa Pa")
                .distance("Cách Lá Đỏ Homestay chỉ 1.2km (có thể đi bộ dạo mát 10 phút)")
                .bestTime("16:30 - 18:00 chiều (Ánh hoàng hôn xiên góc vàng óng rực rỡ nhất)")
                .cost("Miễn phí tham quan & chụp ảnh tự do")
                .highlightsJson("[\"Rừng thông cổ thụ xanh ngát trải dài thoai thoải theo triền dốc\",\"Hiện tượng quang học Komorebi: tia nắng vàng xuyên qua sương chiều mờ ảo\",\"Con đường mòn gỗ mộc và thảm cỏ kim thông lãng mạn tựa trời Âu\",\"Điểm ngắm hoàng hôn buông xuống thung lũng Mường Hoa lộng lẫy\"]")
                .intro("Trong tiếng Nhật, 'Komorebi' là từ tuyệt đẹp dùng để miêu tả khoảnh khắc những vạt nắng mặt trời lọc qua kẽ lá cây rừng, nhảy múa trên nền đất ẩm. Tại Sa Pa, không nơi nào thể hiện rõ nét vẻ đẹp diệu kỳ này bằng những đồi thông cổ thụ ôm trọn lấy sườn đồi Lá Đỏ Homestay khi ánh tà dương buông xuống.")
                .sectionsJson("[{\"heading\":\"1. Khoảnh Khắc Nhiếp Ảnh Triệu View Mùa Hoàng Hôn\",\"content\":\"Vào mỗi buổi chiều tà, mặt trời hạ thấp dần về phía rặng Fansipan, chiếu những luồng sáng vàng óng như mật xuyên qua tán lá thông kim và lớp sương mây lơ lửng.\\n\\nToàn bộ không gian được nhuộm một màu vàng ấm áp, tạo nên chiều sâu không gian huyền ảo. Chỉ cần giơ máy lên ở bất kỳ góc nào, bạn cũng sẽ bắt trọn được những bức ảnh chân dung thơ mộng, lãng mạn như những thước phim điện ảnh Hong Kong hay phim tài liệu nghệ thuật.\",\"tip\":\"Khuyên chụp: Sử dụng chế độ chụp ngược sáng hoặc chụp chân dung với khẩu độ lớn (f/1.8 - f/2.8) để bắt trọn hiệu ứng bokeh lấp lánh của tia nắng.\"},{\"heading\":\"2. Trải Nghiệm Đi Dạo & Cắm Trại Dã Ngoại (Picnic)\",\"content\":\"Rừng thông có địa hình dốc thoải, thảm cỏ sạch sẽ với mùi hương tinh dầu thông tự nhiên dễ chịu:\\n\\n• Mang theo thảm trải dã ngoại, một giỏ trái cây, bánh ngọt và bình trà nóng để thưởng thức cùng bạn bè, người thương.\\n• Tận hưởng cảm giác bình yên khi nghe tiếng lá thông reo trong gió chiều se lạnh.\\n• Ngắm đoàn tàu hỏa leo núi Mường Hoa màu đỏ tươi thong dong chạy ngang sườn thung lũng phía xa xa.\",\"tip\":\"Hãy giữ gìn vệ sinh chung, không xả rác và không đốt lửa trại tự phát để bảo vệ rừng thông xanh.\"},{\"heading\":\"3. Thiên Đường Ẩm Thực Đêm Quanh Khu Vực\",\"content\":\"Khi màn đêm buông xuống và rừng thông chìm vào tĩnh mịch, bạn có thể dạo bước về trung tâm thị xã:\\n\\n• Ghé chợ đêm Sa Pa thưởng thức dạ dày nướng cay, nấm đông cô nướng phô mai, bánh tráng nướng trứng giòn rụm.\\n• Nhâm nhi nồi lẩu gà đen hầm sâm dây hoặc thắng cố truyền thống xua tan cái rét ban đêm.\\n• Tạt vào một quán pub acoustic mộc mạc làm một ly cocktail ngâm rượu táo mèo thơm lừng.\",\"tip\":\"Đừng quên thử món hạt dẻ nướng mật ong béo ngậy được bán nóng hổi dọc đường phố Sa Pa.\"}]")
                .homestayAdvice("Khu vực rừng thông này nằm ngay sát vách Lá Đỏ Homestay! Bạn chỉ cần bước ra khỏi cổng homestay khoảng vài bước chân là đã chạm vào không gian rừng thông bạt ngàn. Homestay có sẵn giỏ mây picnic và đạo cụ chụp ảnh xinh xắn để khách mượn chụp ảnh hoàn toàn miễn phí.")
                .sortOrder(4)
                .isActive(true)
                .build());
    }
}
