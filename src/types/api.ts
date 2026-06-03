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

// ── Izin ──
export interface JenisIzin {
  id: number;
  nama: string;
  kode: string;
  butuh_surat: boolean;
  max_hari: number | null;
}

export interface JenisIzinResponse {
  success: boolean;
  message: string;
  data: JenisIzin[];
}

export interface IzinRecord {
  id: number;
  jenis_izin: string;
  tgl_mulai: string;
  tgl_selesai: string;
  jumlah_hari: number;
  alasan: string;
  file_surat_url: string | null;
  status: string; // Pending | Approved | Rejected
  catatan_admin: string | null;
  created_at: string;
}

export interface IzinListResponse {
  success: boolean;
  message: string;
  data: IzinRecord[];
}

export interface CreateIzinRequest {
  jenis_izin_id: number;
  tgl_mulai: string; // YYYY-MM-DD
  tgl_selesai: string; // YYYY-MM-DD
  alasan: string;
  file_surat?: PhotoFile;
}

export interface CreateIzinResponse {
  success: boolean;
  message: string;
  data: { id: number; status: string };
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
  foto_url: string;
  shift?: Shift;
  no_hp?: string;
  alamat?: string;
}

export interface AbsensiStatistik {
  bulan: number;
  tahun: number;
  hadir: number;
  tepat_waktu: number;
  terlambat: number;
  izin: number;
  cepat_pulang: number;
  alfa: number;
  total_hari_kerja: number;
  kuota_cuti: number;
  cuti_terpakai: number;
  sisa_cuti: number;
}

export interface StatistikResponse {
  success: boolean;
  message: string;
  data: AbsensiStatistik;
}

export interface PhotoFile {
  uri: string;
  type: string; // mime type, contoh: "image/jpeg"
  name: string; // nama file, contoh: "profile.jpg"
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  nama_lengkap: string;
  no_telp?: string;
  alamat?: string;
  foto?: PhotoFile;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  role_slug: string;
  permissions: string[]; // slug menu yang boleh diakses, atau ['*'] = super-admin
  pending_izin_count: number;
  pegawai: Pegawai;
}

// Helper: cek apakah user punya permission untuk slug tertentu
export const hasPermission = (user: UserProfile | null, slug: string): boolean => {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(slug);
};

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

// ── Kelola Izin (Admin) ──
export interface AdminIzinRecord {
  id: number;
  pegawai: {
    id: number;
    nama: string;
    jabatan: string;
    divisi: string;
    foto_url: string | null;
  };
  jenis_izin: string;
  tgl_mulai: string;
  tgl_selesai: string;
  jumlah_hari: number;
  alasan: string;
  file_surat_url: string | null;
  status: string;
  catatan_admin: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface AdminIzinListResponse {
  success: boolean;
  message: string;
  data: AdminIzinRecord[];
}

// ── Informasi (Berita) ──
export interface InformasiRecord {
  id: number;
  judul: string;
  isi: string;
  gambar_url: string | null;
  created_by: string;
  created_at: string;
  created_at_human: string;
}

export interface InformasiResponse {
  success: boolean;
  message: string;
  // data adalah Laravel paginator: item ada di data.data
  data: {
    data: InformasiRecord[];
    current_page: number;
    last_page: number;
    total: number;
  };
}
