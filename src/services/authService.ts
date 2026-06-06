import { LoginRequest, LoginResponse, ProfileResponse, HistoryResponse, UpdateProfileRequest, UpdateProfileResponse, StatistikResponse, JenisIzinResponse, IzinListResponse, CreateIzinRequest, CreateIzinResponse, AdminIzinListResponse, InformasiResponse } from "../types/api";

const API_BASE_URL = "https://absensi.sofikopi.id/api";

// Host tanpa "/api" — untuk resolve path foto/storage yang relatif
export const MEDIA_BASE_URL = "https://absensi.sofikopi.id";

// Ubah foto_url (bisa relatif "/storage/..") jadi URL absolut yang bisa dimuat <Image>
export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${MEDIA_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Jika ingin melempar error jika status tidak ok
      if (!response.ok) {
        throw new Error(result.message || "Login gagal");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  getProfile: async (token: string): Promise<ProfileResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // Token wajib dikirim
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data profil");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (
    token: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/profile/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      // Laravel validation error (422) punya struktur { message, errors }
      const firstError = result.errors
        ? (Object.values(result.errors)[0] as string[])[0]
        : null;
      throw new Error(firstError || result.message || "Gagal mengubah password");
    }
    return result;
  },

  updateProfile: async (token: string, data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("nama_lengkap", data.nama_lengkap);
      if (data.no_telp !== undefined) formData.append("no_telp", data.no_telp);
      if (data.alamat !== undefined) formData.append("alamat", data.alamat);
      if (data.foto) {
        formData.append("foto", {
          uri: data.foto.uri,
          type: data.foto.type,
          name: data.foto.name,
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui profil");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  getJenisIzin: async (token: string): Promise<JenisIzinResponse> => {
    const response = await fetch(`${API_BASE_URL}/izin/jenis`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal mengambil jenis izin");
    }
    return result;
  },

  getIzinList: async (token: string): Promise<IzinListResponse> => {
    const response = await fetch(`${API_BASE_URL}/izin`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal mengambil riwayat izin");
    }
    return result;
  },

  createIzin: async (token: string, data: CreateIzinRequest): Promise<CreateIzinResponse> => {
    const formData = new FormData();
    formData.append("jenis_izin_id", String(data.jenis_izin_id));
    formData.append("tgl_mulai", data.tgl_mulai);
    formData.append("tgl_selesai", data.tgl_selesai);
    formData.append("alasan", data.alasan);
    if (data.file_surat) {
      formData.append("file_surat", {
        uri: data.file_surat.uri,
        type: data.file_surat.type,
        name: data.file_surat.name,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/izin`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal mengajukan izin");
    }
    return result;
  },

  getInformasi: async (token: string): Promise<InformasiResponse> => {
    const response = await fetch(`${API_BASE_URL}/informasi`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengambil informasi");
    return result;
  },

  getStatistik: async (token: string): Promise<StatistikResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/absensi/statistik`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil statistik");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  getAdminIzinList: async (token: string, status = "Pending"): Promise<AdminIzinListResponse> => {
    const response = await fetch(`${API_BASE_URL}/izin/admin/list?status=${status}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengambil data");
    return result;
  },

  approveIzin: async (token: string, id: number, catatan?: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/izin/admin/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ catatan: catatan ?? "" }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal approve izin");
    return result;
  },

  rejectIzin: async (token: string, id: number, catatan: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/izin/admin/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ catatan }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal reject izin");
    return result;
  },

  getHistory: async (token: string): Promise<HistoryResponse> => {
    try {
      // Kita panggil endpoint history
      const response = await fetch(`${API_BASE_URL}/absensi/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data riwayat");
      }

      return result;
    } catch (error) {
      throw error;
    }
  },
};
