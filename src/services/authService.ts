import { LoginRequest, LoginResponse, ProfileResponse } from "../types/api";

const API_BASE_URL = "https://absensi.dataciptacelebes.com/api";

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
