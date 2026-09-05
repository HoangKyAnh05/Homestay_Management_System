import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Hand,
  Check,
  X,
  Plus,
  Trash2,
  Move,
  Scan,
  RotateCcw,
  Sliders,
  Type,
  Crown,
  Clock,
  Grid,
  Flame,
  Tv
} from 'lucide-react';
import { Scene, MotionEditConfig, MotionWordTag, MotionPresetStyle } from '../types/video';

interface GestureMotionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onSave: (sceneId: string, config: MotionEditConfig) => void;
}

// Tách toàn bộ 100% từ của câu thoại
export function extractFullWordsFromNarration(narration: string): MotionWordTag[] {
  const cleanTokens = (narration || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.,!?;:"'()]/g, ''));

  if (cleanTokens.length === 0) {
    return [{ text: 'ĐIỂM NHẤN', size: 'huge', color: '#facc15', highlight: true }];
  }

  return cleanTokens.map((word, idx) => {
    const isFirst = idx === 0;
    return {
      text: word,
      size: isFirst ? 'huge' : 'large',
      color: isFirst ? '#facc15' : '#ffffff',
      highlight: isFirst
    };
  });
}

export const GestureMotionEditorModal: React.FC<GestureMotionEditorModalProps> = ({
  isOpen,
  onClose,
  scene,
  onSave
}) => {
  if (!isOpen || !scene) return null;

  const initialWords: MotionWordTag[] =
    scene.motionEdit?.words && scene.motionEdit.words.length > 0
      ? scene.motionEdit.words
      : extractFullWordsFromNarration(scene.narration);

  const [enabled, setEnabled] = useState<boolean>(scene.motionEdit?.enabled ?? true);
  const [motionStyle, setMotionStyle] = useState<MotionPresetStyle>(
    scene.motionEdit?.motionStyle ?? 'mrbeast_tycoon'
  );
  const [layerOrder, setLayerOrder] = useState<'behind_person' | 'in_front'>(
    scene.motionEdit?.layerOrder ?? 'behind_person'
  );
  const [showCrownProp, setShowCrownProp] = useState<boolean>(
    scene.motionEdit?.showCrownProp ?? true
  );
  const [showFloatingProps, setShowFloatingProps] = useState<boolean>(
    scene.motionEdit?.showFloatingProps ?? true
  );
  const [showCyberGrid, setShowCyberGrid] = useState<boolean>(
    scene.motionEdit?.showCyberGrid ?? true
  );
  const [words, setWords] = useState<MotionWordTag[]>(initialWords);

  // Nạp lại 100% câu thoại
  const handleReloadFullNarration = () => {
    const full = extractFullWordsFromNarration(scene.narration);
    setWords(full);
  };

  const handleAddWord = () => {
    setWords([...words, { text: 'TỪ MỚI', size: 'large', color: '#ffffff', highlight: false }]);
  };

  const handleRemoveWord = (idx: number) => {
    setWords(words.filter((_, i) => i !== idx));
  };

  const handleUpdateWord = (idx: number, field: keyof MotionWordTag, value: any) => {
    const updated = [...words];
    updated[idx] = { ...updated[idx], [field]: value };
    setWords(updated);
  };

  const handleSaveConfig = () => {
    const newConfig: MotionEditConfig = {
      enabled,
      motionStyle,
      layerOrder: motionStyle === 'netflix_glass' || motionStyle === 'callout_pills' ? 'in_front' : layerOrder,
      gestureMode: 'center_depth',
      fingerAnchor: { x: 50, y: 45 },
      backgroundEffect: 'blur_depth',
      showCrownProp,
      showFloatingProps,
      showCyberGrid,
      words,
      popAnimation: 'spring_bounce'
    };
    onSave(scene.id, newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-yellow-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 border border-yellow-400/50 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Motion Biến Hóa Điện Ảnh Triệu View
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold">
                  CẢNH {scene.order}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                4 phong cách đỉnh cao: MrBeast Tycoon • Golden 3D • Hộp Kính Netflix • Callout Pills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bật / Tắt Motion */}
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
                enabled
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              <span>{enabled ? 'Đang Bật Motion' : 'Đang Tắt Motion'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông báo phụ đề & Reload câu thoại */}
        <div className="px-6 py-2 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {enabled ? (
              <span className="text-yellow-300 font-bold">
                ✓ Đã bật Motion: Phụ đề thường của cảnh này được ẩn để tập trung vào Motion biến hóa đẹp mắt.
              </span>
            ) : (
              <span className="text-gray-400">
                ⚠️ Motion đang tắt: Cảnh này sẽ chạy phụ đề Karaoke thông thường.
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={handleReloadFullNarration}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold underline text-[11px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Nạp Lại Đủ 100% Câu Thoại</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* MỤC 1: CHỌN 1 TRONG 4 PHONG CÁCH TRIỆU VIEW */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>1. Chọn Phong Cách Motion Đỉnh Cao (Theo Video Mẫu):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Preset 1: MrBeast Tycoon (Ảnh 1) */}
              <div
                onClick={() => setMotionStyle('mrbeast_tycoon')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  motionStyle === 'mrbeast_tycoon'
                    ? 'bg-gradient-to-br from-blue-950/60 to-yellow-950/40 border-yellow-400 shadow-xl shadow-yellow-500/10'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <h4 className="text-xs font-black text-white">YOUTUBE TYCOON / MR BEAST</h4>
                  </div>
                  {motionStyle === 'mrbeast_tycoon' && <Check className="w-4 h-4 text-yellow-400" />}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  Lưới Cyber Grid xanh + Chữ 2 tầng khổng lồ (Trắng & Vàng Cam Gradient) sau lưng người + Vương miện vàng hoàng gia.
                </p>
                {/* Visual Preview */}
                <div className="p-2 rounded-xl bg-black/70 border border-blue-500/30 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-white tracking-tight uppercase">CUSTOM YOUTUBE</span>
                  <span className="text-sm font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500">
                    THUMBNAIL 3D
                  </span>
                </div>
              </div>

              {/* Preset 2: Golden 3D Cinematic (Ảnh 2) */}
              <div
                onClick={() => setMotionStyle('golden_cinematic')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  motionStyle === 'golden_cinematic'
                    ? 'bg-gradient-to-br from-amber-950/60 to-blue-950/40 border-amber-400 shadow-xl shadow-amber-500/10'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏰</span>
                    <h4 className="text-xs font-black text-white">GOLDEN 3D CINEMATIC</h4>
                  </div>
                  {motionStyle === 'golden_cinematic' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  Chữ vàng 3D ánh kim kim loại dập nổi (FROM ZERO) + 2 đồng hồ 3D bay uốn lượn 2 bên vai + Rèm ánh sáng sang trọng.
                </p>
                {/* Visual Preview */}
                <div className="p-2 rounded-xl bg-black/70 border border-amber-500/30 flex items-center justify-around">
                  <span className="text-lg">⏰</span>
                  <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 drop-shadow-md">
                    FROM ZERO
                  </span>
                  <span className="text-lg">⏰</span>
                </div>
              </div>

              {/* Preset 3: Netflix Glass (Ảnh 3) */}
              <div
                onClick={() => setMotionStyle('netflix_glass')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  motionStyle === 'netflix_glass'
                    ? 'bg-gradient-to-br from-purple-950/60 to-gray-900 border-cyan-400 shadow-xl shadow-cyan-500/10'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📺</span>
                    <h4 className="text-xs font-black text-white">HỘP KÍNH MỜ NETFLIX</h4>
                  </div>
                  {motionStyle === 'netflix_glass' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  Hộp kính mờ Frosted Glass khổng lồ bo góc ở phía dưới + Chữ in hoa Condensed sắc nét chuẩn phim tài liệu cao cấp.
                </p>
                {/* Visual Preview */}
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                  <span className="text-xs font-black text-white tracking-widest uppercase">
                    HOW TO CREATE ADVANCED MOTION
                  </span>
                </div>
              </div>

              {/* Preset 4: Callout Pills (Ảnh 4) */}
              <div
                onClick={() => setMotionStyle('callout_pills')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  motionStyle === 'callout_pills'
                    ? 'bg-gradient-to-br from-orange-950/60 to-yellow-950/40 border-orange-400 shadow-xl shadow-orange-500/10'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <h4 className="text-xs font-black text-white">VIRAL CALLOUT PILLS</h4>
                  </div>
                  {motionStyle === 'callout_pills' && <Check className="w-4 h-4 text-orange-400" />}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  Các viên thuốc Gradient Cam Neon 3D trôi nổi phát sáng bên cạnh người + Luồng sáng Projector Beam ảo diệu.
                </p>
                {/* Visual Preview */}
                <div className="p-2 rounded-xl bg-black/70 border border-orange-500/30 flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white font-black text-[10px]">
                    🔥 MOTION GFX
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white font-black text-[10px]">
                    📱 MOBILE ??
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MỤC 2: CÁC TÙY CHỌN PHỤ TRỢ (VƯƠNG MIỆN / ĐỒNG HỒ / LƯỚI GRID) */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-gray-300">Phụ Kiện Kỹ Xảo Kèm Theo:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCrownProp}
                  onChange={(e) => setShowCrownProp(e.target.checked)}
                  className="rounded accent-yellow-400"
                />
                <span className="text-gray-300 font-semibold">👑 Vương miện trên đầu</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFloatingProps}
                  onChange={(e) => setShowFloatingProps(e.target.checked)}
                  className="rounded accent-yellow-400"
                />
                <span className="text-gray-300 font-semibold">⏰ 2 Đồng hồ 3D bay 2 bên</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCyberGrid}
                  onChange={(e) => setShowCyberGrid(e.target.checked)}
                  className="rounded accent-yellow-400"
                />
                <span className="text-gray-300 font-semibold">🌐 Lưới Cyber Grid nền</span>
              </label>
            </div>
          </div>

          {/* MỤC 3: QUẢN LÝ TOÀN BỘ TỪ CỦA CÂU THOẠI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Đủ Toàn Bộ Từ Của Phân Đoạn ({words.length} từ):</span>
              </label>
              <button
                type="button"
                onClick={handleAddWord}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-cyan-300 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Thêm Từ Riêng</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {words.map((w, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs flex-wrap transition ${
                    w.highlight
                      ? 'bg-yellow-950/40 border-yellow-500/50 shadow-md'
                      : 'bg-gray-950 border-gray-800'
                  }`}
                >
                  <span className="text-[10px] font-mono text-gray-500 w-5 text-center">{idx + 1}</span>

                  <input
                    type="text"
                    value={w.text}
                    onChange={(e) => handleUpdateWord(idx, 'text', e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-white font-black flex-1 min-w-[110px] focus:outline-none focus:border-yellow-400"
                  />

                  {/* Size Selector */}
                  <select
                    value={w.size}
                    onChange={(e) => handleUpdateWord(idx, 'size', e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-gray-200 font-bold focus:outline-none"
                  >
                    <option value="huge">Cực Đại (Huge)</option>
                    <option value="large">To Đậm (Large)</option>
                    <option value="medium">Vừa (Medium)</option>
                    <option value="small">Nhỏ (Small)</option>
                  </select>

                  {/* Color Picker */}
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={w.color}
                      onChange={(e) => handleUpdateWord(idx, 'color', e.target.value)}
                      className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>

                  {/* Highlight Button */}
                  <button
                    type="button"
                    onClick={() => handleUpdateWord(idx, 'highlight', !w.highlight)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      w.highlight
                        ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/30'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {w.highlight ? '★ TỪ KHÓA CHỦ ĐẠO' : 'Từ thường'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveWord(idx)}
                    className="p-1.5 rounded text-gray-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black text-xs font-black shadow-lg shadow-yellow-500/30 transition transform active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Áp Dụng Phong Cách Motion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
