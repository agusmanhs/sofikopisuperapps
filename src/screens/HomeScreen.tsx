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
  Modal,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const TOP_INSET = initialWindowMetrics?.insets.top ?? 47;

// Import Service & Types
import { authService, resolveMediaUrl } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { UserProfile, AbsensiRecord, AbsensiStatistik, InformasiRecord, hasPermission } from "../types/api";

const { width } = Dimensions.get("window");

// --- DATA DUMMY ---
// permission: null = selalu tampil, string = butuh slug tersebut di permissions user
const MENUS = [
  { id: 1, title: "Izin",        icon: "document-text-outline", color: "#2F80ED", permission: "izin-menu",               route: "Izin" },
  { id: 2, title: "Lembur",      icon: "timer-outline",          color: "#F2994A", permission: "absensi-menu",            route: null },
  { id: 3, title: "Rekap",       icon: "bar-chart-outline",      color: "#27AE60", permission: "absensi.rekap",           route: null },
  { id: 4, title: "Kelola Izin", icon: "checkmark-done-outline", color: "#EB5757", permission: "izin.admin",              route: "KelolIzin" },
  { id: 5, title: "Aktivitas",   icon: "clipboard-outline",      color: "#6FCF97", permission: "data-aktivitas",          route: null },
  { id: 6, title: "Berita",      icon: "newspaper-outline",      color: "#56CCF2", permission: "informasi",               route: null },
  { id: 7, title: "Slip Gaji",   icon: "wallet-outline",         color: "#BB6BD9", permission: null,                     route: null },
  { id: 8, title: "Lainnya",     icon: "grid-outline",           color: "#7f8c8d", permission: null,                     route: null },
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

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

// Bersihkan HTML dari rich text editor jadi teks polos yang rapi
const stripHtml = (html: string): string =>
  html
    .replace(/<\/(p|div|br|li|h[1-6])>/gi, "\n") // tutup blok → baris baru
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "• ") // list item → bullet
    .replace(/<[^>]+>/g, "") // hapus sisa tag
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n") // maks 2 baris kosong
    .trim();

// Kartu informasi dengan fallback placeholder jika gambar gagal dimuat
const NewsCard = ({
  item,
  onPress,
}: {
  item: InformasiRecord;
  onPress: () => void;
}) => {
  const [imgError, setImgError] = useState(false);
  const imgUrl = resolveMediaUrl(item.gambar_url);
  const showImage = imgUrl && !imgError;

  return (
    <TouchableOpacity style={styles.newsCard} activeOpacity={0.9} onPress={onPress}>
      {showImage ? (
        <Image
          source={{ uri: imgUrl }}
          style={styles.newsImage}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.newsImage, styles.newsImagePlaceholder]}>
          <Ionicons name="newspaper-outline" size={32} color="#fff" />
        </View>
      )}
      <View style={styles.newsTag}>
        <Text style={styles.newsTagText}>Info</Text>
      </View>
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.judul}
        </Text>
        <View style={styles.newsFooter}>
          <Ionicons name="time-outline" size={12} color="#888" />
          <Text style={styles.newsDate}>{item.created_at_human}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [todayAbsen, setTodayAbsen] = useState<AbsensiRecord | null>(null);
  const [timezoneLabel, setTimezoneLabel] = useState("WIB");
  const [statistik, setStatistik] = useState<AbsensiStatistik | null>(null);
  const [newsList, setNewsList] = useState<InformasiRecord[]>([]);
  const [selectedNews, setSelectedNews] = useState<InformasiRecord | null>(null);

  // URL foto profil — null jika masih avatar default backend (tampilkan inisial)
  const fotoUrl = (() => {
    const raw = user?.pegawai?.foto_url;
    if (!raw || !raw.includes("/storage/")) return null;
    return resolveMediaUrl(raw);
  })();

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

        // Ambil statistik bulan berjalan (hadir, terlambat, izin, alfa, dll)
        try {
          const statRes = await authService.getStatistik(token);
          setStatistik(statRes.data);
        } catch (e) {
          console.error("Statistik Error:", e);
        }

        // Ambil informasi terbaru
        try {
          const infoRes = await authService.getInformasi(token);
          setNewsList(infoRes.data.data || []);
        } catch (e) {
          console.error("Informasi Error:", e);
        }
      }
    } catch (error) {
      console.error("Home Error:", error);
    }
  };

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Cat area status bar dengan merah agar menyatu dengan hero & ikon status bar terlihat */}
      <View style={styles.statusBarBg} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── HERO ── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={COLORS.primaryGradient}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.circleDecor1} />
            <View style={styles.circleDecor2} />

            <View style={styles.heroContent}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity
                  style={styles.userSection}
                  onPress={() => navigation.navigate("Profile")}
                  activeOpacity={0.85}
                >
                  {fotoUrl ? (
                    <Image source={{ uri: fotoUrl }} style={styles.avatarCircle} />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {user
                          ? getInitials(user.pegawai?.nama_lengkap || user.name)
                          : "?"}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.greetingSmall}>Selamat datang 👋</Text>
                    <Text style={styles.userName}>
                      {user
                        ? user.pegawai?.nama_lengkap || user.name
                        : "Memuat..."}
                    </Text>
                    <Text style={styles.role}>
                      {user
                        ? user.pegawai?.jabatan ||
                          user.pegawai?.divisi ||
                          user.role
                        : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.notifBtn}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
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
            <View style={styles.statsTitleRow}>
              <Text style={styles.sectionTitle}>Ringkasan Bulan Ini</Text>
              <Text style={styles.hariKerjaText}>
                {statistik ? `${statistik.total_hari_kerja} hari kerja` : ""}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Hadir</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {statistik?.hadir ?? "-"}
                </Text>
                <View
                  style={[styles.statBar, { backgroundColor: COLORS.success }]}
                />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Izin</Text>
                <Text style={[styles.statValue, { color: COLORS.info }]}>
                  {statistik?.izin ?? "-"}
                </Text>
                <View
                  style={[styles.statBar, { backgroundColor: COLORS.info }]}
                />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Alfa</Text>
                <Text style={[styles.statValue, { color: "#EB5757" }]}>
                  {statistik?.alfa ?? "-"}
                </Text>
                <View style={[styles.statBar, { backgroundColor: "#EB5757" }]} />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sisa Cuti</Text>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>
                  {statistik?.sisa_cuti ?? "-"}
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
          <View style={styles.taskHeaderRow}>
            <Text style={styles.taskHeaderTitle}>
              Tugas Anda{" "}
              <Text style={{ color: COLORS.primary, fontSize: 13 }}>
                ({TASKS.length})
              </Text>
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
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.9}
                onPress={() =>
                  Alert.alert(
                    "🚧 Segera Hadir",
                    `Fitur ${task.title} sedang dalam pengembangan dan akan tersedia di update berikutnya.`,
                    [{ text: "Mengerti" }]
                  )
                }
              >
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
                      size={22}
                      color={task.gradient[0]}
                    />
                  </View>
                  <View style={styles.taskTextWrap}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskDesc} numberOfLines={1}>
                      {task.desc}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#fff"
                    style={{ opacity: 0.85 }}
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
              {MENUS.filter((menu) =>
                menu.permission === null || hasPermission(user, menu.permission)
              ).map((menu) => (
                <TouchableOpacity
                  key={menu.id}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (menu.route) {
                      navigation.navigate(menu.route as any);
                    } else {
                      Alert.alert(
                        "🚧 Segera Hadir",
                        `Fitur ${menu.title} sedang dalam pengembangan dan akan tersedia di update berikutnya.`,
                        [{ text: "Mengerti" }]
                      );
                    }
                  }}
                >
                  <View style={styles.iconWrapper}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: menu.color + "15" },
                      ]}
                    >
                      {/* @ts-ignore */}
                      <Ionicons name={menu.icon} size={28} color={menu.color} />
                    </View>
                    {/* Badge pending izin — hanya di menu Kelola Izin */}
                    {menu.permission === "izin.admin" &&
                      (user?.pending_izin_count ?? 0) > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {(user?.pending_izin_count ?? 0) > 9
                              ? "9+"
                              : user?.pending_izin_count}
                          </Text>
                        </View>
                      )}
                  </View>
                  <Text style={styles.menuText}>{menu.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION BERITA */}
        {newsList.length > 0 && (
          <View style={styles.newsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeader}>Informasi Terbaru</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newsScroll}
            >
              {newsList.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  onPress={() => setSelectedNews(item)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* MODAL DETAIL INFORMASI */}
      <NewsDetailModal
        item={selectedNews}
        onClose={() => setSelectedNews(null)}
      />
    </View>
  );
};

// Modal detail informasi — bottom sheet estetik
const NewsDetailModal = ({
  item,
  onClose,
}: {
  item: InformasiRecord | null;
  onClose: () => void;
}) => {
  const [imgError, setImgError] = useState(false);
  if (!item) return null;
  const imgUrl = resolveMediaUrl(item.gambar_url);
  const showImage = imgUrl && !imgError;

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setImgError(false)}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.modalBackdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalSheet}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Gambar header */}
            {showImage ? (
              <Image
                source={{ uri: imgUrl }}
                style={styles.modalImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                <Ionicons name="newspaper-outline" size={48} color="#fff" />
              </View>
            )}

            <View style={styles.modalBody}>
              <View style={styles.modalTagRow}>
                <View style={styles.modalTag}>
                  <Text style={styles.modalTagText}>Informasi</Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Ionicons name="time-outline" size={13} color="#999" />
                  <Text style={styles.modalMetaText}>{item.created_at_human}</Text>
                </View>
              </View>

              <Text style={styles.modalTitle}>{item.judul}</Text>

              <View style={styles.modalAuthorRow}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.modalAuthor}>{item.created_by}</Text>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalContent}>{stripHtml(item.isi)}</Text>

              <View style={{ height: 20 }} />
            </View>
          </ScrollView>

          {/* Tombol tutup */}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalCloseText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: TOP_INSET + 60,
    backgroundColor: COLORS.primary,
  },
  scrollContent: { paddingTop: 0, paddingBottom: 50 },

  heroContainer: {
    height: TOP_INSET + 168,
    position: "relative",
    marginBottom: 60,
  },
  heroGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: TOP_INSET + 2,
  },
  circleDecor1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleDecor2: {
    position: "absolute",
    top: 40,
    right: 50,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroContent: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  userSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  greetingSmall: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginBottom: 2,
  },
  userName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  role: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoImg: {
    width: 40,
    height: 40,
    tintColor: "#fff",
    opacity: 0.95,
  },
  appLogo: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    fontStyle: "italic",
    letterSpacing: 0.5,
    opacity: 0.95,
  },

  infoCard: {
    marginHorizontal: 16,
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
  statsTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  hariKerjaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { width: "23%", alignItems: "center" },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  statValue: { fontSize: 20, fontWeight: "bold", marginVertical: 4 },
  statBar: { height: 4, borderRadius: 2, width: "50%" },

  // --- TASK STYLES (NEW) ---
  taskWrapper: { marginTop: 28 },
  taskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  taskHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  taskScroll: { paddingHorizontal: 20, paddingRight: 8, paddingBottom: 12 },
  taskCard: {
    width: 220,
    height: 92,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginRight: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  taskIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  taskTextWrap: { flex: 1 },
  taskTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  taskDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },

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
  iconWrapper: { position: "relative", marginBottom: 8 },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
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
  newsImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
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

  // MODAL DETAIL INFORMASI
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdropTouch: { flex: 1 },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    overflow: "hidden",
    paddingBottom: 16,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    zIndex: 2,
  },
  modalImage: {
    width: "100%",
    height: 190,
    backgroundColor: "#eee",
  },
  modalImagePlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { paddingHorizontal: 22, paddingTop: 18 },
  modalTagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTag: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modalTagText: { fontSize: 11, fontWeight: "bold", color: COLORS.primary },
  modalMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalMetaText: { fontSize: 12, color: "#999" },
  modalTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: 10,
  },
  modalAuthorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  modalAuthor: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  modalDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  modalContent: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
  },
  modalCloseBtn: {
    marginHorizontal: 22,
    marginTop: 12,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
