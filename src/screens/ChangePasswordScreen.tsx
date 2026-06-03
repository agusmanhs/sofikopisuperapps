import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS } from "../constants/colors";
import { AppHeader } from "../components/AppHeader";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";

export const ChangePasswordScreen = ({ navigation }: any) => {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!current.trim()) {
      Alert.alert("Perhatian", "Password saat ini wajib diisi.");
      return;
    }
    if (newPass.length < 8) {
      Alert.alert("Perhatian", "Password baru minimal 8 karakter.");
      return;
    }
    if (newPass !== confirm) {
      Alert.alert("Perhatian", "Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      const token = await tokenService.getToken();
      if (!token) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

      await authService.changePassword(token, current, newPass, confirm);

      Alert.alert("Berhasil", "Password berhasil diubah.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Gagal", e.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <AppHeader title="Ubah Password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ilustrasi */}
          <View style={styles.iconHero}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.heroText}>Jaga keamanan akun Anda</Text>
            <Text style={styles.heroSubtext}>
              Gunakan password yang kuat dan jangan dibagikan ke siapa pun.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <PasswordField
              label="Password Saat Ini"
              value={current}
              onChangeText={setCurrent}
              show={showCurrent}
              toggle={() => setShowCurrent((s) => !s)}
              placeholder="Masukkan password lama"
            />
            <PasswordField
              label="Password Baru"
              value={newPass}
              onChangeText={setNewPass}
              show={showNew}
              toggle={() => setShowNew((s) => !s)}
              placeholder="Minimal 8 karakter"
            />
            <PasswordField
              label="Konfirmasi Password Baru"
              value={confirm}
              onChangeText={setConfirm}
              show={showConfirm}
              toggle={() => setShowConfirm((s) => !s)}
              placeholder="Ulangi password baru"
              isLast
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>SIMPAN PASSWORD BARU</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ── Sub-component ── */
const PasswordField = ({
  label,
  value,
  onChangeText,
  show,
  toggle,
  placeholder,
  isLast,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  toggle: () => void;
  placeholder: string;
  isLast?: boolean;
}) => (
  <View style={[fieldStyles.wrapper, isLast && { marginBottom: 0 }]}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View style={fieldStyles.inputRow}>
      <Ionicons name="lock-closed-outline" size={18} color="#bbb" />
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={20}
          color="#999"
        />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingTop: 20 },

  iconHero: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  heroText: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  heroSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: { backgroundColor: "#ccc", shadowOpacity: 0, elevation: 0 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "bold", letterSpacing: 0.5 },
});

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.text, marginBottom: 7 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#ebebeb",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
});
