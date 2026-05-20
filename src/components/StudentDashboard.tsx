import React, { useState, useEffect, useRef } from "react";
import { Group, ObservationLog, PhotoUpload } from "../types";
import { 
  FileText, 
  Map, 
  Image as ImageIcon, 
  FlaskConical, 
  Plus, 
  Trash2, 
  CheckCircle, 
  LogOut, 
  Lock, 
  Hourglass,
  Scale,
  Video,
  Upload,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface StudentDashboardProps {
  groups: Group[];
  activeGroupId: string | null;
  onLogin: (groupId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  onRefreshGroup: () => void;
  onUpdateForm1: (groupId: string, data: { ingredients: string; tools: string; initialSetup: string }) => Promise<void>;
  onUpdateForm2: (groupId: string, data: { photos: PhotoUpload[]; videoUrl: string; stepDescription: string }) => Promise<void>;
  onAddObservationLog: (groupId: string, data: Omit<ObservationLog, "id" | "timestamp">) => Promise<void>;
  onDeleteObservationLog: (groupId: string, logId: string) => Promise<void>;
  onResetGroup: (groupId: string) => Promise<void>;
}

export default function StudentDashboard({
  groups,
  activeGroupId,
  onLogin,
  onLogout,
  onRefreshGroup,
  onUpdateForm1,
  onUpdateForm2,
  onAddObservationLog,
  onDeleteObservationLog,
  onResetGroup,
}: StudentDashboardProps) {
  // Login states
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [secretCodeInput, setSecretCodeInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active student group matching
  const group = groups.find((g) => g.id === activeGroupId);

  // Form tab selection
  const [activeTab, setActiveTab] = useState<"form1" | "form2" | "form3">("form1");

  // Form 1 Input States
  const [form1Ingredients, setForm1Ingredients] = useState("");
  const [form1Tools, setForm1Tools] = useState("");
  const [form1Setup, setForm1Setup] = useState("");
  const [form1Saving, setForm1Saving] = useState(false);
  const [form1Success, setForm1Success] = useState(false);

  // Form 2 Input States
  const [form2StepDesc, setForm2StepDesc] = useState("");
  const [form2VideoUrl, setForm2VideoUrl] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoUpload[]>([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [form2Saving, setForm2Saving] = useState(false);
  const [form2Success, setForm2Success] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form 3 Input States
  const [pHInput, setPHInput] = useState("4.5");
  const [fermentationHoursInput, setFermentationHoursInput] = useState("8");
  const [textureInput, setTextureInput] = useState<'thick/creamy' | 'medium/smooth' | 'watery'>("thick/creamy");
  const [aromaInput, setAromaInput] = useState<'sour' | 'fresh/sweet' | 'foul/rotten'>("sour");
  const [observationNote, setObservationNote] = useState("");
  const [form3Saving, setForm3Saving] = useState(false);

  // Populate form fields with existing data on group load
  useEffect(() => {
    if (group) {
      if (group.form1) {
        setForm1Ingredients(group.form1.ingredients.join("\n"));
        setForm1Tools(group.form1.tools.join("\n"));
        setForm1Setup(group.form1.initialSetup);
      } else {
        setForm1Ingredients("");
        setForm1Tools("");
        setForm1Setup("");
      }

      if (group.form2) {
        setForm2StepDesc(group.form2.stepDescription);
        setForm2VideoUrl(group.form2.videoUrl || "");
        setUploadedPhotos(group.form2.photos || []);
      } else {
        setForm2StepDesc("");
        setForm2VideoUrl("");
        setUploadedPhotos([]);
      }
    }
  }, [group]);

  // Auth Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!selectedGroupId || !secretCodeInput) {
      setLoginError("Silakan pilih kelompok Anda dan masukkan PIN rahasia.");
      return;
    }

    setIsLoggingIn(true);
    const result = await onLogin(selectedGroupId, secretCodeInput);
    setIsLoggingIn(false);

    if (result.success) {
      setSecretCodeInput("");
      setLoginError("");
    } else {
      setLoginError(result.error || "PIN rahasia salah!");
    }
  };

  // Form 1 Save Handler
  const handleForm1Save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    setForm1Saving(true);
    setForm1Success(false);
    try {
      await onUpdateForm1(group.id, {
        ingredients: form1Ingredients,
        tools: form1Tools,
        initialSetup: form1Setup,
      });
      setForm1Success(true);
      setTimeout(() => setForm1Success(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan rencana pengerjaan.");
    } finally {
      setForm1Saving(false);
    }
  };

  // Drag and Drop files functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Mohon unggah file gambar saja (.jpg, .png, etc)!");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      const newPhoto: PhotoUpload = {
        id: "photo-" + Date.now(),
        url: base64String,
        caption: photoCaption.trim() || `Alur proses ${file.name}`,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedPhotos((prev) => [...prev, newPhoto]);
      setPhotoCaption(""); // reset caption input
    };
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Form 2 Save Handler
  const handleForm2Save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    setForm2Saving(true);
    setForm2Success(false);
    try {
      await onUpdateForm2(group.id, {
        stepDescription: form2StepDesc,
        videoUrl: form2VideoUrl,
        photos: uploadedPhotos,
      });
      setForm2Success(true);
      setTimeout(() => setForm2Success(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan dokumentasi produksi.");
    } finally {
      setForm2Saving(false);
    }
  };

  // Form 3 Log Observation Submission
  const handleForm3LogAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    if (!observationNote.trim()) {
      alert("Lengkapi catatan observasi Anda.");
      return;
    }

    setForm3Saving(true);
    try {
      await onAddObservationLog(group.id, {
        pH: parseFloat(pHInput),
        fermentationHours: parseFloat(fermentationHoursInput),
        texture: textureInput,
        aroma: aromaInput,
        note: observationNote,
      });
      setObservationNote(""); // clear text field on success
      onRefreshGroup();
    } catch (err) {
      alert("Gagal menambahkan log observasi harian.");
    } finally {
      setForm3Saving(false);
    }
  };

  // Delete Observation entries
  const handleLogDelete = async (logId: string) => {
    if (!group) return;
    if (confirm("Hapus entri observasi terpilih ini?")) {
      await onDeleteObservationLog(group.id, logId);
      onRefreshGroup();
    }
  };

  // Optional mock preset photo uploads if students want quick visual assets
  const handleAddMockPhoto = (presetName: string, mockUrl: string) => {
    const newPhoto: PhotoUpload = {
      id: "photo-mock-" + Date.now(),
      url: mockUrl,
      caption: `Demonstrasi: ${presetName}`,
      uploadedAt: new Date().toISOString(),
    };
    setUploadedPhotos((prev) => [...prev, newPhoto]);
  };

  // Custom presets for lab photography
  const presetPhotos = [
    { name: "Susu Direbus (Pasteurisasi)", url: "https://images.unsplash.com/photo-1571244856341-4f3dd95bf37d?auto=format&fit=crop&q=80&w=600" },
    { name: "Inokulasi Starter Yogurt", url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600" },
    { name: "Inkubasi Wadah Kaca", url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=600" }
  ];

  // Auth Screen logic
  if (!group) {
    return (
      <div id="student-login-view" className="flex items-center justify-center p-2 min-h-[480px]">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-full">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Akses Jurnal Logbook Siswa</h3>
            <p className="text-xs text-slate-400">Silakan pilih kelompok dan masukkan PIN rahasia kelompok Anda untuk menulis data.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 font-medium rounded-xl border border-red-100">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-semibold text-xs">Pilih Kelompok Praktikum Anda:</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 bg-slate-50"
                required
              >
                <option value="">-- Pilih Kelompok --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-semibold text-xs">Akses PIN Rahasia kelompok (Secret Code):</label>
              <input
                type="password"
                maxLength={6}
                value={secretCodeInput}
                onChange={(e) => setSecretCodeInput(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN Angka Kelompok Anda (Misal: 1011)"
                className="w-full p-3 rounded-xl border border-slate-200 text-center tracking-widest font-mono font-bold text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-md transition-all text-center flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isLoggingIn ? "Memverifikasi PIN..." : "Masuk Logbook Saya"}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400">
              *Jika kelompok Anda belum dirancang oleh Guru, silakan tanyakan sandi pendaftaran pada instruktur kelas.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current completion status
  const hasForm1 = !!group.form1 && group.form1.ingredients.length > 0;
  const hasForm2 = !!group.form2 && group.form2.stepDescription.trim().length > 0;
  const observationLogs = group.form3?.observationLogs || [];
  const hasForm3 = observationLogs.length > 0;

  return (
    <div id="student-dashboard-view" className="space-y-6">
      
      {/* Group Login Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-3xs border border-slate-150">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" /> Jurnal Aktif
            </span>
            <span className="text-xs text-slate-400 font-bold">
              ID: {group.secretCode}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-1">{group.name}</h2>
          <p className="text-xs text-slate-500">Isi rekam data yogurt kelayakan konsumsi langsung dari ponsel Anda.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={async () => {
              if (confirm("Ingin mereset seluruh kemajuan data kelompok Anda untuk memulai dari awal praktikum baru?")) {
                await onResetGroup(group.id);
                onRefreshGroup();
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Mulai Ulang Praktikum
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Jurnal
          </button>
        </div>
      </div>

      {/* Progress Stepper Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2 md:space-x-6 overflow-x-auto w-full">
          
          <div className={`flex items-center space-x-1.5 whitespace-nowrap ${hasForm1 ? "text-emerald-600" : "text-slate-400"}`}>
            <CheckCircle className={`w-4 h-4 ${hasForm1 ? "fill-emerald-100" : ""}`} />
            <span className="font-semibold">Plan Bahan</span>
          </div>
          
          <div className="w-6 h-[1px] bg-slate-200" />
          
          <div className={`flex items-center space-x-1.5 whitespace-nowrap ${hasForm2 ? "text-emerald-600" : "text-slate-400"}`}>
            <CheckCircle className={`w-4 h-4 ${hasForm2 ? "fill-emerald-100" : ""}`} />
            <span className="font-semibold">Foto Dokumentasi</span>
          </div>
          
          <div className="w-6 h-[1px] bg-slate-200" />
          
          <div className={`flex items-center space-x-1.5 whitespace-nowrap ${hasForm3 ? "text-emerald-600" : "text-slate-400"}`}>
            <CheckCircle className={`w-4 h-4 ${hasForm3 ? "fill-emerald-100" : ""}`} />
            <span className="font-semibold">Jurnal Observasi ({observationLogs.length})</span>
          </div>

        </div>
      </div>

      {/* Stage Automatic Status Guidance Engine */}
      {group.conclusion && (
        <div className={`p-4 rounded-xl border flex gap-3 ${
          group.conclusion === "Berhasil" 
            ? "bg-emerald-50/70 border-emerald-200 text-slate-800"
            : "bg-amber-50/70 border-amber-200 text-slate-800"
        }`}>
          <div className="mt-0.5">
            {group.conclusion === "Berhasil" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-xs">
            <h4 className="font-bold">STATUS HASIL EVALUASI: {group.conclusion === "Berhasil" ? "BERHASIL (Successful)" : "KURANG BERHASIL (Needs Improvement)"}</h4>
            <p className="mt-0.5 leading-relaxed text-slate-600">{group.conclusionReason}</p>
          </div>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-250">
        <button
          onClick={() => setActiveTab("form1")}
          className={`py-2 text-center text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "form1"
              ? "bg-white text-indigo-700 shadow-3xs font-extrabold"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          1. Bahan & Rencana
        </button>
        <button
          onClick={() => setActiveTab("form2")}
          className={`py-2 text-center text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "form2"
              ? "bg-white text-indigo-700 shadow-3xs font-extrabold"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          2. Proses & Foto
        </button>
        <button
          onClick={() => setActiveTab("form3")}
          className={`py-2 text-center text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "form3"
              ? "bg-white text-indigo-700 shadow-3xs font-extrabold"
              : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          3. Observasi pH
        </button>
      </div>

      {/* Forms Contents */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs">
        
        {/* TAB 1: FORM 1 - Ingredients and Planning */}
        {activeTab === "form1" && (
          <form onSubmit={handleForm1Save} className="space-y-4 text-xs select-none">
            <div>
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-indigo-600" />
                Formulir 1: Rencana Praktikum & Bahan Yogurt
              </h3>
              <p className="text-xxs text-slate-400">Rencanakan takaran starter ragi dan peralatan higienis murni Anda sebelum pasteurisasi.</p>
            </div>

            {form1Success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-100">
                Berhasil menyimpan rencana pengerjaan bahan!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold">Daftar Bahan Pembuatan (Satu baris untuk satu bahan):</label>
              <textarea
                rows={4}
                value={form1Ingredients}
                onChange={(e) => setForm1Ingredients(e.target.value)}
                placeholder="Contoh:&#10;1 Liter Susu Segar&#10;2 Sdm Bibit Starter Yogurt (Plain)&#10;50g Susu Bubuk Skim"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-normal"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold">Daftar Peralatan (Satu baris untuk satu alat):</label>
              <textarea
                rows={4}
                value={form1Tools}
                onChange={(e) => setForm1Tools(e.target.value)}
                placeholder="Contoh:&#10;Panci Stainless Steel (Panci teflon dihindari)&#10;Termometer Makanan&#10;Pengocok / Whisk&#10;Inkubator / Wadah Kedap"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-normal"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold">Sterilisasi & Persiapan Awal (Initial Setup):</label>
              <textarea
                rows={3}
                value={form1Setup}
                onChange={(e) => setForm1Setup(e.target.value)}
                placeholder="Jelaskan bagaimana kelompok mensterilkan alat dan wadah agar terhindar dari kontaminasi mikroba liar..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                required
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                *Sterilisasi penting agar susu tidak membusuk oleh bakteri kontaminan.
              </span>
            </div>

            <button
              type="submit"
              disabled={form1Saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow transition-all duration-150 inline-flex items-center gap-1.5"
            >
              {form1Saving ? "Menyimpan data..." : "Simpan Formulir 1"}
            </button>
          </form>
        )}

        {/* TAB 2: FORM 2 - Production & Documentation */}
        {activeTab === "form2" && (
          <form onSubmit={handleForm2Save} className="space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Formulir 2: Produksi & Dokumentasi Foto Yogurt
              </h3>
              <p className="text-xxs text-slate-400">Unggah foto dokumentasi dari smartphone saat pengerjaan pasteurisasi dan inokulasi ragi.</p>
            </div>

            {form2Success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-100">
                Berhasil memperbarui laporan proses pengerjaan dan galeri foto!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold">Langkah Demi Langkah Pembuatan (Prosedur Lapangan):</label>
              <textarea
                rows={5}
                value={form2StepDesc}
                onChange={(e) => setForm2StepDesc(e.target.value)}
                placeholder="Deskripsikan proses pengerjaan. Contoh:&#10;1. Panaskan susu sampai suhu 85 derajat Celsius untuk pasteurisasi.&#10;2. Dinginkan susu hingga 43 derajat Celsius.&#10;3. Masukkan bibit starter yogurt sebanyak 2 sendok penuh ke susu hangat.&#10;4. Tutup rapat lalu inkubasi."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                Link Video Praktikum (Opsional):
              </label>
              <input
                type="url"
                value={form2VideoUrl}
                onChange={(e) => setForm2VideoUrl(e.target.value)}
                placeholder="Contoh: https://drive.google.com/file/d/xxx atau Youtube Video"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold text-xs">Unggah Foto Alur Kerja ({uploadedPhotos.length} foto):</label>
              </div>

              {/* Drag and Drop Zone Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-slate-250 bg-slate-50/60 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
                
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Tarik gambar ke sini, atau klik untuk memilih file</p>
                <p className="text-[10px] text-slate-400 mt-1">Mendukung file JPG, PNG, WEBP langsung dari memori / kamera HP.</p>
              </div>

              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold block">Tulis Caption singkat sebelum memilih foto (Alternatif):</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengukuran suhu pasteurisasi susu dengan termometer batang"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full p-2 bg-white rounded border border-slate-200 focus:outline-none"
                  />
                </div>
                {/* Simulated laboratory presets if testing on desktop browser */}
                <div className="flex flex-col justify-end">
                  <span className="text-[9px] text-slate-400 font-bold block mb-1">Tes Cepat Gambar Demo (Tanpa HP):</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {presetPhotos.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddMockPhoto(preset.name, preset.url)}
                        className="py-1 px-2 hover:bg-indigo-50 border border-slate-200 text-indigo-700 bg-white font-medium rounded text-[9px] transition-all"
                      >
                        + Preset {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photos List Preview Grid */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 pt-3">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="bg-white rounded-lg overflow-hidden border border-slate-250 relative">
                      <img
                        src={photo.url}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-24 object-cover object-center bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700"
                        title="Hapus gambar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="p-1.5 bg-white text-[9px] text-slate-600 line-clamp-2 leading-tight">
                        {photo.caption}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={form2Saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow transition-all duration-150 inline-flex items-center gap-1.5"
            >
              {form2Saving ? "Sedang Mengirim..." : "Simpan Formulir 2 & Foto"}
            </button>
          </form>
        )}

        {/* TAB 3: FORM 3 - Daily Observations log list */}
        {activeTab === "form3" && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <FlaskConical className="w-4 h-4 text-indigo-600" />
                Formulir 3: Jurnal Observasi Kimiawi & Keberhasilan
              </h3>
              <p className="text-xxs text-slate-400">Tambahkan pengamatan berkala durasi jam fermentasi, pH, tekstur fisik, dan aroma fermentasi ragi.</p>
            </div>

            {/* Evaluation Criteria Reminder Box */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl leading-normal text-[11px] text-slate-600 flex gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Kriteria Evaluasi Sistem: </span>
                Agar yogurt dikategorikan <span className="font-extrabold text-emerald-700">✓ Berhasil (Successful)</span>, isikan log observasi dengan durasi fermentasi antara <span className="font-bold text-slate-800">8 s.d. 12 Jam</span> DAN tekstur <span className="font-bold text-slate-800">Kental/Creamy</span>. Parameter di luar itu akan memicu laporan &ldquo;Kurang Berhasil&rdquo;.
              </div>
            </div>

            {/* Observation Log Entry Add Form */}
            <form onSubmit={handleForm3LogAdd} className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 space-y-4">
              <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1">
                + Tambah Entri Pengamatan Baru
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Fermentation Hours */}
                <div className="space-y-1">
                  <label className="block text-slate-600 font-semibold">Telah Berlangsung (Jam):</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    step="0.5"
                    value={fermentationHoursInput}
                    onChange={(e) => setFermentationHoursInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none"
                    required
                  />
                  <span className="text-[9px] text-slate-400 leading-tight block">Misal: 5 jam, 8 jam, atau 10 jam.</span>
                </div>

                {/* pH values */}
                <div className="space-y-1">
                  <label className="block text-slate-600 font-semibold">Tingkat Keasaman (pH):</label>
                  <input
                    type="number"
                    min="1.0"
                    max="7.0"
                    step="0.1"
                    value={pHInput}
                    onChange={(e) => setPHInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-indigo-700 font-mono focus:outline-none text-center"
                    required
                  />
                  <span className="text-[9px] text-slate-400 leading-tight block">Yogurt normal biasanya berkisar pH 4.0 - 4.6.</span>
                </div>

                {/* Texture dropdown */}
                <div className="space-y-1">
                  <label className="block text-slate-600 font-semibold">Tekstur Fisik Susu:</label>
                  <select
                    value={textureInput}
                    onChange={(e) => setTextureInput(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none"
                    required
                  >
                    <option value="thick/creamy">Kental & Creamy</option>
                    <option value="medium/smooth">Sedikit Kental / Lembut</option>
                    <option value="watery">Cair / Encer Berair</option>
                  </select>
                  <span className="text-[9px] text-slate-400 leading-tight block">Kental berkat ragi dan protein susu.</span>
                </div>

                {/* Aroma dropdown */}
                <div className="space-y-1">
                  <label className="block text-slate-600 font-semibold">Aroma Hasil Fermentasi:</label>
                  <select
                    value={aromaInput}
                    onChange={(e) => setAromaInput(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none"
                    required
                  >
                    <option value="sour">Asam Segar khas Yogurt</option>
                    <option value="fresh/sweet">Manis Susu / Biasa</option>
                    <option value="foul/rotten">Asam Busuk / Rusak Kontaminasi</option>
                  </select>
                </div>

              </div>

              {/* Observation description textarea */}
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-semibold">Catatan Kondisi Khusus (Observasi Lapangan):</label>
                <textarea
                  rows={2}
                  value={observationNote}
                  onChange={(e) => setObservationNote(e.target.value)}
                  placeholder="Ceritakan rasanya sedikit (jika dicicipi), warna, timbulan dadih susu cair atau endapan air..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={form3Saving}
                className="py-2 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm text-xxs inline-flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {form3Saving ? "Menambahkan log..." : "Kirim Catatan Observasi"}
              </button>
            </form>

            {/* List Historic Entries */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs">Riwayat Pengamatan Jurnal</h4>
              
              {observationLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-450 border border-dashed rounded-xl bg-slate-50/50">
                  Belum ada log observasi dikirim. Gunakan form di atas untuk mengisi.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                  {observationLogs.map((log) => {
                    const isSuccess = log.fermentationHours >= 8 && log.fermentationHours <= 12 && log.texture === 'thick/creamy';
                    
                    return (
                      <div key={log.id} className="p-4 bg-white hover:bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {log.fermentationHours} Jam Fermentasi
                            </span>
                            <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.2 rounded font-mono">
                              pH {log.pH}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                              isSuccess ? "bg-emerald-50 text-emerald-700 font-extrabold" : "bg-slate-100 text-slate-500"
                            }`}>
                              {isSuccess ? "Target Ideal ✓" : "Di Luar Target"}
                            </span>
                          </div>
                          
                          <div className="text-xxs text-slate-400 gap-3 flex">
                            <span>Tekstur: {
                              log.texture === "thick/creamy" ? "Kental/Creamy" : 
                              log.texture === "medium/smooth" ? "Sedikit Lembut" : "Cair/Watery"
                            }</span>
                            <span>•</span>
                            <span>Aroma: {
                              log.aroma === "sour" ? "Asam Segar" : 
                              log.aroma === "fresh/sweet" ? "Harum Manis/Susu" : "Asam Busuk/Rotten"
                            }</span>
                          </div>

                          <p className="text-slate-600 text-xs mt-1 leading-normal whitespace-pre-line bg-slate-50/50 p-2 rounded border border-slate-100 italic">
                            &ldquo;{log.note}&rdquo;
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLogDelete(log.id)}
                          className="p-1 px-2 border border-red-50 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-[10px] font-bold"
                        >
                          Hapus Log
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
