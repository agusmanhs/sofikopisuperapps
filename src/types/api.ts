export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string; // Ini nama field yang benar dari API Anda
    token_type: string;
    user: any;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Untuk Profile API Response
export interface Shift {
  id: number;
  nama: string;
  jam_masuk: string;
  jam_pulang: string;
}

export interface Pegawai {
  id: number;
  nip: string;
  nama_lengkap: string;
  jabatan: string;
  divisi: string;
  kantor: string;
  foto_url: string; // Path relatif, nanti kita tambah base URL
  shift?: Shift;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  pegawai: Pegawai; // Object pegawai bersarang
  // absensi_history bisa kita abaikan dulu di screen ini jika tidak dipakai
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

// Untuk History Absensi Response
export interface AbsensiRecord {
  id: number;
  tanggal: string; // "2026-02-06"
  jam_masuk: string;
  jam_pulang: string;
  status: string; // "Terlambat"
  durasi_kerja: string;
  foto_masuk_url: string;
  foto_pulang_url: string;
  lokasi_masuk: string;
  lokasi_pulang: string;
}

export interface HistoryResponse {
  success: boolean;
  message: string;
  data: AbsensiRecord[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
