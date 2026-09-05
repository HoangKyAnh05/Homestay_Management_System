import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Search,
  CheckCircle2,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Roadmap100Data } from '../types/roadmap100';
import { roadmap100Service } from '../services/roadmap100Service';

interface SavedRoadmapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  onSelectProject: (project: Roadmap100Data) => void;
}

export const SavedRoadmapsModal: React.FC<SavedRoadmapsModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onSelectProject
}) => {
  const [projects, setProjects] = useState<Roadmap100Data[]>(() => roadmap100Service.getAllProjects());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');

  if (!isOpen) return null;

  const reloadProjects = () => {
    setProjects(roadmap100Service.getAllProjects());
  };

  const filtered = projects.filter((p) =>
    p.topic.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleCreateNew = () => {
    const topic = newTopicInput.trim() || 'Lộ trình 100 ngày sáng tạo nội dung mới';
    const newProject = roadmap100Service.generateSample100Days(topic);
    roadmap100Service.saveProjectToList(newProject);
    roadmap100Service.saveRoadmap(newProject);
    setNewTopicInput('');
    setIsCreatingNew(false);
    reloadProjects();
    onSelectProject(newProject);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert('Bạn phải giữ lại ít nhất 1 dự án!');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa dự án này không? Toàn bộ dữ liệu của dự án sẽ bị xóa vĩnh viễn.')) {
      const updated = roadmap100Service.deleteProject(id);
      setProjects(updated);
      // Nếu xóa trúng project đang chọn, chuyển sang project đầu tiên
      if (id === currentProjectId && updated.length > 0) {
        onSelectProject(updated[0]);
      }
    }
  };

  const handleDuplicate = (p: Roadmap100Data, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = roadmap100Service.duplicateProject(p);
    reloadProjects();
    onSelectProject(cloned);
  };

  const handleExport = (p: Roadmap100Data, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(p, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${p.topic.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-cyan-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Kho Dự Án 100 Ngày Đã Lưu
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {projects.length} DỰ ÁN
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Quản lý, chuyển đổi qua lại, nhân bản và xem lại các lộ trình 100 ngày bạn đã tạo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Dự Án Mới</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create New Project Inline Input */}
        {isCreatingNew && (
          <div className="p-4 bg-gray-950 border-b border-cyan-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fadeIn">
            <input
              type="text"
              autoFocus
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              placeholder="Nhập tên chủ đề cho dự án 100 ngày mới..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-md transition"
              >
                Khởi Tạo 100 Ngày Mới
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 bg-gray-950/60 border-b border-gray-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm dự án theo chủ đề..."
            className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        {/* Projects List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Không tìm thấy dự án nào phù hợp với từ khóa "{searchTerm}"
            </div>
          ) : (
            filtered.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const total = proj.days.length;
              const doneCount = proj.days.filter((d) => d.status === 'completed').length;
              const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
              const mediaCount = proj.days.filter((d) => d.centerMedia && d.centerMedia.url).length;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                    isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                      : 'bg-gray-950/80 border-gray-800 hover:border-gray-700 hover:bg-gray-950'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      🛣️
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-white truncate max-w-md group-hover:text-cyan-300 transition">
                          {proj.topic}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold">
                            Đang mở
                          </span>
                        )}
                      </div>

                      {/* Stats & Progress */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Tiến độ: <b className="text-gray-200">{doneCount}/{total}</b> Ngày ({percent}%)
                          </span>
                        </div>

                        {mediaCount > 0 && (
                          <div className="flex items-center gap-1.5 text-indigo-300">
                            <Video className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{mediaCount} media đã đẩy lên</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Cập nhật: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full max-w-sm h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => handleDuplicate(proj, e)}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition"
                      title="Nhân bản dự án này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleExport(proj, e)}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition"
                      title="Xuất file JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 border border-gray-700 hover:border-rose-800/60 transition"
                      title="Xóa dự án này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition"
                    >
                      <span>Mở</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>💡 Mẹo: Bạn có thể lưu nhiều lộ trình khác nhau cho các kênh và chủ đề riêng biệt.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
