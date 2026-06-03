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
import { UserProfile } from "../types/api";

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export const EditProfileScreen = ({ navigation, route }: any) => {
  const params = route.params ?? {};
  const { user, onSaved }: { user: UserProfile; onSaved?: () => void } = params as any;

  const [namaLengkap, setNamaLengkap] = useState(
    user.pegawai?.nama_lengkap || ""
  );
  const [noHp, setNoHp] = useState(user.pegawai?.no_hp || "");
  const [alamat, setAlamat] = useState(user.pegawai?.alamat || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!namaLengkap.trim()) {
      Alert.alert("Perhatian", "Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await tokenService.getToken();
      if (!token) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

      await authService.updateProfile(token, {
        name: user.name,
        email: user.email,
        nama_lengkap: namaLengkap.trim(),
        no_telp: noHp.trim(),
        alamat: alamat.trim(),
      });

      Alert.alert("Berhasil", "Data diri berhasil diperbarui.", [
        {
          text: "OK",
          onPress: () => {
            onSaved?.();
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Gagal", error.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <AppHeader title="Edit Data Diri" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── AVATAR ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {getInitials(namaLengkap || user.name)}
              </Text>
            </View>
            <Text style={styles.avatarSubtitle}>
              {user.pegawai?.jabatan || user.role}
            </Text>
            <Text style={styles.avatarDivisi}>
              {user.pegawai?.divisi}
            </Text>
          </View>

          {/* ── FORM EDITABLE ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Informasi yang Dapat Diubah</Text>

            <InputField
              icon="person-outline"
              label="Nama Lengkap"
              value={namaLengkap}
              onChangeText={setNamaLengkap}
              placeholder="Masukkan nama lengkap"
              autoCapitalize="words"
            />

            <InputField
              icon="call-outline"
              label="No. HP / WhatsApp"
              value={noHp}
              onChangeText={setNoHp}
              placeholder="Contoh: 08123456789"
              keyboardType="phone-pad"
            />

            <InputField
              icon="location-outline"
              label="Alamat"
              value={alamat}
              onChangeText={setAlamat}
              placeholder="Masukkan alamat lengkap"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* ── INFO READ-ONLY ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Informasi Akun</Text>

            <ReadOnlyField icon="mail-outline" label="Email" value={user.email} />
            <ReadOnlyField
              icon="briefcase-outline"
              label="Jabatan"
              value={user.pegawai?.jabatan || "-"}
            />
            <ReadOnlyField
              icon="business-outline"
              label="Divisi"
              value={user.pegawai?.divisi || "-"}
            />
            <ReadOnlyField
              icon="card-outline"
              label="NIP"
              value={user.pegawai?.nip || "-"}
              isLast
            />
          </View>

          {/* ── SAVE BUTTON ── */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ── Sub-components ── */

const InputField = ({
  icon,
  label,
  multiline,
  numberOfLines,
  ...inputProps
}: {
  icon: string;
  label: string;
  multiline?: boolean;
  numberOfLines?: number;
  [key: string]: any;
}) => (
  <View style={inputStyles.wrapper}>
    <View style={inputStyles.labelRow}>
      <Ionicons name={icon as any} size={14} color={COLORS.primary} />
      <Text style={inputStyles.label}>{label}</Text>
    </View>
    <TextInput
      style={[inputStyles.input, multiline && inputStyles.inputMultiline]}
      placeholderTextColor="#bbb"
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? "top" : "center"}
      {...inputProps}
    />
  </View>
);

const ReadOnlyField = ({
  icon,
  label,
  value,
  isLast,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[readOnlyStyles.row, isLast && { borderBottomWidth: 0 }]}>
    <View style={readOnlyStyles.iconBox}>
      <Ionicons name={icon as any} size={16} color="#aaa" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={readOnlyStyles.label}>{label}</Text>
      <Text style={readOnlyStyles.value}>{value}</Text>
    </View>
    <Ionicons name="lock-closed-outline" size={13} color="#ccc" />
  </View>
);

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },

  avatarSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  avatarSubtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
  },
  avatarDivisi: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#ebebeb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 46,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 11,
  },
});

const readOnlyStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
});
