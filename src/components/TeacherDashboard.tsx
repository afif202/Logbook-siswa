import React, { useState } from "react";
import { Group, ObservationLog } from "../types";
import { 
  Users, 
  Clock, 
  FlaskConical, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  TrendingDown, 
  Calendar,
  BookOpen,
  Sparkles,
  Trash2,
  RefreshCw,
  Plus
} from "lucide-react";

interface TeacherDashboardProps {
  groups: Group[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteGroup: (id: string) => void;
  onAddGroup: (name: string, secretCode: string) => Promise<{ success: boolean; error?: string }>;
}

export default function TeacherDashboard({
  groups,
  isLoading,
  onRefresh,
  onDeleteGroup,
  onAddGroup,
}: TeacherDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [addError, setAddError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!newGroupName.trim() || !newGroupCode.trim()) {
      setAddError("Nama kelompok dan Kode Rahasia wajib diisi!");
      return;
    }
    const res = await onAddGroup(newGroupName, newGroupCode);
    if (res.success) {
      setNewGroupName("");
      setNewGroupCode("");
      setShowAddModal(false);
      onRefresh();
    } else {
      setAddError(res.error || "Gagal membuat kelompok.");
    }
  };

  // Stats Breakdown
  const totalGroups = groups.length;
  const completedGroups = groups.filter((g) => g.status === "completed").length;
  const successfulGroups = groups.filter((g) => g.conclusion === "Berhasil").length;
  const inProgressGroups = groups.filter((g) => g.status !== "completed").length;

  const successRate = completedGroups > 0 ? Math.round((successfulGroups / completedGroups) * 100) : 0;

  const filteredGroups = groups.filter((g) => {
    if (filterStatus === "all") return true;
    return g.status === filterStatus;
  });

  // Highlight selected group data safely
  const activeGroup = selectedGroup 
    ? groups.find((g) => g.id === selectedGroup.id) || selectedGroup 
    : null;

  return (
    <div id="teacher-dashboard-view" className="space-y-6">
      {/* Top Welcome Panel with Summary Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Panel Guru (Teacher Dashboard)</h2>
          <p className="text-sm text-slate-500">Monitor kemajuan fermentasi yogurt mahasiswa kelas secara real-time.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            id="refresh-data-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 justify-center py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan Data
          </button>
          <button
            id="open-add-group-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 justify-center py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Kelompok Baru
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Kelompok</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{totalGroups}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Proses Berjalan</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{inProgressGroups}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Selesai Logbook</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{completedGroups}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Tingkat Keberhasilan</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-0.5">{successRate}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Group List on Left, Detail Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Group List Card */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Daftar Kelompok Praktikum</h3>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {filteredGroups.length} tim
            </span>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-pure-slate-50 flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === "all"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus("planning")}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === "planning"
                  ? "bg-slate-100 text-slate-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              1. Perencanaan
            </button>
            <button
              onClick={() => setFilterStatus("production")}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === "production"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              2. Produksi
            </button>
            <button
              onClick={() => setFilterStatus("observation")}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === "observation"
                  ? "bg-amber-50 text-amber-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              3. Observasi
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === "completed"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              4. Selesai
            </button>
          </div>

          {/* List Entries */}
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">Tidak ada kelompok dalam status ini.</p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                const logsCount = group.form3?.observationLogs?.length || 0;
                const photosCount = group.form2?.photos?.length || 0;

                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-4 cursor-pointer hover:bg-slate-50/80 transition-all border-l-4 ${
                      isActive 
                        ? "bg-indigo-50/40 border-indigo-600" 
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-800 text-sm">{group.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                          <span>Kode:</span>
                          <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded font-bold">
                            {group.secretCode}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>Logs: {logsCount}</span>
                          <span className="text-slate-300">•</span>
                          <span>Fto: {photosCount}</span>
                        </div>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        {group.status === "completed" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai
                          </span>
                        ) : group.status === "observation" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Observasi
                          </span>
                        ) : group.status === "production" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Produksi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Perencanaan
                          </span>
                        )}

                        {/* Success / Failure Automatic Badges */}
                        {group.conclusion && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            group.conclusion === "Berhasil"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {group.conclusion === "Berhasil" ? "✓ Berhasil" : "⚠ Kurang Berhasil"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Selected Group Detailed Log View */}
        <div className="lg:col-span-7 flex flex-col">
          {activeGroup ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
              {/* Card Header with Group Title & Tools */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Detail Jurnal
                    </span>
                    <span className="text-xs text-slate-400">
                      Terakhir diperbarui: {new Date(activeGroup.updatedAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{activeGroup.name}</h3>
                </div>
                <div>
                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus kelompok "${activeGroup.name}"?`)) {
                        onDeleteGroup(activeGroup.id);
                        setSelectedGroup(null);
                      }
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Kelompok
                  </button>
                </div>
              </div>

              {/* Scrollable Group Record Contents */}
              <div className="p-6 space-y-8 overflow-y-auto max-h-[650px] scrollbar-thin">
                
                {/* 1. Conclusion Panel If Completed */}
                {activeGroup.conclusion && (
                  <div className={`p-5 rounded-xl border ${
                    activeGroup.conclusion === "Berhasil"
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                      : "bg-amber-50/50 border-amber-200 text-slate-800"
                  }`}>
                    <div className="flex items-baseline gap-2">
                      {activeGroup.conclusion === "Berhasil" ? (
                        <div className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Kesimpulan Akhir Otomatis: {activeGroup.conclusion === "Berhasil" ? "BERHASIL (Successful)" : "KURANG BERHASIL (In Need of Improvement)"}
                        </h4>
                        <p className="text-sm mt-1 text-slate-600">{activeGroup.conclusionReason}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex gap-4 text-xs font-mono text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-600">Aturan Evaluasi:</span> Waktu inkubasi 8-12 jam & tekstur harus &lsquo;thick/creamy&rsquo;.
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Planning Section (Form 1) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h4 className="font-bold text-slate-700 text-sm">Tahap 1: Perencanaan & Bahan</h4>
                    {activeGroup.form1 ? (
                      <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Sudah Disubmit</span>
                    ) : (
                      <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">Belum Mulai</span>
                    )}
                  </div>

                  {activeGroup.form1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                      <div>
                        <h5 className="font-semibold text-slate-600 mb-1">Bahan-bahan:</h5>
                        <ul className="list-disc pl-4 space-y-1 text-slate-700">
                          {activeGroup.form1.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-600 mb-1">Peralatan:</h5>
                        <ul className="list-disc pl-4 space-y-1 text-slate-700">
                          {activeGroup.form1.tools.map((tl, i) => <li key={i}>{tl}</li>)}
                        </ul>
                      </div>
                      <div className="md:col-span-2 pt-2 border-t border-slate-200/50">
                        <h5 className="font-semibold text-slate-600 mb-1">Persiapan Awal (Sanitasi & Prosedur):</h5>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{activeGroup.form1.initialSetup}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Kelompok ini belum melengkapi tahapan formulir perencanaan bahan.</p>
                  )}
                </div>

                {/* 3. Production Section (Form 2) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <h4 className="font-bold text-slate-700 text-sm">Tahap 2: Dokumentasi Proses & Foto</h4>
                    {activeGroup.form2 ? (
                      <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Sudah Disubmit</span>
                    ) : (
                      <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">Belum Mulai</span>
                    )}
                  </div>

                  {activeGroup.form2 ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                      <div className="text-xs">
                        <h5 className="font-semibold text-slate-600 mb-1">Langkah Pembuatan:</h5>
                        <p className="text-slate-700 space-y-1 leading-relaxed whitespace-pre-line">{activeGroup.form2.stepDescription}</p>
                      </div>

                      {activeGroup.form2.videoUrl && (
                        <div className="text-xs pt-1">
                          <span className="font-semibold text-slate-600">Link Video Pendukung: </span>
                          <a href={activeGroup.form2.videoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            {activeGroup.form2.videoUrl}
                          </a>
                        </div>
                      )}

                      {/* Display Photos Grid */}
                      {activeGroup.form2.photos && activeGroup.form2.photos.length > 0 ? (
                        <div className="pt-2">
                          <h5 className="text-xs font-semibold text-slate-600 mb-2">Unggahan Dokumentasi Mahasiswa:</h5>
                          <div className="grid grid-cols-2 gap-3">
                            {activeGroup.form2.photos.map((photo) => (
                              <div key={photo.id} className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-28 object-cover object-center bg-slate-100"
                                />
                                <div className="p-2">
                                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-normal">{photo.caption}</p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-1">
                                    {new Date(photo.uploadedAt).toLocaleDateString("id")} {new Date(photo.uploadedAt).toLocaleTimeString("id", { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Tidak ada foto diupload.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Kelompok ini belum melengkapi laporan produksi dan dokumentasi fotonya.</p>
                  )}
                </div>

                {/* 4. Observation Logs (Form 3) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <FlaskConical className="w-4 h-4 text-slate-500" />
                    <h4 className="font-bold text-slate-700 text-sm">Tahap 3: Log Observasi Fermentasi harian</h4>
                    {activeGroup.form3?.observationLogs && activeGroup.form3.observationLogs.length > 0 ? (
                      <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        {activeGroup.form3.observationLogs.length} Entri Log
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">Belum Ada Log</span>
                    )}
                  </div>

                  {activeGroup.form3?.observationLogs && activeGroup.form3.observationLogs.length > 0 ? (
                    <div className="space-y-4">
                      {/* Interactive Logs Timeline */}
                      <div className="relative border-l border-indigo-100 pl-4 space-y-4 py-1">
                        {activeGroup.form3.observationLogs.map((log) => {
                          const isSuccessTarget = log.fermentationHours >= 8 && log.fermentationHours <= 12 && log.texture === 'thick/creamy';
                          
                          return (
                            <div key={log.id} className="relative text-xs">
                              {/* Pulsing indicator node */}
                              <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isSuccessTarget ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-indigo-500"
                              }`} />
                              
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-3xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <span className="font-semibold text-slate-700">
                                    Laporan {log.fermentationHours} Jam Fermentasi
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(log.timestamp).toLocaleDateString("id")} {new Date(log.timestamp).toLocaleTimeString("id", { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-[11px]">
                                  <div className="bg-white p-1.5 rounded border border-slate-100 text-center">
                                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Keasaman pH</span>
                                    <span className="font-bold text-slate-800">{log.pH}</span>
                                  </div>
                                  <div className="bg-white p-1.5 rounded border border-slate-100 text-center">
                                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Durasi</span>
                                    <span className="font-bold text-slate-800">{log.fermentationHours} Jam</span>
                                  </div>
                                  <div className="bg-white p-1.5 rounded border border-slate-100 text-center col-span-1">
                                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Tekstur</span>
                                    <span className={`font-semibold ${
                                                      log.texture === "thick/creamy" ? "text-emerald-700" : 
                                                      log.texture === "medium/smooth" ? "text-indigo-700" : "text-amber-700"
                                                    }`}>
                                      {log.texture === "thick/creamy" ? "Kental/Creamy" : log.texture === "medium/smooth" ? "Sedang/Smooth" : "Encer/Watery"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-1.5 rounded border border-slate-100 text-center">
                                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Aroma</span>
                                    <span className="font-semibold text-slate-800">
                                      {log.aroma === "sour" ? "Asam Segar" : log.aroma === "fresh/sweet" ? "Harum Manis" : "Busuk/Rusak"}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-1.5 text-slate-600 italic leading-normal text-[11px] border-t border-slate-200/50">
                                  {log.note}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Kelompok ini belum menginput satu pun jurnal observasi berkala.</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[350px]">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Pilih Kelompok Praktikum</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Pilih salah satu kelompok praktikum yogurt di daftar kiri untuk meninjau logbook perencanaan, dokumentasi proses foto, keasaman pH, jam fermentasi, serta kesimpulan otomatis kelayakan hasil.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Group Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 animate-slide-up overflow-hidden">
            <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100">
              <h4 className="font-bold text-slate-800 text-sm">Buat Kelompok Praktikum Baru</h4>
              <p className="text-xs text-slate-500">Daftarkan kelompok pengerjaan proyek yogurt agar siswa bisa logbook.</p>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              {addError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 leading-normal font-medium">
                  {addError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-semibold">Nama Kelompok & Tim:</label>
                <input
                  type="text"
                  placeholder="Contoh: Kelompok 4 (Alpha-Yogurt)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5 animate-pulse">
                <label className="block text-slate-600 font-semibold">Kode Sandi Masuk Siswa (Secret Code):</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Masukkan 4-6 digit angka (misal: 4041)"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-center tracking-widest font-bold text-sm"
                  required
                />
                <span className="text-[10px] text-slate-400 leading-tight block">
                  Siswa akan menggunakan kode angka rahasia ini untuk mengakses dan mengedit jurnal kelompok mereka pada perangkat masing-masing secara aman.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-center"
                >
                  Simpan Kelompok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
