import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

export const tokenService = {
  // Simpan Token (Login)
  saveToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Gagal menyimpan token", error);
    }
  },

  // Ambil Token (Profile / Request API)
  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error("Gagal mengambil token", error);
      return null;
    }
  },

  // Hapus Token (Logout)
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("Gagal menghapus token", error);
    }
  },
};
