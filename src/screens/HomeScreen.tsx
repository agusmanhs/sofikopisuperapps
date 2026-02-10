import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

// Import Service & Types
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { UserProfile, AbsensiRecord } from "../types/api";

const { width } = Dimensions.get("window");

// --- DATA DUMMY ---
const MENUS = [
  { id: 1, title: "Izin", icon: "document-text-outline", color: "#2F80ED" },
  { id: 2, title: "Lembur", icon: "timer-outline", color: "#F2994A" },
  { id: 3, title: "Shift", icon: "time-outline", color: "#27AE60" },
  { id: 4, title: "Reimburse", icon: "cash-outline", color: "#EB5757" },
  { id: 5, title: "Aktivitas", icon: "clipboard-outline", color: "#6FCF97" },
  { id: 6, title: "Berita", icon: "newspaper-outline", color: "#56CCF2" },
  { id: 7, title: "Slip Gaji", icon: "wallet-outline", color: "#BB6BD9" },
  { id: 8, title: "Lainnya", icon: "grid-outline", color: "#7f8c8d" },
];

const NEWS = [
  {
    id: 1,
    title: "Libur Nasional & Cuti Bersama 2026",
    date: "12 Feb 2026",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tag: "Pengumuman",
  },
  {
    id: 2,
    title: "Gathering Tahunan Staff di Bali",
    date: "10 Feb 2026",
    image:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tag: "Event",
  },
];

// DATA TUGAS (NEW)
const TASKS = [
  {
    id: 1,
    title: "Approval Lembur",
    desc: "2 Staff menunggu",
    icon: "checkmark-done-circle",
    gradient: ["#2F80ED", "#56CCF2"] as const, // Biru
  },
  {
    id: 2,
    title: "Upload Bukti",
    desc: "Sakit tgl 1 Feb",
    icon: "cloud-upload",
    gradient: ["#F2994A", "#F2C94C"] as const, // Orange
  },
  {
    id: 3,
    title: "Update Profil",
    desc: "Lengkapi alamat",
    icon: "alert-circle",
    gradient: ["#EB5757", "#FF5E62"] as const, // Merah
  },
];

export const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [todayAbsen, setTodayAbsen] = useState<AbsensiRecord | null>(null);
  const [timezoneLabel, setTimezoneLabel] = useState("WIB");

  const now = new Date();
  const optionsDay: Intl.DateTimeFormatOptions = { weekday: "long" };
  const optionsDate: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dayName = now.toLocaleDateString("id-ID", optionsDay);
  const dateFull = now.toLocaleDateString("id-ID", optionsDate);

  const getTodayDateString = () => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    fetchUserData();
    detectTimezone();
  }, []);

  const detectTimezone = () => {
    const offset = now.getTimezoneOffset() / -60;
    if (offset === 7) setTimezoneLabel("WIB");
    else if (offset === 8) setTimezoneLabel("WITA");
    else if (offset === 9) setTimezoneLabel("WIT");
    else setTimezoneLabel("Loc");
  };

  const fetchUserData = async () => {
    try {
      const token = await tokenService.getToken();
      if (token) {
        const response = await authService.getProfile(token);
        setUser(response.data);

        const history = (response.data as any).absensi_history || [];
        const todayStr = getTodayDateString();
        const found = history.find(
          (record: any) => record.tanggal === todayStr,
        );
        setTodayAbsen(found || null);
      }
    } catch (error) {
      console.error("Home Error:", error);
    }
  };

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={COLORS.primaryGradient}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.userSection}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.greeting}>
                    Halo,{" "}
                    {user
                      ? getFirstName(user.pegawai?.nama_lengkap || user.name)
                      : "Staff"}
                  </Text>
                  <Text style={styles.role}>
                    {user ? user.pegawai?.divisi || user.role : "Memuat..."}
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.appLogo}>abSenin</Text>
            </View>
          </LinearGradient>
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.labelTime}>Jadwal Shift</Text>
              <Text style={styles.timeText}>
                {user?.pegawai?.shift
                  ? `${user.pegawai.shift.jam_masuk.slice(0, 5)} - ${user.pegawai.shift.jam_pulang.slice(0, 5)}`
                  : "08.00 - 17.00"}{" "}
                {timezoneLabel}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dateText}>{dayName},</Text>
              <Text style={styles.dateText}>{dateFull}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceStatus}>
              Masuk :{" "}
              <Text
                style={{
                  color: todayAbsen?.jam_masuk
                    ? COLORS.success
                    : COLORS.textSecondary,
                  fontWeight: "bold",
                }}
              >
                {todayAbsen?.jam_masuk || "--:--"}
              </Text>
            </Text>
            <Text style={styles.attendanceStatus}>
              Pulang :{" "}
              <Text
                style={{
                  color: todayAbsen?.jam_pulang
                    ? COLORS.success
                    : COLORS.textSecondary,
                  fontWeight: "bold",
                }}
              >
                {todayAbsen?.jam_pulang || "--:--"}
              </Text>
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Ringkasan Bulan Ini</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Hadir</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  8
                </Text>
                <View
                  style={[styles.statBar, { backgroundColor: COLORS.success }]}
                />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Izin</Text>
                <Text style={[styles.statValue, { color: COLORS.info }]}>
                  1
                </Text>
                <View
                  style={[styles.statBar, { backgroundColor: COLORS.info }]}
                />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Cuti</Text>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>
                  6
                </Text>
                <View
                  style={[styles.statBar, { backgroundColor: COLORS.warning }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* --- NEW SECTION: TASK / TUGAS --- */}
        <View style={styles.taskWrapper}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>
              Tugas Anda{" "}
              <Text style={{ color: COLORS.primary, fontSize: 12 }}>(3)</Text>
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.taskScroll}
          >
            {TASKS.map((task) => (
              <TouchableOpacity key={task.id} activeOpacity={0.9}>
                <LinearGradient
                  // @ts-ignore
                  colors={task.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.taskCard}
                >
                  <View style={styles.taskIconCircle}>
                    {/* @ts-ignore */}
                    <Ionicons
                      name={task.icon}
                      size={20}
                      color={task.gradient[0]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDesc}>{task.desc}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#fff"
                    style={{ opacity: 0.8 }}
                  />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* MENU CARD */}
        <View style={styles.menuWrapper}>
          <Text style={styles.sectionHeader}>Menu Utama</Text>
          <View style={styles.menuCard}>
            <View style={styles.grid}>
              {MENUS.map((menu) => (
                <TouchableOpacity key={menu.id} style={styles.menuItem}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: menu.color + "15" },
                    ]}
                  >
                    {/* @ts-ignore */}
                    <Ionicons name={menu.icon} size={28} color={menu.color} />
                  </View>
                  <Text style={styles.menuText}>{menu.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION BERITA */}
        <View style={styles.newsSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>Informasi Terbaru</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsScroll}
          >
            {NEWS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.newsCard}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.image }} style={styles.newsImage} />
                <View style={styles.newsTag}>
                  <Text style={styles.newsTagText}>{item.tag}</Text>
                </View>
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.newsFooter}>
                    <Ionicons name="calendar-outline" size={12} color="#888" />
                    <Text style={styles.newsDate}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingTop: 0, paddingBottom: 50 },

  // Header & Info Card (Tetap sama)
  headerWrapper: { height: 250, marginBottom: -50, zIndex: 0 },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  greeting: { color: COLORS.white, fontSize: 14 },
  role: { color: COLORS.white, fontSize: 14, fontWeight: "bold" },
  appLogo: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    fontStyle: "italic",
  },

  infoCard: {
    marginHorizontal: 20,
    marginTop: -80,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  labelTime: { fontSize: 12, color: COLORS.textSecondary },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 4,
  },
  dateText: { fontSize: 12, color: COLORS.textSecondary, textAlign: "right" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  attendanceStatus: { fontSize: 13, color: COLORS.text },
  statsContainer: { marginTop: 5 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { width: "30%", alignItems: "center" },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  statValue: { fontSize: 18, fontWeight: "bold", marginVertical: 4 },
  statBar: { height: 4, borderRadius: 2, width: "50%" },

  // --- TASK STYLES (NEW) ---
  taskWrapper: { marginTop: 25 }, // Jarak dari Info Card
  taskScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  taskCard: {
    width: 180, // Ukuran kecil & compact
    height: 80,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  taskIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  taskTitle: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  taskDesc: { fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 2 },

  // MENU STYLES
  menuWrapper: { marginTop: 15, paddingHorizontal: 20 }, // Jarak sedikit dari Task
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  menuItem: { width: "25%", alignItems: "center", marginBottom: 20 },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuText: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "500",
  },

  // NEWS STYLES
  newsSection: { marginTop: 25 },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  seeAllText: { fontSize: 12, color: COLORS.primary, fontWeight: "bold" },
  newsScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  newsCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    overflow: "hidden",
  },
  newsImage: { width: "100%", height: 140, backgroundColor: "#eee" },
  newsTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsTagText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  newsContent: { padding: 15 },
  newsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  newsFooter: { flexDirection: "row", alignItems: "center" },
  newsDate: { fontSize: 11, color: "#888", marginLeft: 5 },
});
