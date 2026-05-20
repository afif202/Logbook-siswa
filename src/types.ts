export interface ObservationLog {
  id: string;
  timestamp: string;
  pH: number;
  texture: 'thick/creamy' | 'medium/smooth' | 'watery';
  aroma: 'sour' | 'fresh/sweet' | 'foul/rotten';
  fermentationHours: number;
  note: string;
}

export interface Form1Data {
  ingredients: string[];
  tools: string[];
  initialSetup: string;
  submittedAt: string;
}

export interface PhotoUpload {
  id: string;
  url: string; // Base64 or mock url
  caption: string;
  uploadedAt: string;
}

export interface Form2Data {
  photos: PhotoUpload[];
  videoUrl?: string;
  stepDescription: string;
  submittedAt: string;
}

export interface Form3Data {
  observationLogs: ObservationLog[];
  submittedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  secretCode: string;
  status: 'planning' | 'production' | 'observation' | 'completed';
  conclusion?: 'Berhasil' | 'Kurang Berhasil';
  conclusionReason?: string;
  form1?: Form1Data;
  form2?: Form2Data;
  form3?: Form3Data;
  updatedAt: string;
}
