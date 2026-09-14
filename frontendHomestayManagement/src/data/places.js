/**
 * PLACES & HOMESTAY DATA SOURCE
 * Lá Đỏ Homestay & Coffee - Explore Around Sa Pa
 * 
 * Central config for easy updates, maintenance, or CMS/Admin integration.
 */

export const HOMESTAY_LOCATION = {
  id: 'lado-homestay-sapa',
  name: 'Lá Đỏ Homestay & Coffee',
  brandTitle: 'Lá Đỏ',
  brandSubtitle: 'HOMESTAY & COFFEE',
  address: '31A Hoàng Liên, Thị xã Sa Pa, Lào Cai, Việt Nam',
  lat: 22.3338,
  lng: 103.8442,
  phone: '0941 186 699',
  email: 'ladohomestay@gmail.com',
  rating: 4.95,
  reviewCount: 480,
  bookingUrl: '/rooms',
  image: '/landing/images/sapa_real/la_do_homestay_real.jpg',
  description: 'Nơi chạm đến sương mây ngàn Hoàng Liên Sơn, kết nối trọn vẹn văn hóa bản địa Sa Pa trong không gian bình yên và ấm cúng.'
};

export const PLACE_CATEGORIES = [
  { id: 'tat-ca', label: 'Tất cả', icon: 'grid', color: '#881337' },
  { id: 'an-uong', label: 'Ăn uống', icon: 'utensils', color: '#e11d48' },
  { id: 'cafe', label: 'Cafe', icon: 'coffee', color: '#92400e' },
  { id: 'vui-choi', label: 'Vui chơi', icon: 'sparkles', color: '#ea580c' },
  { id: 'tham-quan', label: 'Tham quan', icon: 'map-pin', color: '#7c3aed' },
  { id: 'mua-sam', label: 'Mua sắm', icon: 'shopping-bag', color: '#db2777' },
  { id: 'thien-nhien', label: 'Thiên nhiên', icon: 'trees', color: '#059669' },
  { id: 'khac', label: 'Khác', icon: 'more-horizontal', color: '#475569' },
];

export const ITINERARY_VIBES = [
  { id: 'all', label: '🌟 Tất cả lịch trình', icon: 'compass' },
  { id: 'theo-buoi', label: '🌅 Theo buổi trong ngày', icon: 'clock' },
  { id: 'san-may', label: '📸 Săn mây & Check-in', icon: 'camera' },
  { id: 'food-tour', label: '🍲 Food Tour Tây Bắc', icon: 'utensils' },
  { id: 'trekking', label: '🏃 Bản làng & Trekking', icon: 'mountain' },
  { id: 'healing', label: '💑 Cặp đôi & Chữa lành', icon: 'heart' },
];

export const PLACES_DATA = [
  {
    id: 'nha-tho-da',
    name: 'Nhà thờ Đá Sa Pa',
    category: 'tham-quan',
    categoryName: 'Tham quan · Kiến trúc cổ',
    latitude: 22.3346,
    longitude: 103.8409,
    image: '/home_3/image_3.jpg',
    gallery: ['/home_3/image_3.jpg', '/home_1/image_2.jpg'],
    rating: 4.7,
    reviewCount: 1200,
    description: 'Nhà thờ Đá Sa Pa là một trong những công trình kiến trúc cổ kính và nổi tiếng nhất tại thị trấn Sa Pa, mang đậm dấu ấn lịch sử và văn hóa Pháp cổ thời thuộc địa.',
    tags: ['Điểm tham quan', 'Kiến trúc cổ', 'Check-in biểu tượng'],
    openingHours: '06:00 - 21:00 hàng ngày',
    pinColor: '#7c3aed',
    featured: true,
  },
  {
    id: 'quang-truong-sa-pa',
    name: 'Quảng trường Sa Pa',
    category: 'tham-quan',
    categoryName: 'Tham quan · Chụp ảnh',
    latitude: 22.3341,
    longitude: 103.8415,
    image: '/home_4/image_1.jpg',
    gallery: ['/home_4/image_1.jpg', '/home_3/image_3.jpg'],
    rating: 4.5,
    reviewCount: 962,
    description: 'Nằm ngay trung tâm thị xã Sa Pa, quảng trường là nơi diễn ra các hoạt động giao lưu văn hóa, chợ tình truyền thống và là điểm dạo mát lý tưởng vào buổi tối.',
    tags: ['Tham quan', 'Chụp ảnh', 'Chợ tình cuối tuần'],
    openingHours: 'Mở cửa cả ngày (24/7)',
    pinColor: '#059669',
    featured: true,
  },
  {
    id: 'sun-world-fansipan',
    name: 'Sun World Fansipan Legend',
    category: 'vui-choi',
    categoryName: 'Vui chơi · Cáp treo',
    latitude: 22.3275,
    longitude: 103.8290,
    image: '/banner.png',
    gallery: ['/banner.png', '/landing/images/sapa_real/fansipan_peak.jpg'],
    rating: 4.6,
    reviewCount: 2300,
    description: 'Quần thể văn hóa tâm linh và hệ thống cáp treo đạt nhiều kỷ lục thế giới đưa du khách chinh phục đỉnh Fansipan hùng vĩ chỉ trong 15 phút ngắm trọn thung lũng mây.',
    tags: ['Vui chơi', 'Cáp treo', 'Công viên giải trí'],
    openingHours: '07:30 - 17:30 hàng ngày',
    pinColor: '#ea580c',
    featured: true,
  },
  {
    id: 'fansipan-peak',
    name: 'Đỉnh Fansipan 3.143 m',
    category: 'thien-nhien',
    categoryName: 'Thiên nhiên · Nóc nhà Đông Dương',
    latitude: 22.3033,
    longitude: 103.7753,
    image: '/landing/images/sapa_real/sapa_fansipan_peak.jpg',
    gallery: ['/landing/images/sapa_real/sapa_fansipan_peak.jpg', '/landing/images/sapa_real/sapa_fansipan_buddha.jpg'],
    rating: 4.9,
    reviewCount: 3100,
    description: 'Cột mốc 3.143m tại nóc nhà Đông Dương – nơi du khách có thể chạm tay vào biển mây bồng bềnh và chiêm bái đại tượng Phật A Di Đà bằng đồng lớn nhất Việt Nam.',
    tags: ['Thiên nhiên', 'Biển mây', 'Chinh phục độ cao'],
    openingHours: '08:00 - 17:00 hàng ngày',
    pinColor: '#0f766e',
    featured: true,
  },
  {
    id: 'cho-sa-pa',
    name: 'Chợ Sa Pa',
    category: 'mua-sam',
    categoryName: 'Mua sắm · Đặc sản',
    latitude: 22.3385,
    longitude: 103.8488,
    image: '/landing/images/sapa_real/am_thuc_tay_bac.jpg',
    gallery: ['/landing/images/sapa_real/am_thuc_tay_bac.jpg'],
    rating: 4.3,
    reviewCount: 1100,
    description: 'Thiên đường đặc sản Tây Bắc với các loại quả rừng, nấm hương, thịt trâu gác bếp, hạt dẻ nóng hổi và đồ thổ cẩm thủ công tinh xảo của đồng bào H\'Mông, Dao đỏ.',
    tags: ['Mua sắm', 'Đặc sản Tây Bắc', 'Thổ cẩm thủ công'],
    openingHours: '06:00 - 19:00 hàng ngày',
    pinColor: '#e11d48',
    featured: true,
  },
  {
    id: 'thung-lung-muong-hoa',
    name: 'Thung lũng Mường Hoa',
    category: 'thien-nhien',
    categoryName: 'Thiên nhiên · Ruộng bậc thang',
    latitude: 22.2980,
    longitude: 103.8745,
    image: '/landing/images/sapa_real/sapa_la_do_muong_hoa.jpg',
    gallery: ['/landing/images/sapa_real/sapa_la_do_muong_hoa.jpg', '/landing/images/sapa_real/la_do_muong_hoa_train.jpg'],
    rating: 4.8,
    reviewCount: 1500,
    description: 'Thung lũng ruộng bậc thang tuyệt đẹp trải dài bên dòng suối Hoa uốn lượn, bãi đá cổ huyền bí được xếp hạng di tích quốc gia đặc biệt.',
    tags: ['Tham quan', 'Thiên nhiên', 'Ruộng bậc thang vàng'],
    openingHours: 'Mở cửa cả ngày (khuyên đi ban ngày)',
    pinColor: '#059669',
    featured: true,
  },
  {
    id: 'ban-cat-cat',
    name: 'Bản Cát Cát',
    category: 'tham-quan',
    categoryName: 'Tham quan · Văn hóa bản địa',
    latitude: 22.3292,
    longitude: 103.8305,
    image: '/landing/images/sapa_real/sapa_cat_cat_village.jpg',
    gallery: ['/landing/images/sapa_real/sapa_cat_cat_village.jpg', '/landing/images/sapa_real/sapa_cat_cat_waterfall.jpg'],
    rating: 4.6,
    reviewCount: 2400,
    description: 'Ngôi làng cổ của người H\'Mông nằm e ấp dưới chân dãy Hoàng Liên Sơn, nổi tiếng với guồng nước khổng lồ, thác Cát Cát và các nếp nhà gỗ truyền thống.',
    tags: ['Tham quan', 'Văn hóa bản địa', 'Thác nước'],
    openingHours: '07:00 - 18:00 hàng ngày',
    pinColor: '#059669',
    featured: true,
  },
  {
    id: 'cafe-the-haven',
    name: 'Quán cafe The Haven',
    category: 'cafe',
    categoryName: 'Cafe · View đẹp',
    latitude: 22.3298,
    longitude: 103.8375,
    image: '/landing/images/sapa_real/la_do_cafe_balcony.jpg',
    gallery: ['/landing/images/sapa_real/la_do_cafe_balcony.jpg'],
    rating: 4.6,
    reviewCount: 703,
    description: 'Tọa lạc trên ngọn đồi Vọng Cảnh với tầm nhìn 360 độ ôm trọn thung lũng mây Cát Cát, đây là điểm dừng chân thưởng thức cà phê và ngắm hoàng hôn tuyệt đẹp.',
    tags: ['Cafe', 'View đẹp', 'Săn mây'],
    openingHours: '07:00 - 22:00 hàng ngày',
    pinColor: '#92400e',
    featured: true,
  },
  {
    id: 'cafe-viet-trekking',
    name: 'Viettrekking Coffee Sa Pa',
    category: 'cafe',
    categoryName: 'Cafe · View thung lũng mây',
    latitude: 22.3315,
    longitude: 103.8428,
    image: '/home_2/image_2.jpg',
    gallery: ['/home_2/image_2.jpg'],
    rating: 4.7,
    reviewCount: 1100,
    description: 'Quán cafe nổi tiếng nằm trên đường Hoàng Liên (rất gần Lá Đỏ), nơi ngắm trọn chuyến tàu hỏa leo núi đỏ rực băng qua thung lũng Mường Hoa.',
    tags: ['Cafe', 'View tàu hỏa leo núi', 'Gần Lá Đỏ'],
    openingHours: '06:30 - 22:30 hàng ngày',
    pinColor: '#92400e',
    featured: true,
  },
  {
    id: 'nha-hang-o-quy-ho',
    name: 'Nhà hàng Ô Quý Hồ',
    category: 'an-uong',
    categoryName: 'Ăn uống · Ẩm thực Tây Bắc',
    latitude: 22.3355,
    longitude: 103.8420,
    image: '/home_5/image_2.jpg',
    gallery: ['/home_5/image_2.jpg'],
    rating: 4.7,
    reviewCount: 850,
    description: 'Nhà hàng ẩm thực Tây Bắc trứ danh với món gà nướng tiêu rừng, lẩu gà đen lá é và các món rau rừng xào tỏi chuẩn vị bản địa Sa Pa.',
    tags: ['Ẩm thực bản địa', 'Gà nướng tiêu rừng', 'Lẩu ấm cúng'],
    openingHours: '09:00 - 22:30 hàng ngày',
    pinColor: '#e11d48',
    featured: true,
  },
  {
    id: 'nha-hang-ca-hoi-vua',
    name: 'Nhà hàng Cá Hồi Vua Sa Pa',
    category: 'an-uong',
    categoryName: 'Ăn uống · Cá hồi & Cá tầm',
    latitude: 22.3370,
    longitude: 103.8460,
    image: '/landing/images/sapa_real/sapa_bbq_hotpot.jpg',
    gallery: ['/landing/images/sapa_real/sapa_bbq_hotpot.jpg'],
    rating: 4.5,
    reviewCount: 620,
    description: 'Chuyên các món tươi ngon chế biến từ cá hồi Sa Pa nuôi trên thác nguồn: sashimi cá hồi, lẩu cá tầm măng chua, cá nướng muối ớt hạt dổi.',
    tags: ['Cá hồi Sa Pa', 'Lẩu cá tầm', 'Hải sản suối lạnh'],
    openingHours: '08:30 - 22:00 hàng ngày',
    pinColor: '#e11d48',
    featured: false,
  },
  {
    id: 'ho-sa-pa',
    name: 'Hồ Sa Pa',
    category: 'thien-nhien',
    categoryName: 'Thiên nhiên · Hồ trung tâm',
    latitude: 22.3372,
    longitude: 103.8436,
    image: '/home_1/image.png',
    gallery: ['/home_1/image.png'],
    rating: 4.5,
    reviewCount: 980,
    description: 'Mặt hồ phẳng lặng phản chiếu bóng núi Hàm Rồng và những dãy biệt thự phong cách châu Âu, thích hợp đi dạo thư thái vào sáng sớm hoặc chiều tà.',
    tags: ['Dạo mát ven hồ', 'Chụp ảnh', 'Thư giãn'],
    openingHours: 'Mở cửa cả ngày (24/7)',
    pinColor: '#0f766e',
    featured: false,
  },
  {
    id: 'cho-dem-sa-pa',
    name: 'Chợ đêm Sa Pa',
    category: 'mua-sam',
    categoryName: 'Mua sắm & Ẩm thực đêm',
    latitude: 22.3392,
    longitude: 103.8502,
    image: '/landing/images/sapa_real/sapa_bbq_hotpot.jpg',
    gallery: ['/landing/images/sapa_real/sapa_bbq_hotpot.jpg'],
    rating: 4.4,
    reviewCount: 1300,
    description: 'Không gian rực rỡ sắc màu về đêm với các quầy xiên que nướng thơm lừng, xôi ngũ sắc, ngô nướng than hồng và quà lưu niệm thủ công độc đáo.',
    tags: ['Đồ nướng Sa Pa', 'Chợ đêm', 'Sôi động'],
    openingHours: '18:00 - 23:30 (Đông nhất cuối tuần)',
    pinColor: '#db2777',
    featured: false,
  }
];

export const ITINERARIES_DATA = [
  {
    id: 'buoi-sang',
    vibe: 'theo-buoi',
    title: 'Buổi Sáng: Đón Bình Minh & Dạo Phố Cổ',
    subtitle: 'Ngắm biển mây, cafe thung lũng & ghé thăm Nhà thờ Đá',
    timeRange: '7h00 - 11h30',
    duration: '~4.5 giờ',
    distance: '~3.2 km',
    transport: 'Đi bộ hoặc Xe máy',
    estimatedCost: '~80.000đ - 180.000đ/người',
    bestTime: 'Bình minh 06:30 - 08:30',
    image: '/landing/images/sapa_real/la_do_cafe_balcony.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay & Coffee', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Điểm xuất phát 31A Hoàng Liên, đón sương sớm' },
      { name: 'Cafe Viettrekking Sa Pa', googleQuery: 'Viettrekking Coffee Sa Pa, 33 Hoàng Liên, Sa Pa', lat: 22.3315, lng: 103.8428, icon: 'coffee', note: 'Thưởng thức cafe sáng ngắm biển mây & tàu hỏa leo núi' },
      { name: 'Nhà thờ Đá Sa Pa', googleQuery: 'Nhà thờ Đá Sa Pa, Phường Sa Pa, Sa Pa', lat: 22.3346, lng: 103.8409, icon: 'map-pin', note: 'Check-in kiến trúc Pháp cổ kính' },
      { name: 'Chợ Sa Pa', googleQuery: 'Chợ Sa Pa, Sa Pa, Lào Cai', lat: 22.3385, lng: 103.8488, icon: 'shopping-bag', note: 'Mua sắm đặc sản mận, đào & hạt dẻ nóng hổi' }
    ],
    summary: 'Khởi đầu ngày mới tràn đầy năng lượng với ly cafe ngắm trọn biển mây Mường Hoa từ ban công, check-in Nhà thờ Đá biểu tượng và dạo quanh chợ Sa Pa nhộn nhịp.'
  },
  {
    id: 'buoi-chieu',
    vibe: 'theo-buoi',
    title: 'Buổi Chiều: Chinh Phục Nóc Nhà Đông Dương',
    subtitle: 'Trải nghiệm Cáp treo Fansipan 3.143m & Quảng trường',
    timeRange: '12h30 - 17h30',
    duration: '~5.0 giờ',
    distance: '~8.5 km',
    transport: 'Taxi / Xe máy + Cáp treo',
    estimatedCost: '~850.000đ - 1.100.000đ/người (gồm vé cáp)',
    bestTime: 'Trưa & Chiều 13:00 - 16:30',
    image: '/landing/images/sapa_real/sapa_fansipan_peak.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Xuất phát đi ga cáp treo Fansipan Legend' },
      { name: 'Ga Cáp Treo Fansipan Legend', googleQuery: 'Sun World Fansipan Legend, Đường Nguyễn Chí Thanh, Sa Pa', lat: 22.3275, lng: 103.8290, icon: 'sparkles', note: 'Đi cáp treo băng qua thung lũng mây Hoàng Liên' },
      { name: 'Đỉnh Fansipan 3.143m', googleQuery: 'Đỉnh Fansipan, Sa Pa, Lào Cai', lat: 22.3033, lng: 103.7753, icon: 'mountain', note: 'Chạm tay vào cột mốc Nóc nhà Đông Dương' },
      { name: 'Quảng trường Sa Pa', googleQuery: 'Quảng trường Sa Pa, Sa Pa, Lào Cai', lat: 22.3341, lng: 103.8415, icon: 'map-pin', note: 'Dạo mát chiều tà ngắm phố núi lên đèn' }
    ],
    summary: 'Trải nghiệm cáp treo ngắm toàn cảnh thung lũng Hoàng Liên Sơn kỳ vĩ, chiêm bái đại tượng Phật A Di Đà và chạm tay vào đỉnh Fansipan 3.143m huyền thoại.'
  },
  {
    id: 'buoi-toi',
    vibe: 'theo-buoi',
    title: 'Buổi Tối: Ẩm Thực Tây Bắc & Phố Đêm Sương Mờ',
    subtitle: 'Nồi lẩu cá tầm nóng hổi, thịt xiên nướng & dạo bờ hồ',
    timeRange: '18h00 - 22h30',
    duration: '~4.5 giờ',
    distance: '~2.8 km',
    transport: 'Đi bộ dạo phố',
    estimatedCost: '~200.000đ - 450.000đ/người',
    bestTime: 'Tối 18:30 - 21:30',
    image: '/landing/images/sapa_real/sapa_bbq_hotpot.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Khởi hành từ phòng nghỉ 31A Hoàng Liên' },
      { name: 'Nhà hàng Ô Quý Hồ', googleQuery: 'Nhà hàng Ô Quý Hồ, 08 Thạch Sơn, Sa Pa', lat: 22.3355, lng: 103.8420, icon: 'utensils', note: 'Thưởng thức gà nướng tiêu rừng & lẩu cá tầm ấm cúng' },
      { name: 'Dạo mát Hồ Sa Pa', googleQuery: 'Hồ Sa Pa, Sa Pa, Lào Cai', lat: 22.3372, lng: 103.8436, icon: 'sparkles', note: 'Tận hưởng cái lạnh ngọt ngào bên mặt hồ lung linh' },
      { name: 'Chợ đêm Sa Pa - Phố nướng', googleQuery: 'Chợ đêm Sa Pa, Đường Điện Biên Phủ, Sa Pa', lat: 22.3392, lng: 103.8502, icon: 'shopping-bag', note: 'Ăn đồ nướng than hồng, xôi ngũ sắc & mua quà' }
    ],
    summary: 'Tận hưởng cái lạnh se se ngọt ngào của Sa Pa bên nồi lẩu cá tầm nghi ngút khói, dạo quanh hồ nước phẳng lặng và thưởng thức đồ nướng than hồng thơm lừng.'
  },
  {
    id: 'san-may-song-ao',
    vibe: 'san-may',
    title: 'Săn Mây & Check-in Sống Ảo Triệu View',
    subtitle: 'Tọa độ săn biển mây đỉnh cao & ngắm tàu hỏa đỏ rực',
    timeRange: '06h00 - 11h00',
    duration: '~5.0 giờ',
    distance: '~4.2 km',
    transport: 'Đi bộ & Xe máy',
    estimatedCost: '~150.000đ - 300.000đ/người',
    bestTime: 'Sáng sớm 06:00 - 09:00',
    image: '/landing/images/sapa_real/la_do_muong_hoa_train.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay Ban Công', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Săn mây ngay tại phòng ngủ & bồn tắm kính' },
      { name: 'Viettrekking Coffee Sa Pa', googleQuery: 'Viettrekking Coffee Sa Pa, 33 Hoàng Liên, Sa Pa', lat: 22.3315, lng: 103.8428, icon: 'coffee', note: 'Bắt trọn khoảnh khắc tàu hỏa leo núi đỏ chạy qua' },
      { name: 'Bản Cát Cát (Thác Tiên Sa)', googleQuery: 'Bản Cát Cát, Sa Pa, Lào Cai', lat: 22.3292, lng: 103.8305, icon: 'sparkles', note: 'Thuê váy thổ cẩm chụp ảnh guồng nước khổng lồ' },
      { name: 'The Haven Sapa Camp Site', googleQuery: 'The Haven Sapa Camp Site, Đồi Vọng Cảnh, Sa Pa', lat: 22.3298, lng: 103.8375, icon: 'coffee', note: 'Ngắm thung lũng mây 360 độ từ đồi Vọng Cảnh' }
    ],
    summary: 'Cung đường check-in sống ảo đẹp nhất Sa Pa: thức giấc cùng biển mây tràn vào phòng tại Lá Đỏ, chụp ảnh đoàn tàu Mường Hoa và hóa thân thành thiếu nữ vùng cao tại Cát Cát.'
  },
  {
    id: 'food-tour-tay-bac',
    vibe: 'food-tour',
    title: 'Food Tour: Ẩm Thực Tây Bắc Trứ Danh',
    subtitle: 'Trọn vẹn hương vị lẩu cá tầm, gà nướng hạt dổi & đồ nướng',
    timeRange: '11h00 - 21h30',
    duration: '~10 giờ',
    distance: '~5.5 km',
    transport: 'Đi bộ & Xe máy',
    estimatedCost: '~350.000đ - 650.000đ/người',
    bestTime: 'Trưa & Tối',
    image: '/landing/images/sapa_real/am_thuc_tay_bac.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Khởi hành tour ẩm thực Tây Bắc' },
      { name: 'Cốn Sủi Ông Há', googleQuery: 'Cốn Sủi Ông Há, 591 Điện Biên Phủ, Sa Pa', lat: 22.3346, lng: 103.8409, icon: 'utensils', note: 'Bữa sáng cốn sủi gia truyền nức tiếng phố núi' },
      { name: 'Nhà hàng Cá Hồi Vua Sa Pa', googleQuery: 'Nhà hàng Cá Hồi Vua Sa Pa, 039 Xuân Viên, Sa Pa', lat: 22.3370, lng: 103.8460, icon: 'utensils', note: 'Bữa trưa lẩu cá tầm măng chua cay & gỏi cá hồi tươi rói' },
      { name: 'Nhà hàng Ô Quý Hồ Sa Pa', googleQuery: 'Nhà hàng Ô Quý Hồ, 08 Thạch Sơn, Sa Pa', lat: 22.3355, lng: 103.8420, icon: 'utensils', note: 'Bữa tối gà đen nướng tiêu rừng ướp mắc khén thơm lừng' },
      { name: 'Chợ đêm Sa Pa - Phố đồ nướng', googleQuery: 'Chợ đêm Sa Pa, Đường Điện Biên Phủ, Sa Pa', lat: 22.3392, lng: 103.8502, icon: 'shopping-bag', note: 'Tráng miệng hạt dẻ nướng bơ & thịt xiên que nướng than hoa' }
    ],
    summary: 'Hành trình đánh thức vị giác với toàn bộ tinh hoa ẩm thực Tây Bắc: từ cá tầm suối lạnh, gà đồi nướng than hoa đến cốn sủi phố cổ và đồ nướng than hồng.'
  },
  {
    id: 'trekking-ban-lang',
    vibe: 'trekking',
    title: 'Khám Phá & Trekking Bản Làng Nguyên Bản',
    subtitle: 'Dạo bước ruộng bậc thang Mường Hoa, Tả Van & thác nước',
    timeRange: '08h00 - 16h00',
    duration: '~8.0 giờ',
    distance: '~12.0 km',
    transport: 'Xe máy hoặc Trekking đi bộ',
    estimatedCost: '~250.000đ - 450.000đ/người',
    bestTime: 'Cả ngày (mùa lúa chín hoặc mùa nước đổ)',
    image: '/landing/images/sapa_real/sapa_cat_cat_village.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Chuẩn bị giày trekking & nước uống xuất phát' },
      { name: 'Bản Cát Cát', googleQuery: 'Bản Cát Cát, Sa Pa, Lào Cai', lat: 22.3292, lng: 103.8305, icon: 'sparkles', note: 'Chiêm ngưỡng nếp nhà gỗ H\'Mông và cầu mây' },
      { name: 'Thung lũng Mường Hoa', googleQuery: 'Thung lũng Mường Hoa, Hầu Thào, Sa Pa', lat: 22.2980, lng: 103.8745, icon: 'trees', note: 'Ngắm ruộng bậc thang di sản & bãi đá cổ' },
      { name: 'Trở về Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Thư giãn ngâm chân nước nóng lá thảo dược' }
    ],
    summary: 'Cung đường trekking hòa mình vào thiên nhiên hoang sơ, lắng nghe tiếng suối reo giữa thung lũng Mường Hoa và trải nghiệm văn hóa bản địa mộc mạc.'
  },
  {
    id: 'healing-cap-doi',
    vibe: 'healing',
    title: 'Cặp Đôi & Chữa Lành Thư Thái (Healing Retreat)',
    subtitle: 'Tắm khoáng thảo dược Dao Đỏ, trà chiều & ngắm hoàng hôn',
    timeRange: '14h00 - 21h00',
    duration: '~7.0 giờ',
    distance: '~3.0 km',
    transport: 'Đi bộ thư thái & Taxi',
    estimatedCost: '~400.000đ - 700.000đ/người',
    bestTime: 'Chiều & Tối',
    image: '/landing/images/sapa_real/tam_la_thuoc_dao_do.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Nghỉ ngơi tại phòng gỗ thông view thung lũng' },
      { name: 'Tắm lá thuốc Dao Đỏ', googleQuery: 'Tắm lá thuốc Dao Đỏ Lý Dao, Sa Pa, Lào Cai', lat: 22.3360, lng: 103.8430, icon: 'sparkles', note: 'Đả thông kinh mạch, xua tan căng thẳng mệt mỏi' },
      { name: 'The Haven Sapa Camp Site', googleQuery: 'The Haven Sapa Camp Site, Đồi Vọng Cảnh, Sa Pa', lat: 22.3298, lng: 103.8375, icon: 'coffee', note: 'Trà chiều ngắm hoàng hôn nhuộm vàng thung lũng' },
      { name: 'Tiệc BBQ Ban Công Lá Đỏ', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'utensils', note: 'Set up tiệc nướng BBQ riêng tư ban công' }
    ],
    summary: 'Kỳ nghỉ chữa lành tâm hồn dành riêng cho các cặp đôi: ngâm mình trong bồn gỗ Pơ-mu thảo dược quý giá, ngắm hoàng hôn buông xuống thung lũng và thưởng thức bữa tối riêng tư ấm cúng.'
  },
  {
    id: 'chi-co-3-tieng',
    vibe: 'theo-buoi',
    title: 'Lộ Trình Nhanh: Chỉ Có 3 Tiếng Tại Sa Pa',
    subtitle: 'Lộ trình tinh gọn 1km xuất phát ngay cửa Lá Đỏ',
    timeRange: 'Bất kỳ 3 giờ trong ngày',
    duration: '~3.0 giờ',
    distance: '~1.8 km',
    transport: '100% Đi bộ thư thái',
    estimatedCost: '~50.000đ - 120.000đ/người',
    bestTime: 'Bất kỳ thời điểm nào',
    image: '/landing/images/sapa_real/la_do_homestay_real.jpg',
    stops: [
      { name: 'Lá Đỏ Homestay', googleQuery: 'Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa', lat: 22.3338, lng: 103.8442, icon: 'home', note: 'Xuất phát từ 31A Hoàng Liên' },
      { name: 'Nhà thờ Đá Sa Pa', googleQuery: 'Nhà thờ Đá Sa Pa, Phường Sa Pa, Sa Pa', lat: 22.3346, lng: 103.8409, icon: 'map-pin', note: 'Chụp ảnh lưu niệm kiến trúc cổ (5 phút đi bộ)' },
      { name: 'Quảng trường Sa Pa', googleQuery: 'Quảng trường Sa Pa, Sa Pa, Lào Cai', lat: 22.3341, lng: 103.8415, icon: 'map-pin', note: 'Dạo quanh trung tâm ngắm phố' },
      { name: 'Viettrekking Coffee Sa Pa', googleQuery: 'Viettrekking Coffee Sa Pa, 33 Hoàng Liên, Sa Pa', lat: 22.3315, lng: 103.8428, icon: 'coffee', note: 'Thưởng thức cafe view tàu hỏa leo núi ngắm mây' }
    ],
    summary: 'Lộ trình ngắn tối ưu cho du khách có ít thời gian: di chuyển hoàn toàn bằng đi bộ trong bán kính 1km từ Lá Đỏ, không lo tắc đường hay mệt mỏi.'
  }
];

/**
 * Generate Google Maps Multi-Stop Navigation URL with real verified location queries
 */
export function getGoogleMapsMultiStopUrl(stops = []) {
  if (!stops || stops.length === 0) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent('Lá Đỏ Homestay, 31A Hoàng Liên, Sa Pa, Lào Cai');
  }

  // Deduplicate consecutive identical destinations and format exact query
  const formattedQueries = [];
  stops.forEach((s) => {
    const q = s.googleQuery || (s.name.includes('Sa Pa') ? s.name : `${s.name}, Sa Pa, Lào Cai`);
    if (formattedQueries.length === 0 || formattedQueries[formattedQueries.length - 1] !== q) {
      formattedQueries.push(q);
    }
  });

  if (formattedQueries.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedQueries[0])}&travelmode=driving`;
  }

  const origin = encodeURIComponent(formattedQueries[0]);
  const destination = encodeURIComponent(formattedQueries[formattedQueries.length - 1]);
  
  const midStops = formattedQueries.slice(1, formattedQueries.length - 1);
  if (midStops.length === 0) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  }

  const waypoints = midStops.map(q => encodeURIComponent(q)).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

/**
 * Generate a direct Google Maps search URL for an individual venue / stop
 */
export function getGoogleMapsPlaceUrl(stop) {
  if (!stop) return 'https://www.google.com/maps';
  const query = typeof stop === 'string' 
    ? stop 
    : (stop.googleQuery || (stop.name && stop.name.includes('Sa Pa') ? stop.name : `${stop.name || ''}, Sa Pa, Lào Cai`));
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

