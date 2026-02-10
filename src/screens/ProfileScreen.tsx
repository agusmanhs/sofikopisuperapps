import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { UserProfile } from "../types/api";

export const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await tokenService.getToken();
      if (token) {
        const response = await authService.getProfile(token);
        setUser(response.data);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya, Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            await tokenService.removeToken();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* StatusBar Transparan agar Header Merah Full ke Atas */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- HEADER SECTION --- */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={COLORS.primaryGradient}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header Content Wrapper */}
            <View style={styles.headerContent}>
              {/* TOMBOL BACK MANUAL (NEW) */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.headerTitleText}>Profil Saya</Text>

              {/* Dummy View agar Title ke tengah */}
              <View style={{ width: 24 }} />
            </View>
          </LinearGradient>

          <View style={styles.circleDecoration} />
        </View>

        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: COLORS.primary + "10" },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user
                    ? getInitials(user.pegawai?.nama_lengkap || user.name)
                    : "A"}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoCenter}>
            <Text style={styles.nameText}>
              {user?.pegawai?.nama_lengkap || user?.name}
            </Text>
            <Text style={styles.roleText}>
              {user?.pegawai?.divisi || user?.role}
            </Text>
            <View style={styles.statusChip}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Karyawan Aktif</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>NIP / NIK</Text>
              <Text style={styles.gridValue}>{user?.pegawai?.nip || "-"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Jabatan</Text>
              <Text style={styles.gridValue}>
                {user?.pegawai?.jabatan || "-"}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Email</Text>
              <Text style={styles.gridValue}>{user?.email}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>No. HP</Text>
              <Text style={styles.gridValue}>
                {user?.pegawai?.no_hp || "-"}
              </Text>
            </View>
            <View style={[styles.gridItem, { width: "100%" }]}>
              <Text style={styles.gridLabel}>Shift Kerja</Text>
              <Text style={styles.gridValue}>
                {user?.pegawai?.shift
                  ? `${user.pegawai.shift.nama} (${user.pegawai.shift.jam_masuk} - ${user.pegawai.shift.jam_pulang})`
                  : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* --- MENU OPTIONS --- */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuHeader}>Akun & Keamanan</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconBox, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color="#2196F3"
              />
            </View>
            <Text style={styles.menuText}>Edit Data Diri</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconBox, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#FF9800" />
            </View>
            <Text style={styles.menuText}>Ubah Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <Text style={[styles.menuHeader, { marginTop: 20 }]}>Lainnya</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF5252" />
            <Text style={styles.logoutText}>Keluar Aplikasi</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Versi Aplikasi 1.0.0 (Beta)</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F5F9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 40 },

  // HEADER (UPDATED)
  headerContainer: { height: 180, position: "relative", marginBottom: 60 },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 40, // Padding untuk StatusBar
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitleText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  circleDecoration: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // STYLES LAIN TETAP SAMA...
  profileCard: {
    marginHorizontal: 20,
    marginTop: -80,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: { marginTop: -50, marginBottom: 15 },
  avatarWrapper: { position: "relative" },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: COLORS.primary },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoCenter: { alignItems: "center", marginBottom: 20 },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  roleText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  activeText: { fontSize: 10, color: "#2E7D32", fontWeight: "bold" },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%" },
  gridItem: { width: "50%", marginBottom: 15, paddingHorizontal: 5 },
  gridLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  gridValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  menuContainer: { paddingHorizontal: 20, marginTop: 25 },
  menuHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  logoutText: { color: "#D32F2F", fontWeight: "bold", marginLeft: 8 },
  versionText: {
    textAlign: "center",
    color: "#ccc",
    fontSize: 10,
    marginTop: 20,
  },
});
