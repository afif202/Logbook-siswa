import React, { useState, useEffect } from "react";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import { Group, PhotoUpload, ObservationLog } from "./types";
import { 
  Users, 
  FlaskConical, 
  ShieldAlert, 
  BookOpen, 
  CheckCircle2, 
  Settings, 
  Info,
  Layers,
  Sparkles
} from "lucide-react";

export default function App() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Student authentication state
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Load active student session on mount
  useEffect(() => {
    const savedGroup = localStorage.getItem("yogurt_student_group_id");
    const savedRole = localStorage.getItem("yogurt_user_role");
    
    if (savedGroup) {
      setActiveGroupId(savedGroup);
    }
    if (savedRole === "teacher" || savedRole === "student") {
      setRole(savedRole);
    } else {
      setRole("teacher"); // default role
    }
    fetchGroups();
  }, []);

  // Fetch groups from API
  const fetchGroups = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Gagal memuat data kelompok tim.");
      }
      const data = await response.json();
      setGroups(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Koneksi ke backend bermasalah.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: "teacher" | "student") => {
    setRole(newRole);
    localStorage.setItem("yogurt_user_role", newRole);
  };

  // Student auth submission: checks backend code match
  const handleStudentLogin = async (groupId: string, code: string): Promise<{ success: boolean; error?: string }> => {
    // Find the client-side group first
    const matchedGroup = groups.find(g => g.id === groupId);
    if (!matchedGroup) {
      return { success: false, error: "Kelompok tidak ditemukan!" };
    }

    if (matchedGroup.secretCode === code) {
      setActiveGroupId(groupId);
      localStorage.setItem("yogurt_student_group_id", groupId);
      return { success: true };
    } else {
      return { success: false, error: "PIN Sandi Kelompok salah! Periksa kembali atau tanyakan Guru." };
    }
  };

  const handleStudentLogout = () => {
    setActiveGroupId(null);
    localStorage.removeItem("yogurt_student_group_id");
  };

  // Create new group (Teacher)
  const handleAddGroup = async (name: string, secretCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, secretCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Gagal membuat kelompok." };
      }
      await fetchGroups();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Koneksi terputus." };
    }
  };

  // Delete a group (Teacher)
  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeGroupId === id) {
          handleStudentLogout();
        }
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal menghapus kelompok.", err);
    }
  };

  // Submit Form 1 Planning
  const handleUpdateForm1 = async (groupId: string, formData: { ingredients: string; tools: string; initialSetup: string }) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/form1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal menyimpan Form 1", err);
    }
  };

  // Submit Form 2 Production
  const handleUpdateForm2 = async (groupId: string, formData: { photos: PhotoUpload[]; videoUrl: string; stepDescription: string }) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/form2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal menyimpan Form 2", err);
    }
  };

  // Add observation log entry
  const handleAddObservationLog = async (groupId: string, logData: Omit<ObservationLog, "id" | "timestamp">) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/form3/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal menambah log observasi", err);
    }
  };

  // Delete observation log entry
  const handleDeleteObservationLog = async (groupId: string, logId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/form3/log/${logId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal menghapus log observasi", err);
    }
  };

  // Reset entire progress (for demonstration / start-over)
  const handleResetGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Gagal mereset progress kelompok", err);
    }
  };

  // Real-time statistics counters for high density header matching the prompt spec
  const activeGroupsCount = groups.length;
  const completedGroupsCount = groups.filter(g => g.status === "completed").length;
  const successfulCount = groups.filter(g => g.conclusion === "Berhasil").length;
  const inProgressCount = groups.filter(g => g.status !== "completed").length;

  const averageFermentationHours = () => {
    let totals = 0;
    let count = 0;
    groups.forEach(g => {
      if (g.form3?.observationLogs) {
        g.form3.observationLogs.forEach(l => {
          totals += l.fermentationHours;
          count++;
        });
      }
    });
    return count > 0 ? (totals / count).toFixed(1) : "0.0";
  };

  const calculatedCompletionRate = () => {
    if (groups.length === 0) return 0;
    return Math.round((completedGroupsCount / groups.length) * 100);
  };

  return (
    <div id="root-layout" className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden select-none">
      
      {/* 1. Header (Design match: h-14 bg-white border-b) */}
      <header id="main-header" className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-sm">
            Y
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-800 flex items-center gap-1.5">
              YogurtLab <span className="text-slate-350 text-xs font-normal">|</span> <span className="text-slate-600 text-xs font-normal">Student Logbook Tracker</span>
            </h1>
          </div>
        </div>

        {/* Dense Status Indicator Badges in Header */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span> 
              {activeGroupsCount} Kelompok Terdaftar
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 
              {completedGroupsCount} Jurnal Selesai
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-slate-200 flex items-center justify-center text-white text-[10px] font-extrabold shadow-3xs" title="User Session Profile">
            EDU
          </div>
        </div>
      </header>

      {/* 2. Main Page Container (Sidebar left, content right) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Aside Navigation (Design match: w-56 border-r bg-white) */}
        <aside id="main-sidebar" className="w-56 border-r border-slate-200 bg-white flex flex-col p-4 shrink-0 justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block">
              PILIH ROLE AKSES
            </span>

            <nav className="space-y-1">
              <button
                id="role-teacher-tab"
                onClick={() => handleRoleChange("teacher")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all ${
                  role === "teacher"
                    ? "bg-indigo-50 text-indigo-700 shadow-3xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Users className="w-4 h-4" />
                Panel Utama Guru
              </button>

              <button
                id="role-student-tab"
                onClick={() => handleRoleChange("student")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all ${
                  role === "student"
                    ? "bg-indigo-50 text-indigo-700 shadow-3xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                Logbook Unggah Siswa
              </button>
            </nav>

            <div className="pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">KELAS PRAKTIKUM</span>
                <p className="text-xs font-bold text-slate-700">Mata Pelajaran IPA</p>
                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${calculatedCompletionRate()}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold pt-0.5">
                  <span>Progres Kelas:</span>
                  <span>{calculatedCompletionRate()}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Logic Rules box (from design specs) */}
          <div className="p-3 bg-slate-950 rounded-xl text-white">
            <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Sistem Logika
            </p>
            <p className="text-[10px] leading-relaxed text-slate-300">
              Yogurt dianggap <span className="text-emerald-400 font-bold">Berhasil</span> jika Form 1-3 lengkap, inkubasi berkisar <span className="text-indigo-300 font-mono font-bold">8-12 Jam</span>, dan tekstur konsistensi <span className="text-sky-300 font-bold">Kental/Creamy</span>.
            </p>
          </div>
        </aside>

        {/* Right Main Scrollable View Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          
          {/* Sub-header metric bar (from high-density design template) */}
          <section className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex gap-8 overflow-x-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rerata Masa Fermentasi</span>
                <span className="text-lg font-extrabold text-slate-800">{averageFermentationHours()} Jam</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Persentase Pengumpulan</span>
                <span className="text-lg font-extrabold text-slate-800">{calculatedCompletionRate()}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tim Berhasil Evaluasi</span>
                <span className="text-lg font-extrabold text-emerald-600">{successfulCount} Kelompok</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rasio Kontrol Kualitas</span>
                <span className="text-lg font-extrabold text-slate-700">Optimal (8-12h)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-[10px] text-slate-400 font-medium">Instruktur aktif: <span className="font-bold text-slate-600">afifattamimi@gmail.com</span></span>
            </div>
          </section>

          {/* Active Dashboard Body Frame */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold">Sambungan Server Bermasalah</h4>
                  <p className="text-slate-500 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {role === "teacher" ? (
              <TeacherDashboard
                groups={groups}
                isLoading={isLoading}
                onRefresh={fetchGroups}
                onDeleteGroup={handleDeleteGroup}
                onAddGroup={handleAddGroup}
              />
            ) : (
              <StudentDashboard
                groups={groups}
                activeGroupId={activeGroupId}
                onLogin={handleStudentLogin}
                onLogout={handleStudentLogout}
                onRefreshGroup={fetchGroups}
                onUpdateForm1={handleUpdateForm1}
                onUpdateForm2={handleUpdateForm2}
                onAddObservationLog={handleAddObservationLog}
                onDeleteObservationLog={handleDeleteObservationLog}
                onResetGroup={handleResetGroup}
              />
            )}
          </div>

        </main>

      </div>
    </div>
  );
}
