import React, { useState } from 'react';
import { Sparkles, Check, X, Dices, Layers, Wand2 } from 'lucide-react';
import { Scene } from '../types/video';
import { TYPOGRAPHY_LAYOUT_PRESETS, TypographyLayoutPreset } from '../remotion/typography/layoutPresets';
import { TYPOGRAPHY_EFFECT_PRESETS, TypographyEffectPreset } from '../remotion/typography/motionEffects';

interface MotionTypographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onApply: (sceneId: string, layoutId: string, effectId: string) => void;
  onApplyAll?: (layoutId: string, effectId: string) => void;
}

export const MotionTypographyModal: React.FC<MotionTypographyModalProps> = ({
  isOpen,
  onClose,
  scene,
  onApply,
  onApplyAll
}) => {
  if (!isOpen || !scene) return null;

  const [activeTab, setActiveTab] = useState<'layout' | 'effect'>('layout');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(
    scene.motionTypographyLayout || TYPOGRAPHY_LAYOUT_PRESETS[0].id
  );
  const [selectedEffectId, setSelectedEffectId] = useState<string>(
    scene.motionTypographyEffect || TYPOGRAPHY_EFFECT_PRESETS[0].id
  );

  const [layoutCategory, setLayoutCategory] = useState<string>('all');
  const [effectCategory, setEffectCategory] = useState<string>('all');

  // Lọc Layout
  const filteredLayouts = TYPOGRAPHY_LAYOUT_PRESETS.filter(
    (l) => layoutCategory === 'all' || l.category === layoutCategory
  );

  // Lọc Effect
  const filteredEffects = TYPOGRAPHY_EFFECT_PRESETS.filter(
    (e) => effectCategory === 'all' || e.category === effectCategory
  );

  // Nút Ngẫu Nhiên Hóa
  const handleRandomize = () => {
    const randomLayout = TYPOGRAPHY_LAYOUT_PRESETS[Math.floor(Math.random() * TYPOGRAPHY_LAYOUT_PRESETS.length)];
    const randomEffect = TYPOGRAPHY_EFFECT_PRESETS[Math.floor(Math.random() * TYPOGRAPHY_EFFECT_PRESETS.length)];
    setSelectedLayoutId(randomLayout.id);
    setSelectedEffectId(randomEffect.id);
  };

  const handleConfirm = () => {
    onApply(scene.id, selectedLayoutId, selectedEffectId);
    onClose();
  };

  const handleConfirmAll = () => {
    if (onApplyAll) {
      onApplyAll(selectedLayoutId, selectedEffectId);
    }
    handleConfirm();
  };

  const currentLayout = TYPOGRAPHY_LAYOUT_PRESETS.find((l) => l.id === selectedLayoutId);
  const currentEffect = TYPOGRAPHY_EFFECT_PRESETS.find((e) => e.id === selectedEffectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Kho 100 Kiểu Sắp Xếp & 100 Hiệu Ứng Chữ Motion 3D
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  PRO KINETIC
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Tự do biến hóa vị trí trước/sau vật thể và phong cách xuất hiện bùng nổ theo nhịp lời nói
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/40 text-amber-300 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
              title="Bốc ngẫu nhiên 1 cặp Bố Cục + Hiệu Ứng bất ngờ"
            >
              <Dices className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>🎲 Đổi Kiểu Ngẫu Nhiên</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thanh Tóm Tắt Lựa Chọn Đang Chọn */}
        <div className="px-6 py-2.5 bg-gray-950/70 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Bố Cục Đang Chọn:</span>
              <span className="font-extrabold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1">
                <span>{currentLayout?.icon}</span>
                <span>{currentLayout?.name}</span>
              </span>
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Hiệu Ứng Xuất Hiện:</span>
              <span className="font-extrabold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/40 flex items-center gap-1">
                <span>{currentEffect?.icon}</span>
                <span>{currentEffect?.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2 Tabs Chuyển Đổi */}
        <div className="px-6 pt-3 bg-gray-900 border-b border-gray-800 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`pb-3 text-xs font-black border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'layout'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>📐 100 Kiểu Sắp Xếp Vị Trí Chữ</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-mono">
              {TYPOGRAPHY_LAYOUT_PRESETS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('effect')}
            className={`pb-3 text-xs font-black border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'effect'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>✨ 100 Hiệu Ứng Động & Xuất Hiện</span>
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-300 font-mono">
              {TYPOGRAPHY_EFFECT_PRESETS.length}
            </span>
          </button>
        </div>

        {/* Danh Sách Lựa Chọn */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'layout' ? (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'horizontal', label: '➡️ Hàng Ngang (Trái ➜ Phải)' },
                  { id: 'geometric', label: '🏛️ Hình Khối' },
                  { id: 'anatomy', label: '👤 Bám Cơ Thể' },
                  { id: 'chaotic', label: '🌪️ Hỗn Loạn Đa Chiều' },
                  { id: 'creator', label: '👑 Triệu View MrBeast' },
                  { id: 'icons', label: '🔥 Icon & Sticker' },
                  { id: 'niche', label: '💻 Nghề Nghiệp' },
                  { id: 'physics', label: '⚡ Động Lực Học' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLayoutCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      layoutCategory === cat.id
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Layout Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredLayouts.map((preset) => {
                  const isSelected = selectedLayoutId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedLayoutId(preset.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                          : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{preset.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <h4 className="text-xs font-black text-white">{preset.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">{preset.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tất Cả (100 FX)' },
                  { id: 'spring', label: '⚡ Bung Nảy Lò Xo' },
                  { id: 'kinetic', label: '🏎️ Tốc Độ Lướt' },
                  { id: 'digital', label: '👾 Hacker Glitch' },
                  { id: 'radiance', label: '💡 Neon Rực Sáng' },
                  { id: 'depth3d', label: '🎲 3D Không Gian' },
                  { id: 'art', label: '🖍️ Bút Dạ & Con Dấu' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEffectCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      effectCategory === cat.id
                        ? 'bg-cyan-500 text-black shadow-md font-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Effect Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredEffects.map((preset) => {
                  const isSelected = selectedEffectId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedEffectId(preset.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/30'
                          : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{preset.icon}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <h4 className="text-xs font-black text-white">{preset.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">{preset.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Hủy
          </button>

          <div className="flex items-center gap-3">
            {onApplyAll && (
              <button
                type="button"
                onClick={handleConfirmAll}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-200 hover:text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-md"
                title="Đồng bộ kiểu xếp chữ và hiệu ứng này cho toàn bộ các phân cảnh trong video"
              >
                <span>✨ Áp Dụng Cho TẤT CẢ Phân Cảnh</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Cho Cảnh Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
