import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS } from "../constants/colors";
import { authService, resolveMediaUrl } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { AdminIzinRecord } from "../types/api";
import { initialWindowMetrics } from "react-native-safe-area-context";

const TOP_INSET = initialWindowMetrics?.insets.top ?? 47;

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const formatDate = (s: string) => {
  const d = new Date(s);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const STATUS_TABS = ["Pending", "Approved", "Rejected"] as const;
type StatusTab = typeof STATUS_TABS[number];

const tabColor: Record<StatusTab, string> = {
  Pending: "#F59E0B",
  Approved: "#10B981",
  Rejected: "#EF4444",
};

export const KelolIzinScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<StatusTab>("Pending");
  const [data, setData] = useState<AdminIzinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk modal reject
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminIzinRecord | null>(null);
  const [rejectCatatan, setRejectCatatan] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const token = await tokenService.getToken();
      if (!token) return;
      const res = await authService.getAdminIzinList(token, activeTab);
      setData(res.data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = (izin: AdminIzinRecord) => {
    Alert.alert(
      "Setujui Izin",
      `Setujui izin ${izin.pegawai.nama} (${izin.jenis_izin}, ${izin.jumlah_hari} hari)?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui",
          onPress: async () => {
            setProcessing(izin.id);
            try {
              const token = await tokenService.getToken();
              await authService.approveIzin(token!, izin.id);
              Alert.alert("Berhasil", "Izin telah disetujui.");
              fetchData(false);
            } catch (e: any) {
              Alert.alert("Gagal", e.message);
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (izin: AdminIzinRecord) => {
    setRejectTarget(izin);
    setRejectCatatan("");
    setRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectCatatan.trim()) {
      Alert.alert("Perhatian", "Alasan penolakan wajib diisi.");
      return;
    }
    setProcessing(rejectTarget!.id);
    setRejectModal(false);
    try {
      const token = await tokenService.getToken();
      await authService.rejectIzin(token!, rejectTarget!.id, rejectCatatan.trim());
      Alert.alert("Selesai", "Izin telah ditolak.");
      fetchData(false);
    } catch (e: any) {
      Alert.alert("Gagal", e.message);
    } finally {
      setProcessing(null);
      setRejectTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER — wrapper fixed height, gradient sebagai background */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.circleDecor} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kelola Izin</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <View style={[styles.tabDot, { backgroundColor: activeTab === tab ? tabColor[tab] : "rgba(255,255,255,0.5)" }]} />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(false); }}
              tintColor={COLORS.primary}
            />
          }
        >
          {data.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Tidak ada izin {activeTab.toLowerCase()}.</Text>
            </View>
          ) : (
            data.map((izin) => (
              <IzinCard
                key={izin.id}
                izin={izin}
                processing={processing === izin.id}
                onApprove={() => handleApprove(izin)}
                onReject={() => openRejectModal(izin)}
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* REJECT MODAL */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRejectModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tolak Izin</Text>
            {rejectTarget && (
              <Text style={styles.modalSubtitle}>
                {rejectTarget.pegawai.nama} · {rejectTarget.jenis_izin} · {rejectTarget.jumlah_hari} hari
              </Text>
            )}
            <Text style={styles.inputLabel}>Alasan Penolakan <Text style={{ color: COLORS.primary }}>*</Text></Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tuliskan alasan penolakan..."
              placeholderTextColor="#bbb"
              value={rejectCatatan}
              onChangeText={setRejectCatatan}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.btnBatal} onPress={() => setRejectModal(false)}>
                <Text style={styles.btnBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnTolak} onPress={handleReject}>
                <Text style={styles.btnTolakText}>Tolak Izin</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

/* ── Card Component ── */
const IzinCard = ({
  izin,
  processing,
  onApprove,
  onReject,
}: {
  izin: AdminIzinRecord;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const fotoUrl = resolveMediaUrl(
    izin.pegawai.foto_url?.includes("/storage/") ? izin.pegawai.foto_url : null
  );

  return (
    <View style={cardStyles.card}>
      {/* Pegawai info */}
      <View style={cardStyles.topRow}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={cardStyles.avatar} />
        ) : (
          <View style={cardStyles.avatarFallback}>
            <Text style={cardStyles.avatarText}>{getInitials(izin.pegawai.nama)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.nama} numberOfLines={1}>{izin.pegawai.nama}</Text>
          <Text style={cardStyles.jabatan} numberOfLines={1}>
            {izin.pegawai.jabatan} · {izin.pegawai.divisi}
          </Text>
        </View>
        <View style={[cardStyles.jenisChip, { backgroundColor: COLORS.primary + "15" }]}>
          <Text style={[cardStyles.jenisText, { color: COLORS.primary }]}>{izin.jenis_izin}</Text>
        </View>
      </View>

      {/* Tanggal & durasi */}
      <View style={cardStyles.infoRow}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
        <Text style={cardStyles.infoText}>
          {formatDate(izin.tgl_mulai)} → {formatDate(izin.tgl_selesai)}
        </Text>
        <View style={cardStyles.hariChip}>
          <Text style={cardStyles.hariText}>{izin.jumlah_hari} hari</Text>
        </View>
      </View>

      {/* Alasan */}
      <Text style={cardStyles.alasanLabel}>Alasan:</Text>
      <Text style={cardStyles.alasan} numberOfLines={2}>{izin.alasan}</Text>

      {/* Diajukan */}
      <Text style={cardStyles.createdAt}>Diajukan: {izin.created_at}</Text>

      {/* Catatan admin (jika sudah diproses) */}
      {izin.catatan_admin ? (
        <View style={cardStyles.catatanBox}>
          <Text style={cardStyles.catatanLabel}>
            {izin.status === "Approved" ? "✓ Disetujui" : "✗ Ditolak"} oleh {izin.approved_by}
          </Text>
          <Text style={cardStyles.catatanText}>{izin.catatan_admin}</Text>
        </View>
      ) : null}

      {/* Action buttons (hanya untuk Pending) */}
      {izin.status === "Pending" && (
        <View style={cardStyles.actionRow}>
          {processing ? (
            <ActivityIndicator color={COLORS.primary} style={{ flex: 1, alignSelf: "center" }} />
          ) : (
            <>
              <TouchableOpacity style={cardStyles.btnReject} onPress={onReject} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={cardStyles.btnRejectText}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cardStyles.btnApprove} onPress={onApprove} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={cardStyles.btnApproveText}>Setujui</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

/* ── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  statusBarBg: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: TOP_INSET + 60,
    backgroundColor: COLORS.primary,
  },

  headerWrapper: {
    height: TOP_INSET + 120,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    paddingTop: TOP_INSET + 8,
  },
  headerGradient: {},
  circleDecor: {
    position: "absolute", top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 5,
    paddingVertical: 8, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabActive: { backgroundColor: "#fff" },
  tabDot: { width: 7, height: 7, borderRadius: 4 },
  tabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  tabTextActive: { color: COLORS.text },

  listContent: { padding: 16, paddingTop: 14 },

  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { color: "#aaa", fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  textArea: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5, borderColor: "#ebebeb", borderRadius: 10,
    padding: 12, fontSize: 14, color: COLORS.text,
    minHeight: 88, marginBottom: 16,
  },
  modalBtnRow: { flexDirection: "row", gap: 10 },
  btnBatal: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#ddd",
    justifyContent: "center", alignItems: "center",
  },
  btnBatalText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  btnTolak: {
    flex: 2, height: 48, borderRadius: 12,
    backgroundColor: "#EF4444",
    justifyContent: "center", alignItems: "center",
  },
  btnTolakText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  nama: { fontSize: 15, fontWeight: "bold", color: COLORS.text },
  jabatan: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  jenisChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, alignSelf: "flex-start",
  },
  jenisText: { fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  hariChip: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  hariText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  alasanLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 2 },
  alasan: { fontSize: 13, color: COLORS.text, lineHeight: 18, marginBottom: 6 },
  createdAt: { fontSize: 11, color: "#bbb", marginBottom: 4 },
  catatanBox: {
    backgroundColor: "#f8f8f8", borderRadius: 8,
    padding: 10, marginTop: 8, marginBottom: 4,
  },
  catatanLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 2 },
  catatanText: { fontSize: 12, color: COLORS.text },
  actionRow: {
    flexDirection: "row", gap: 10, marginTop: 14,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: "#f3f3f3",
  },
  btnReject: {
    flex: 1, height: 40, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#EF4444",
    flexDirection: "row", gap: 5,
    justifyContent: "center", alignItems: "center",
  },
  btnRejectText: { fontSize: 13, fontWeight: "700", color: "#EF4444" },
  btnApprove: {
    flex: 2, height: 40, borderRadius: 10,
    backgroundColor: "#10B981",
    flexDirection: "row", gap: 5,
    justifyContent: "center", alignItems: "center",
  },
  btnApproveText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
