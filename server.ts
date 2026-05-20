import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Group, ObservationLog } from "./src/types.js"; // In Node ESM/CJS transpiled code, simple imports work

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Middleware
app.use(express.json({ limit: "50mb" })); // Support large base64 photo uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper: Run Conclusion Logic
function updateGroupConclusion(group: Group): Group {
  const hasForm1 = !!group.form1 && group.form1.ingredients.length > 0;
  const hasForm2 = !!group.form2 && group.form2.stepDescription.trim().length > 0;
  const logs = group.form3?.observationLogs || [];
  const hasForm3 = logs.length > 0;

  if (hasForm1 && hasForm2 && hasForm3) {
    // Stage completed
    group.status = "completed";
    
    // Evaluate the final observation log or look through logs for a successful result
    // The prompt says: "if Fermentation time is between 8-12 hours AND texture is 'thick/creamy', status = 'Successful' (Berhasil), else 'In need of improvement' (Kurang Berhasil)."
    // Let's check the latest log entry
    const latestLog = logs[logs.length - 1];
    
    const ferHours = latestLog.fermentationHours;
    const isFermentationOk = ferHours >= 8 && ferHours <= 12;
    const isTextureOk = latestLog.texture === "thick/creamy";

    if (isFermentationOk && isTextureOk) {
      group.conclusion = "Berhasil";
      group.conclusionReason = `Proyek Berhasil! Fermentasi ${ferHours} jam (sesuai target 8-12 jam) dengan tekstur ${latestLog.texture === "thick/creamy" ? "Kental/Creamy" : latestLog.texture}.`;
    } else {
      group.conclusion = "Kurang Berhasil";
      const reasons: string[] = [];
      if (!isFermentationOk) {
        reasons.push(`waktu fermentasi ${ferHours} jam di luar target ideal (8-12 jam)`);
      }
      if (!isTextureOk) {
        const textIndo = latestLog.texture === "watery" ? "Encer (Watery)" : latestLog.texture === "medium/smooth" ? "Sedang/Lembut" : latestLog.texture;
        reasons.push(`tekstur akhir adalah ${textIndo} (ideal: Kental/Creamy)`);
      }
      group.conclusionReason = `Proyek Kurang Berhasil karena: ${reasons.join(" dan ")}.`;
    }
  } else {
    // Still in progress
    if (hasForm3) {
      group.status = "observation";
    } else if (hasForm2) {
      group.status = "production";
    } else {
      group.status = "planning";
    }
    group.conclusion = undefined;
    group.conclusionReason = undefined;
  }
  
  group.updatedAt = new Date().toISOString();
  return group;
}

// Default/Initial Data
const initialGroups: Group[] = [
  {
    id: "group-1",
    name: "Kelompok 1 (Alpha Yogurt)",
    secretCode: "1011",
    status: "completed",
    conclusion: "Berhasil",
    conclusionReason: "Proyek Berhasil! Fermentasi 10 jam (sesuai target 8-12 jam) dengan tekstur Kental/Creamy.",
    updatedAt: new Date().toISOString(),
    form1: {
      ingredients: ["1 Liter Susu Sapi Segar", "2 Sendok Starter Yogurt Plain (Lactobacillus)", "50g Susu Bubuk Skim (biar kental)"],
      tools: ["Panci Stainless Steel", "Termometer Makanan", "Pengocok Balon (Whisk)", "Wadah Kaca Steril", "Cooler Box pendingin"],
      initialSetup: "Melakukan sterilisasi semua alat makan dan wadah kaca dengan air mendidih selama 10 menit guna menyingkirkan kontaminasi bakteri liar. Mempersiapkan bahan di meja steril.",
      submittedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    form2: {
      stepDescription: "1. Keringkan wadah setelah disterilisasi.\n2. Panaskan susu sapi segar di panci hingga mencapai suhu 85°C menggunakan termometer makanan, jaga agar tidak mendidih bergejolak (pasteurisasi).\n3. Dinginkan susu dalam suhu ruang sampai hangat hangat kuku (sekitar 43°C).\n4. Ambil 2 sendok yogurt plain starter, aduk merata ke dalam susu hangat.\n5. Tuang ke wadah kaca steril, tutup rapat, dan langsung masukkan ke dalam cooler box hangat.",
      photos: [
        {
          id: "photo-11",
          url: "https://images.unsplash.com/photo-1571244856341-4f3dd95bf37d?auto=format&fit=crop&q=80&w=600",
          caption: "Proses pasteurisasi susu di atas panci stainless steel dengan suhu 85 derajat Celsius",
          uploadedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        },
        {
          id: "photo-12",
          url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600",
          caption: "Penuangan yogurt starter ke dalam susu hangat, diaplikasikan higienis di wadah steril",
          uploadedAt: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
        }
      ],
      submittedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    },
    form3: {
      observationLogs: [
        {
          id: "log-11",
          timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
          pH: 5.6,
          texture: "watery",
          aroma: "fresh/sweet",
          fermentationHours: 4,
          note: "Fermentasi baru berjalan 4 jam di cooler box. Tekstur masih cair mirip susu biasa, rasa agak sedikit asam manis belum kental."
        },
        {
          id: "log-12",
          timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
          pH: 4.4,
          texture: "thick/creamy",
          aroma: "sour",
          fermentationHours: 10,
          note: "Target 10 jam terpenuhi! Struktur luar biasa kental lembut, tidak berbau ragi, aroma asam segar khas yogurt greek berkilat."
        }
      ],
      submittedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    }
  },
  {
    id: "group-2",
    name: "Kelompok 2 (LactoJoy)",
    secretCode: "2022",
    status: "completed",
    conclusion: "Kurang Berhasil",
    conclusionReason: "Proyek Kurang Berhasil karena: waktu fermentasi 5 jam di luar target ideal (8-12 jam) dan tekstur akhir adalah Encer (Watery) (ideal: Kental/Creamy).",
    updatedAt: new Date().toISOString(),
    form1: {
      ingredients: ["1 Liter Susu UHT Cair", "1 Botol Yakult starter"],
      tools: ["Wadah rice cooker", "Sendok plastik steril"],
      initialSetup: "Menyeka wadah kaca dengan tisu basah beralkohol kemudian dikeringkan. Susu dituang langsung.",
      submittedAt: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    },
    form2: {
      stepDescription: "Susu langsung dicampur starter Yakult dalam inkubasi rice cooker menggunakan mode 'Warm' yang ditutup kain.",
      photos: [
        {
          id: "photo-21",
          url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=600",
          caption: "Campuran starter Yakult siap diaduk ke dalam susu cair UHT",
          uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        }
      ],
      submittedAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    },
    form3: {
      observationLogs: [
        {
          id: "log-21",
          timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          pH: 5.2,
          texture: "watery",
          aroma: "fresh/sweet",
          fermentationHours: 5,
          note: "Karena jam pelajaran praktek hampir selesai, kami membuka inkubasi lebih cepat (5 jam). Teksturnya masih sangat encer mirip susu, sedikit terasa asam tipis."
        }
      ],
      submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    }
  },
  {
    id: "group-3",
    name: "Kelompok 3 (BioYogurt)",
    secretCode: "3033",
    status: "planning",
    updatedAt: new Date().toISOString(),
    form1: {
      ingredients: ["1 Liter Susu Kambing murni", "3 Sendok Yogurt Probiotik"],
      tools: ["Termometer Digital", "Gelas Kimia 1000ml", "Inkubator Lab Sekolah"],
      initialSetup: "Menghidupkan inkubator sekolah di setting suhu 42 derajat. Mensterilkan gelas kimia 1L dengan autoclave mini milik laboratorium biologi.",
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    }
  }
];

// Helper to Load/Save DB File
function readDB(): Group[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialGroups, null, 2), "utf8");
      return initialGroups;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file", err);
    return initialGroups;
  }
}

function writeDB(data: Group[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Seed Database on startup
readDB();

// API Endpoints
// Get all groups (Teacher dashboard or dropdowns)
app.get("/api/groups", (req, res) => {
  const data = readDB();
  res.json(data);
});

// Create a new group
app.post("/api/groups", (req, res) => {
  const { name, secretCode } = req.body;
  
  if (!name || !secretCode) {
    return res.status(400).json({ error: "Nama kelompok dan Kode Rahasia wajib diisi!" });
  }

  const db = readDB();
  const existingCode = db.find(g => g.secretCode === secretCode);
  if (existingCode) {
    return res.status(400).json({ error: "Kode rahasia ini sudah digunakan oleh kelompok lain! Silakan buat kode unik." });
  }

  const newGroup: Group = {
    id: "group-" + Date.now(),
    name,
    secretCode,
    status: "planning",
    updatedAt: new Date().toISOString()
  };

  db.push(newGroup);
  writeDB(db);
  res.status(201).json(newGroup);
});

// Get a specific group details
app.get("/api/groups/:id", (req, res) => {
  const db = readDB();
  const group = db.find(g => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }
  res.json(group);
});

// Update group general info (e.g., rename by teacher)
app.put("/api/groups/:id", (req, res) => {
  const { name, secretCode } = req.body;
  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  if (name) db[idx].name = name;
  if (secretCode) db[idx].secretCode = secretCode;
  
  db[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db[idx]);
});

// Delete a group
app.delete("/api/groups/:id", (req, res) => {
  const db = readDB();
  const filtered = db.filter(g => g.id !== req.params.id);
  writeDB(filtered);
  res.json({ success: true, message: "Kelompok berhasil dihapus" });
});

// Reset group logs back to scratch (useful for starting over)
app.post("/api/groups/:id/reset", (req, res) => {
  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  db[idx].status = "planning";
  db[idx].form1 = undefined;
  db[idx].form2 = undefined;
  db[idx].form3 = undefined;
  db[idx].conclusion = undefined;
  db[idx].conclusionReason = undefined;
  db[idx].updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(db[idx]);
});

// Form 1 Logbook Submission (Ingredients & Planning)
app.post("/api/groups/:id/form1", (req, res) => {
  const { ingredients, tools, initialSetup } = req.body;
  
  if (!ingredients || !tools || !initialSetup) {
    return res.status(400).json({ error: "Mohon isi semua field formulir perencanaan!" });
  }

  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  db[idx].form1 = {
    ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split("\n").filter((i: string) => i.trim()),
    tools: Array.isArray(tools) ? tools : tools.split("\n").filter((t: string) => t.trim()),
    initialSetup,
    submittedAt: new Date().toISOString()
  };

  db[idx] = updateGroupConclusion(db[idx]);
  writeDB(db);
  res.json(db[idx]);
});

// Form 2 Logbook Submission (Production & Documentation)
app.post("/api/groups/:id/form2", (req, res) => {
  const { photos, videoUrl, stepDescription } = req.body;
  
  if (!stepDescription) {
    return res.status(400).json({ error: "Deskripsi proses pembuatan yogurt harus diisi!" });
  }

  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  db[idx].form2 = {
    photos: photos || [],
    videoUrl: videoUrl || "",
    stepDescription,
    submittedAt: new Date().toISOString()
  };

  db[idx] = updateGroupConclusion(db[idx]);
  writeDB(db);
  res.json(db[idx]);
});

// Form 3 Logbook Add Observation Log Entry
app.post("/api/groups/:id/form3/log", (req, res) => {
  const { pH, texture, aroma, fermentationHours, note } = req.body;
  
  if (pH === undefined || !texture || !aroma || fermentationHours === undefined || !note) {
    return res.status(400).json({ error: "Semua parameter observasi harian wajib diisi!" });
  }

  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  if (!db[idx].form3) {
    db[idx].form3 = {
      observationLogs: [],
      submittedAt: new Date().toISOString()
    };
  }

  const newLog: ObservationLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    pH: parseFloat(pH),
    texture,
    aroma,
    fermentationHours: parseFloat(fermentationHours),
    note
  };

  db[idx].form3!.observationLogs.push(newLog);
  db[idx].form3!.submittedAt = new Date().toISOString();

  db[idx] = updateGroupConclusion(db[idx]);
  writeDB(db);
  res.json(db[idx]);
});

// Delete an Observation Log entry
app.delete("/api/groups/:id/form3/log/:logId", (req, res) => {
  const db = readDB();
  const idx = db.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Kelompok tidak ditemukan!" });
  }

  if (db[idx].form3 && db[idx].form3!.observationLogs) {
    db[idx].form3!.observationLogs = db[idx].form3!.observationLogs.filter(log => log.id !== req.params.logId);
    if (db[idx].form3!.observationLogs.length === 0) {
      db[idx].form3 = undefined;
    }
  }

  db[idx] = updateGroupConclusion(db[idx]);
  writeDB(db);
  res.json(db[idx]);
});

// App server routing - dev or prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting, listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
