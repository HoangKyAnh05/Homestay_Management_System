import React, { useState, useRef, useEffect } from 'react';
import { Scene, ElementPosition } from '../types/video';
import { getTikTokTemplateById } from '../remotion/tiktok/tiktokTemplates';
import { getTikTokTextEffectById } from '../remotion/tiktok/tiktokTextEffects';
import { getTikTokStickerById } from '../remotion/tiktok/tiktokStickers';
import { getTikTokVideoEffectById } from '../remotion/tiktok/tiktokEffects';
import {
  Move,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Edit3,
  Check,
  RotateCcw as ResetIcon,
  Type,
  X,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface InteractiveCanvasOverlayProps {
  scene: Scene;
  aspectRatio: '9:16' | '16:9' | '1:1';
  onUpdatePositions: (sceneId: string, positions: Record<string, ElementPosition>) => void;
  onUpdateNarration?: (sceneId: string, text: string) => void;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => void;
}

interface DraggableItem {
  id: string;
  type: 'text_effect' | 'text_template' | 'sticker' | 'subtitles' | 'motion_text';
  name: string;
  defaultX: number;
  defaultY: number;
  defaultScale: number;
  renderPreview: (text: string) => React.ReactNode;
}

export const InteractiveCanvasOverlay: React.FC<InteractiveCanvasOverlayProps> = ({
  scene,
  aspectRatio,
  onUpdatePositions,
  onUpdateNarration,
  onUpdateScene
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // State chỉnh sửa chữ trực tiếp
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextValue, setEditingTextValue] = useState(scene.narration || '');

  // Đồng bộ editingTextValue khi scene thay đổi
  useEffect(() => {
    setEditingTextValue(scene.narration || '');
  }, [scene.id, scene.narration]);

  const currentPositions = scene.elementPositions || {};

  // Xây dựng danh sách các phần tử có thể kéo thả trên phân cảnh hiện tại
  const draggableItems: DraggableItem[] = [];

  // A. Khối chữ chính duy nhất của phân cảnh (Tránh chồng chéo lặp 3 loại chữ)
  if (scene.isGreenScreenMotion) {
    draggableItems.push({
      id: 'green_screen_text',
      type: 'motion_text',
      name: 'Chữ Motion 3D (Trước & Sau Người)',
      defaultX: 50,
      defaultY: 50,
      defaultScale: 1.0,
      renderPreview: (txt) => (
        <div className="px-4 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-black text-xs uppercase tracking-wider backdrop-blur-sm shadow-lg shadow-yellow-500/20 whitespace-nowrap">
          {txt ? txt.slice(0, 25) : 'Khối Chữ 3D Motion'}
        </div>
      )
    });
  } else if (scene.tiktokTextTemplate) {
    const tpl = getTikTokTemplateById(scene.tiktokTextTemplate);
    draggableItems.push({
      id: 'text_template',
      type: 'text_template',
      name: tpl ? tpl.name : 'Mẫu Chữ (Template)',
      defaultX: 50,
      defaultY: 20,
      defaultScale: 1.0,
      renderPreview: (txt) => tpl ? tpl.render(txt || 'TEXT') : <span>TEXT</span>
    });
  } else if (scene.tiktokTextEffect || (scene.textEffectsMix && scene.textEffectsMix.length > 0)) {
    const effId = scene.tiktokTextEffect || scene.textEffectsMix?.[0] || '';
    const eff = getTikTokTextEffectById(effId);
    const isMix = scene.textEffectsMix && scene.textEffectsMix.length > 0;
    draggableItems.push({
      id: 'text_effect',
      type: 'text_effect',
      name: isMix ? `🔀 Mix Chữ (${scene.textEffectsMix?.length} kiểu)` : (eff ? eff.name : 'Chữ Nghệ Thuật (Text Effect)'),
      defaultX: 50,
      defaultY: 24,
      defaultScale: 1.0,
      renderPreview: (txt) => eff ? eff.applyStyle(txt || 'ART') : <span>ART</span>
    });
  } else if (!scene.hideSubtitles) {
    draggableItems.push({
      id: 'subtitles',
      type: 'subtitles',
      name: 'Dòng Chữ Phụ Đề Ngang',
      defaultX: 50,
      defaultY: 84,
      defaultScale: 1.0,
      renderPreview: (txt) => (
        <div className="px-4 py-1.5 rounded-lg bg-black/80 border border-cyan-400 text-cyan-300 font-black text-xs tracking-wide shadow-lg whitespace-nowrap">
          {txt ? txt.slice(0, 30) : 'Dòng Phụ Đề'}...
        </div>
      )
    });
  }

  // B. Danh sách Stickers riêng biệt
  if (scene.tiktokStickers && scene.tiktokStickers.length > 0) {
    const defaultStickerCoords = [
      { x: 80, y: 18 },
      { x: 20, y: 82 },
      { x: 20, y: 35 },
      { x: 80, y: 78 }
    ];
    scene.tiktokStickers.forEach((stkId, index) => {
      const sticker = getTikTokStickerById(stkId);
      const def = defaultStickerCoords[index % defaultStickerCoords.length];
      draggableItems.push({
        id: `stk_${stkId}`,
        type: 'sticker',
        name: sticker ? sticker.name : `Sticker ${index + 1}`,
        defaultX: def.x,
        defaultY: def.y,
        defaultScale: 1.0,
        renderPreview: () => sticker ? sticker.render() : <span>Sticker</span>
      });
    });
  }

  // Lấy tọa độ hiện tại của một item
  const getItemPos = (item: DraggableItem): ElementPosition => {
    return currentPositions[item.id] || {
      x: item.defaultX,
      y: item.defaultY,
      scale: item.defaultScale,
      rotate: 0
    };
  };

  // Bắt đầu kéo chuột
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const item = draggableItems.find((d) => d.id === itemId);
    if (!item) return;

    const pos = getItemPos(item);
    setSelectedId(itemId);
    setDraggingId(itemId);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y
    };
  };

  // Di chuyển chuột trên toàn màn hình
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !dragStartRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaXPixels = e.clientX - dragStartRef.current.mouseX;
      const deltaYPixels = e.clientY - dragStartRef.current.mouseY;

      // Quy đổi pixel sang % của container
      const deltaXPercent = (deltaXPixels / rect.width) * 100;
      const deltaYPercent = (deltaYPixels / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + deltaXPercent)));
      const newY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + deltaYPercent)));

      const current = currentPositions[draggingId] || { x: 50, y: 50, scale: 1, rotate: 0 };

      onUpdatePositions(scene.id, {
        ...currentPositions,
        [draggingId]: {
          ...current,
          x: newX,
          y: newY
        }
      });
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      dragStartRef.current = null;
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, scene.id, currentPositions, onUpdatePositions]);

  // Điều chỉnh tỷ lệ kích thước: Thu Nhỏ (-) hoặc Phóng To (+)
  const handleScaleChange = (itemId: string, delta: number) => {
    const item = draggableItems.find((d) => d.id === itemId);
    if (!item) return;
    const current = getItemPos(item);
    const newScale = Math.max(0.3, Math.min(3.0, Number(((current.scale || 1.0) + delta).toFixed(2))));
    onUpdatePositions(scene.id, {
      ...currentPositions,
      [itemId]: {
        ...current,
        scale: newScale
      }
    });
  };

  // Cuộn chuột để phóng to / thu nhỏ (Mouse Wheel Zoom)
  const handleWheel = (e: React.WheelEvent, itemId: string) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    handleScaleChange(itemId, delta);
  };

  // Điều chỉnh xoay (Rotate)
  const handleRotate = (itemId: string, deltaAngle: number = 15) => {
    const item = draggableItems.find((d) => d.id === itemId);
    if (!item) return;
    const current = getItemPos(item);
    const newRotate = ((current.rotate || 0) + deltaAngle + 360) % 360;
    onUpdatePositions(scene.id, {
      ...currentPositions,
      [itemId]: {
        ...current,
        rotate: newRotate
      }
    });
  };

  // Điều chỉnh dịch chuyển lên / xuống nhanh (Nudge Y)
  const handleNudgeY = (itemId: string, deltaPercent: number) => {
    const item = draggableItems.find((d) => d.id === itemId);
    if (!item) return;
    const current = getItemPos(item);
    const newY = Math.max(5, Math.min(95, current.y + deltaPercent));
    onUpdatePositions(scene.id, {
      ...currentPositions,
      [itemId]: {
        ...current,
        y: newY
      }
    });
  };

  // Xóa phần tử khỏi phân cảnh (Sticker, Mẫu chữ, Text Effect hoặc Phụ đề)
  const handleDeleteItem = (itemId: string) => {
    const item = draggableItems.find((d) => d.id === itemId);
    if (!item || !onUpdateScene) return;

    if (item.type === 'sticker') {
      const realStkId = itemId.replace(/^stk_/, '');
      const nextStickers = (scene.tiktokStickers || []).filter((s) => s !== realStkId && s !== itemId);
      onUpdateScene(scene.id, { tiktokStickers: nextStickers });
    } else if (item.type === 'text_template') {
      onUpdateScene(scene.id, { tiktokTextTemplate: undefined });
    } else if (item.type === 'text_effect') {
      onUpdateScene(scene.id, { tiktokTextEffect: undefined, textEffectsMix: [] });
    } else if (item.type === 'subtitles') {
      onUpdateScene(scene.id, { hideSubtitles: true });
    } else if (item.type === 'motion_text') {
      onUpdateScene(scene.id, { isGreenScreenMotion: false });
    }

    // Xóa vị trí lưu trong elementPositions
    const updated = { ...currentPositions };
    delete updated[itemId];
    onUpdatePositions(scene.id, updated);
    setSelectedId(null);
  };

  // Đặt lại vị trí mặc định cho item được chọn
  const handleResetItem = (itemId: string) => {
    const item = draggableItems.find((d) => d.id === itemId);
    if (!item) return;
    const updated = { ...currentPositions };
    delete updated[itemId];
    onUpdatePositions(scene.id, updated);
  };

  // Đặt lại toàn bộ vị trí về mặc định
  const handleResetAll = () => {
    onUpdatePositions(scene.id, {});
  };

  // Cập nhật câu chữ mới cho phân cảnh
  const handleSaveNarration = () => {
    if (onUpdateNarration) {
      onUpdateNarration(scene.id, editingTextValue);
    }
    setIsEditingText(false);
  };

  const selectedItem = draggableItems.find((d) => d.id === selectedId);
  const isSelectedTextElement =
    selectedItem &&
    (selectedItem.type === 'text_effect' ||
      selectedItem.type === 'text_template' ||
      selectedItem.type === 'subtitles' ||
      selectedItem.type === 'motion_text');

  return (
    <div className="flex flex-col gap-2.5 w-full select-none animate-fadeIn">
      {/* Top action bar: Hướng dẫn, Điều khiển & Nút reset */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
          <Move className="w-3.5 h-3.5" />
          <span>Kéo chuột để di chuyển • Cuộn con lăn để Phóng to/Thu nhỏ • Nhấp đúp để sửa chữ</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Chuyển Đổi Thứ Tự Lớp Chữ (Trước Video / Dưới Video / Đan Xen 3D) */}
          {onUpdateScene && (
            <button
              type="button"
              onClick={() => {
                const current = scene.textLayerMode || (scene.isGreenScreenMotion ? 'both_3d' : 'front');
                const next =
                  current === 'front'
                    ? 'behind'
                    : current === 'behind'
                    ? 'both_3d'
                    : 'front';
                onUpdateScene(scene.id, { textLayerMode: next });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer border ${
                scene.textLayerMode === 'front'
                  ? 'bg-blue-600/40 border-blue-400 text-blue-200'
                  : scene.textLayerMode === 'behind'
                  ? 'bg-purple-600/40 border-purple-400 text-purple-200'
                  : 'bg-amber-600/40 border-amber-400 text-amber-200'
              }`}
              title="Đổi vị trí: Chữ luôn chạy ở TRƯỚC video hoặc chạy ở DƯỚI video hoặc đan xen 3D"
            >
              <span>
                {scene.textLayerMode === 'front'
                  ? '🔝 Trước Video'
                  : scene.textLayerMode === 'behind'
                  ? '🔙 Dưới Video'
                  : '⚡ Đan Xen 3D'}
              </span>
            </button>
          )}

          {Object.keys(currentPositions).length > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-[11px] font-bold transition cursor-pointer"
              title="Đặt lại toàn bộ chữ và sticker về vị trí mặc định"
            >
              <ResetIcon className="w-3 h-3" />
              <span>Đặt Lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh Sửa Chữ Nhanh Trực Tiếp (Quick Inline Text Editor) */}
      <div className="bg-gray-900/95 p-2 rounded-xl border border-indigo-500/40 flex items-center gap-2 shadow-lg">
        <div className="flex items-center gap-1 text-indigo-300 text-xs font-bold whitespace-nowrap">
          <Type className="w-4 h-4 text-indigo-400" />
          <span>Sửa nội dung chữ:</span>
        </div>
        <input
          type="text"
          value={editingTextValue}
          onChange={(e) => {
            const val = e.target.value;
            setEditingTextValue(val);
            if (onUpdateNarration) {
              onUpdateNarration(scene.id, val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveNarration();
            }
          }}
          className="flex-1 bg-gray-950 border border-gray-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg px-3 py-1 text-xs text-white placeholder-gray-500 outline-none transition"
          placeholder="Nhập nội dung chữ hiển thị cho cảnh này..."
        />
        <button
          type="button"
          onClick={handleSaveNarration}
          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md shadow-indigo-600/30"
          title="Lưu chữ mới vào kịch bản"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Lưu</span>
        </button>
      </div>

      {/* Main Drag-and-Drop Canvas Container */}
      <div
        ref={containerRef}
        onClick={() => {
          setSelectedId(null);
          setIsEditingText(false);
        }}
        className="relative bg-black/95 rounded-2xl overflow-hidden shadow-2xl border-2 border-dashed border-cyan-500/50 mx-auto w-full cursor-crosshair"
        style={{
          width: aspectRatio === '9:16' ? '320px' : '100%',
          aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9',
          maxHeight: '520px'
        }}
      >
        {/* Hình nền thực tế của phân cảnh (Live Scene Background Preview) */}
        {scene.mediaUrl ? (
          <img
            src={scene.mediaUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60 select-none"
          />
        ) : scene.visualType === 'stock_chart' ? (
          <div className="absolute inset-0 bg-[#080A12] flex flex-col items-center justify-center pointer-events-none opacity-60 p-4">
            <span className="text-emerald-400 font-mono font-black text-2xl animate-pulse">+328% 📈</span>
            <span className="text-gray-400 text-xs mt-1">Biểu Đồ Nến Tăng Vọt</span>
          </div>
        ) : scene.visualType === 'bank_notification' ? (
          <div className="absolute inset-0 bg-[#0A0D1A] flex flex-col items-center justify-center pointer-events-none opacity-60 p-4">
            <div className="p-3 rounded-2xl bg-indigo-950/80 border border-emerald-500/40 text-center">
              <span className="text-emerald-400 font-black text-lg font-mono">+50.000.000 VND 💵</span>
              <div className="text-[10px] text-gray-400 mt-1">MB Bank • Biến động số dư</div>
            </div>
          </div>
        ) : scene.visualType === 'vs_battle' ? (
          <div className="absolute inset-0 bg-[#12050A] flex flex-col items-center justify-center pointer-events-none opacity-60 p-4">
            <span className="text-red-500 font-black text-3xl italic drop-shadow-[0_0_20px_#EF4444]">⚔️ VS ⚔️</span>
            <span className="text-gray-400 text-xs mt-1">Đại Chiến Đối Đầu</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-black to-slate-950 pointer-events-none opacity-80" />
        )}

        {/* Lớp phủ gradient tối mỏng để giữ độ tương phản cho thao tác kéo thả */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Video Effect Live Preview */}
        {scene.tiktokVideoEffect && (
          <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
            {getTikTokVideoEffectById(scene.tiktokVideoEffect)?.renderOverlay(30, 30)}
          </div>
        )}

        {/* Lưới tọa độ hướng dẫn (Grid lines) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-x-0 top-1/4 border-b border-cyan-400 border-dashed" />
          <div className="absolute inset-x-0 top-1/2 border-b border-cyan-400 border-dashed" />
          <div className="absolute inset-x-0 top-3/4 border-b border-cyan-400 border-dashed" />
          <div className="absolute inset-y-0 left-1/2 border-r border-cyan-400 border-dashed" />
        </div>

        {draggableItems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs">
            <span>Cảnh này chưa có Chữ Nghệ Thuật, Mẫu Chữ hoặc Sticker nào.</span>
            <span className="text-gray-400 mt-1">Hãy bấm nút "🎬 TikTok / CapCut Studio" ở bên dưới để thêm!</span>
          </div>
        ) : (
          draggableItems.map((item) => {
            const pos = getItemPos(item);
            const isSelected = selectedId === item.id;
            const currentScalePercent = Math.round((pos.scale || 1.0) * 100);

            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                onWheel={(e) => handleWheel(e, item.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                  setIsEditingText(true);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                }}
                className={`absolute transition-shadow transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black z-30 shadow-2xl shadow-cyan-500/50'
                    : 'hover:ring-1 hover:ring-white/50 z-20'
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${pos.scale || 1}) rotate(${pos.rotate || 0}deg)`
                }}
              >
                {/* Header Tag Bar khi được click chọn */}
                {isSelected && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gray-950/95 px-2.5 py-1 rounded-xl border border-cyan-400 text-[11px] text-white whitespace-nowrap shadow-2xl z-50 pointer-events-auto backdrop-blur-md">
                    <span className="font-bold text-cyan-300 mr-1">{item.name}</span>

                    {/* Nút Thu Nhỏ (-) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScaleChange(item.id, -0.15);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-200 hover:text-cyan-300 transition"
                      title="Thu nhỏ kích thước (-15%)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    {/* Hiển thị tỷ lệ scale % */}
                    <span className="text-[10px] font-mono text-cyan-400 font-bold px-1">
                      {currentScalePercent}%
                    </span>

                    {/* Nút Phóng To (+) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScaleChange(item.id, 0.15);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-200 hover:text-cyan-300 transition"
                      title="Phóng to kích thước (+15%)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-3 bg-gray-700 mx-0.5" />

                    {/* Nút Xoay Ngược (-15°) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(item.id, -15);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-200 hover:text-cyan-300 transition"
                      title="Xoay ngược -15°"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Xoay Thuận (+15°) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(item.id, 15);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-200 hover:text-cyan-300 transition"
                      title="Xoay thuận +15°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-3 bg-gray-700 mx-0.5" />

                    {/* Nút Đẩy Chữ Lên Cao (-3%) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNudgeY(item.id, -3);
                      }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-[10px] font-bold transition"
                      title="Nâng vị trí chữ lên cao hơn (-3%)"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Lên</span>
                    </button>

                    {/* Nút Hạ Chữ Xuống Thấp (+3%) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNudgeY(item.id, 3);
                      }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-[10px] font-bold transition"
                      title="Hạ vị trí chữ xuống thấp hơn (+3%)"
                    >
                      <ArrowDown className="w-3 h-3" />
                      <span>Xuống</span>
                    </button>

                    {/* Nút Sửa Chữ Nhanh nếu là phần tử text */}
                    {(item.type === 'text_effect' ||
                      item.type === 'text_template' ||
                      item.type === 'subtitles' ||
                      item.type === 'motion_text') && (
                      <>
                        <div className="w-[1px] h-3 bg-gray-700 mx-0.5" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingText(true);
                          }}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold transition"
                          title="Sửa chữ cho phần tử này"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa Chữ</span>
                        </button>
                      </>
                    )}

                    <div className="w-[1px] h-3 bg-gray-700 mx-0.5" />

                    {/* Nút Đặt Lại Vị Trí Mặc Định */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetItem(item.id);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition"
                      title="Đặt lại vị trí ban đầu"
                    >
                      <ResetIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút XÓA PHẦN TỬ (Delete) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-bold transition shadow-sm ml-0.5"
                      title="Xóa phần tử này khỏi phân cảnh"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                )}

                {/* Khung viền nét đứt khi hover / drag */}
                <div
                  className={`p-1.5 rounded-xl border-2 border-dashed ${
                    isSelected ? 'border-cyan-400 bg-cyan-950/30' : 'border-white/30 hover:border-white/70'
                  }`}
                >
                  {item.renderPreview(editingTextValue)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Helper footer */}
      <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-3">
        <span>🔍 <b>Thu nhỏ / Phóng to:</b> Dùng nút [+] [-] trên thanh công cụ hoặc lăn con trỏ chuột</span>
        <span>•</span>
        <span>✍️ <b>Sửa chữ:</b> Gõ trực tiếp vào thanh gõ chữ ở trên hoặc nhấp đúp vào ô chữ</span>
      </div>
    </div>
  );
};
