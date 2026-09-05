import React, { useState } from 'react';
import { Sparkles, Plus, X, Check, Globe, Link, Flame, Zap, Layers, Download, CheckCircle2 } from 'lucide-react';
import { CustomVisualItem, visualStylesService } from '../services/visualStylesService';

interface CreateCustomVisualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newVisual: CustomVisualItem) => void;
}

// 15+ Mẫu Motion GFX Tuyển Chọn từ GitHub & Web Library
const GITHUB_WEB_MOTION_LIBRARY: {
  id: string;
  name: string;
  icon: string;
  badgeText: string;
  source: string;
  layoutType: CustomVisualItem['layoutType'];
  primaryColor: string;
  desc: string;
}[] = [
  {
    id: 'github_rocket_hud',
    name: 'NASA Rocket Launch Hologram',
    icon: '🚀',
    badgeText: '🚀 BỨT PHÁ GIỚI HẠN',
    source: 'GitHub lottie-web/nasa-hud',
    layoutType: 'grid_matrix',
    primaryColor: '#38bdf8',
    desc: 'Hologram công nghệ vũ trụ 3D quét đa chiều'
  },
  {
    id: 'github_cyber_glitch',
    name: 'Cyberpunk Neon Matrix Glitch',
    icon: '⚡',
    badgeText: '⚡ CYBERPUNK 2077',
    source: 'GitHub motion-gfx/cyber-glitch',
    layoutType: 'grid_matrix',
    primaryColor: '#ec4899',
    desc: 'Sóng nhiễu điện tử Neon tương phản mạnh'
  },
  {
    id: 'github_crypto_matrix',
    name: 'Crypto Trading Candlestick',
    icon: '📈',
    badgeText: '📈 TĂNG TRƯỞNG KỶ LỤC',
    source: 'GitHub finance-motion/crypto-rally',
    layoutType: 'custom_card',
    primaryColor: '#22c55e',
    desc: 'Biểu đồ nến Nhật xanh lá bùng nổ lợi nhuận'
  },
  {
    id: 'github_gold_crown',
    name: 'Royal Gold Crown 3D MrBeast',
    icon: '👑',
    badgeText: '👑 HOÀNG GIA ĐỈNH CAO',
    source: 'GitHub youtube-tycoon/crown-prop',
    layoutType: 'crown_prop',
    primaryColor: '#facc15',
    desc: 'Vương miện vàng hoàng gia phát sáng lơ lửng trên đầu'
  },
  {
    id: 'github_floating_clocks',
    name: 'Dual 3D Floating Clocks',
    icon: '⏰',
    badgeText: '⏰ TẬP TRUNG THỜI GIAN',
    source: 'GitHub cinematic-motion/floating-clocks',
    layoutType: 'floating_props',
    primaryColor: '#22c55e',
    desc: '2 Chiếc đồng hồ 3D bay uốn lượn nhịp nhàng 2 bên vai'
  },
  {
    id: 'github_netflix_glass',
    name: 'Netflix 4K Frosted Glass',
    icon: '📺',
    badgeText: '🎬 PHIM TÀI LIỆU NETFLIX',
    source: 'GitHub documentary-cards/netflix-frosted',
    layoutType: 'frosted_glass',
    primaryColor: '#06b6d4',
    desc: 'Hộp kính mờ Glassmorphism sang trọng chuẩn rạp phim'
  },
  {
    id: 'github_viral_fire_pills',
    name: 'Viral Fire Callout Pills',
    icon: '🔥',
    badgeText: '🔥 ĐIỂM NHẤN QUAN TRỌNG',
    source: 'GitHub tiktok-viral/callout-pills',
    layoutType: 'callout_pills',
    primaryColor: '#f97316',
    desc: 'Viên thuốc Gradient Cam Neon 3D phát sáng rực rỡ'
  },
  {
    id: 'github_tiktok_heart_dm',
    name: 'Viral TikTok DM Heart Pop',
    icon: '💬',
    badgeText: '💬 INBOX TRIỆU TIM',
    source: 'Web LottieFiles/tiktok-dm-pop',
    layoutType: 'custom_card',
    primaryColor: '#f43f5e',
    desc: 'Bong bóng chat nổ tim viral tương tác cực cao'
  },
  {
    id: 'github_gold_trophy',
    name: 'Level Up Gold Trophy Pop',
    icon: '🏆',
    badgeText: '🏆 CHIẾN THẮNG TUYỆT ĐỐI',
    source: 'GitHub gamification-ui/trophy-unlocked',
    layoutType: 'crown_prop',
    primaryColor: '#eab308',
    desc: 'Cúp vàng 3D bung nảy chúc mừng thành tựu'
  },
  {
    id: 'github_breaking_news',
    name: 'Breaking News Ticker Banner',
    icon: '📰',
    badgeText: '🔴 TIN NÓNG ĐẶC BIỆT',
    source: 'Web Broadcast/breaking-news-ticker',
    layoutType: 'frosted_glass',
    primaryColor: '#ef4444',
    desc: 'Dải băng tin tức trực tiếp phong cách đài truyền hình'
  },
  {
    id: 'github_formula1_speed',
    name: 'Formula 1 Speed Blur',
    icon: '🏎️',
    badgeText: '🏎️ BỨT TỐC THẦN TỐC',
    source: 'GitHub remotion-racing/f1-speed',
    layoutType: 'custom_card',
    primaryColor: '#ef4444',
    desc: 'Vệt xe đua cao tốc lướt đêm xé gió'
  },
  {
    id: 'github_airplane_takeoff',
    name: 'Sky Flight Aviation Wings',
    icon: '✈️',
    badgeText: '✈️ VƯƠN TẦM THẾ GIỚI',
    source: 'GitHub aviation-gfx/takeoff-3d',
    layoutType: 'custom_card',
    primaryColor: '#0284c7',
    desc: 'Máy bay vút bay xuyên qua những tầng mây'
  }
];

export const CreateCustomVisualModal: React.FC<CreateCustomVisualModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom' | 'import_link'>('library');

  // Custom Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('👑');
  const [badgeText, setBadgeText] = useState('');
  const [layoutType, setLayoutType] = useState<CustomVisualItem['layoutType']>('crown_prop');
  const [primaryColor, setPrimaryColor] = useState('#facc15');

  // Import Link State
  const [motionUrl, setMotionUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  if (!isOpen) return null;

  // 1. Thêm từ thư viện có sẵn (GitHub & Web)
  const handleSelectFromLibrary = (item: typeof GITHUB_WEB_MOTION_LIBRARY[0]) => {
    const created = visualStylesService.addCustom({
      name: item.name,
      icon: item.icon,
      badgeText: item.badgeText,
      layoutType: item.layoutType,
      primaryColor: item.primaryColor
    });
    onCreated(created);
    onClose();
  };

  // 2. Tự tạo kiểu riêng
  const handleSaveCustom = () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên kiểu trình diễn!');
      return;
    }

    const created = visualStylesService.addCustom({
      name: name.trim(),
      icon,
      badgeText: badgeText.trim() || `${icon} ${name.trim().toUpperCase()}`,
      layoutType,
      primaryColor
    });

    onCreated(created);
    onClose();
  };

  // 3. Nhập từ link GitHub/Lottie Web
  const handleImportLink = () => {
    if (!motionUrl.trim()) {
      alert('Vui lòng dán đường link Motion JSON hoặc Lottie URL!');
      return;
    }

    const title = linkTitle.trim() || 'Custom Web Motion';
    const created = visualStylesService.addCustom({
      name: title,
      icon: '🌐',
      badgeText: `🌐 ${title.toUpperCase()}`,
      layoutType: 'grid_matrix',
      primaryColor: '#38bdf8'
    });

    onCreated(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-indigo-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Thư Viện Motion GFX Trực Tuyến & Tự Tạo</h3>
              <p className="text-xs text-gray-400">
                Lấy từ các thư viện Motion nổi tiếng trên GitHub, LottieFiles, Web hoặc tự tạo không giới hạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-gray-950 border-b border-gray-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-4 font-black transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'library'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Kho Thư Viện GitHub & Web ({GITHUB_WEB_MOTION_LIBRARY.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-4 font-black transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tự Sáng Tạo Kiểu Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_link')}
            className={`pb-3 px-4 font-black transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'import_link'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Dán Link Motion (GitHub / Lottie)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: KHO THƯ VIỆN GITHUB & WEB */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Chọn bất kỳ kiểu trình diễn nào bên dưới để thêm ngay vào video của bạn:</span>
                <span className="text-[11px] font-mono text-cyan-400">Nguồn: GitHub & LottieFiles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {GITHUB_WEB_MOTION_LIBRARY.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFromLibrary(item)}
                    className="p-3.5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between gap-2.5 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                          {item.source.split('/')[0]}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-400 group-hover:underline">
                        + Thêm kiểu này
                      </span>
                      <Download className="w-3 h-3 text-gray-500 group-hover:text-indigo-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TỰ TẠO KIỂU RIÊNG */}
          {activeTab === 'custom' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Tên kiểu trình diễn:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Vương Miện Hoàng Gia 3D, Hộp Kính Netflix..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Icon biểu tượng:</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="VD: 👑, ⏰, 🔥, 💎..."
                  className="w-24 bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-center text-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Bố cục kỹ xảo (Layout Style):</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'crown_prop', label: '👑 Vương Miện 3D Trên Đầu', desc: 'Vương miện hoàng gia lơ lửng' },
                    { id: 'floating_props', label: '⏰ Đồ Vật 3D Bay 2 Bên', desc: 'Đồng hồ hoặc biểu tượng bay' },
                    { id: 'frosted_glass', label: '📺 Hộp Kính Mờ Điện Ảnh', desc: 'Glassmorphism chuẩn phim rạp' },
                    { id: 'callout_pills', label: '🔥 Viên Thuốc Neon Nổi Bật', desc: 'Thẻ bài trôi nổi phát sáng' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLayoutType(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        layoutType === item.id
                          ? 'bg-indigo-950/60 border-indigo-400 text-white'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className="font-extrabold text-xs block text-white">{item.label}</span>
                      <span className="text-[10px] text-gray-500">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Huy hiệu tiêu đề:</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="VD: 👑 HOÀNG GIA NỔI BẬT"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
                >
                  Lưu & Áp Dụng Kiểu Trình Diễn Này
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DÁN LINK TỪ GITHUB / WEB */}
          {activeTab === 'import_link' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 leading-relaxed">
                💡 <b>Mẹo tải thêm Motion từ GitHub / Web:</b> Bạn có thể copy link file raw JSON animation từ bất kỳ repository GitHub Motion hoặc link hoạt họa LottieFiles trên web và dán vào đây để nạp thêm kiểu trình diễn không giới hạn.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Tên kiểu trình diễn:
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="VD: Hologram Radar Sci-Fi, Neon Cyber Burst..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Đường link Motion (GitHub Raw URL / LottieFiles URL):
                </label>
                <input
                  type="url"
                  value={motionUrl}
                  onChange={(e) => setMotionUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../animation.json hoặc https://assets.lottiefiles.com/..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleImportLink}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
                >
                  📥 Tải & Nạp Kiểu Motion Này Vào App
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
