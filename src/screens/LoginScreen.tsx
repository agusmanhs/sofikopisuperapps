import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { CustomInput } from "../components/CustomInput";
import { CustomButton } from "../components/CustomButton";
import { authService } from "../services/authService";
import { COLORS } from "../constants/colors";
import { tokenService } from "../services/tokenService";

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      // Panggil Service
      const response = await authService.login({ email, password });

      // DEBUG: Lihat respon di terminal untuk memastikan
      console.log("Login Response:", JSON.stringify(response, null, 2));

      // PERBAIKAN LOGIC PENGAMBILAN TOKEN:
      // Cek apakah ada object 'data' dan di dalamnya ada 'access_token'
      if (response.data && response.data.access_token) {
        // Simpan token yang benar (response.data.access_token)
        await tokenService.saveToken(response.data.access_token);

        Alert.alert("Berhasil", "Login sukses! Selamat datang.");

        // Pindah ke Main Screen
        navigation.replace("Main");
      } else {
        // Jika struktur JSON berbeda atau gagal
        Alert.alert("Gagal", "Format token tidak dikenali dari server.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Gagal", error.message || "Terjadi kesalahan saat login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Image
              source={require("../assets/images/logo-merah.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Absensi Mobile</Text>
            <Text style={styles.subtitle}>Login User</Text>
          </View>

          <CustomInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="contoh@email.com"
            autoCapitalize="none"
          />

          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="******"
          />

          <CustomButton
            title="MASUK"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={isLoading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Versi 1.0.0</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 90, height: 90, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
  footer: { marginTop: 20, alignItems: "center" },
  footerText: { color: "#aaa", fontSize: 12 },
});
