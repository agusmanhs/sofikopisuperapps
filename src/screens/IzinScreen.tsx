import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { COLORS } from "../constants/colors";
import { AppHeader } from "../components/AppHeader";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";
import { JenisIzin, IzinRecord } from "../types/api";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const formatTanggal = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const toApiDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const statusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" };
    case "Rejected":
      return { bg: "#FFEBEE", text: "#C62828", dot: "#EF5350" };
    default:
      return { bg: "#FFF8E1", text: "#F57F17", dot: "#FFB300" };
  }
};

export const IzinScreen = ({ navigation }: any) => {
  const [jenisList, setJenisList] = useState<JenisIzin[]>([]);
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJenis, setSelectedJenis] = useState<JenisIzin | null>(null);
  const [tglMulai, setTglMulai] = useState(new Date());
  const [tglSelesai, setTglSelesai] = useState(new Date());
  const [alasan, setAlasan] = useState("");
  const [fileSurat, setFileSurat] = useState<Asset | null>(null);

  const [showJenisModal, setShowJenisModal] = useState(false);
  const [showMulai, setShowMulai] = useState(false);
  const [showSelesai, setShowSelesai] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await tokenService.getToken();
      if (!token) return;
      const [jenisRes, listRes] = await Promise.all([
        authService.getJenisIzin(token),
        authService.getIzinList(token),
      ]);
      setJenisList(jenisRes.data);
      setIzinList(listRes.data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Gagal memuat data izin");
    } finally {
      setLoading(false);
    }
  };

  const pickSurat = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.7,
      maxWidth: 1200,
      maxHeight: 1200,
    });
    if (result.didCancel) return;
    const asset = result.assets?.[0];
    if (asset?.uri) setFileSurat(asset);
  };

  const handleSubmit = async () => {
    if (!selectedJenis) {
      Alert.alert("Perhatian", "Pilih jenis izin terlebih dahulu.");
      return;
    }
    if (tglSelesai < tglMulai) {
      Alert.alert("Perhatian", "Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }
    if (!alasan.trim()) {
      Alert.alert("Perhatian", "Alasan wajib diisi.");
      return;
    }
    if (selectedJenis.butuh_surat && !fileSurat) {
      Alert.alert("Perhatian", `${selectedJenis.nama} memerlukan surat pendukung.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = await tokenService.getToken();
      if (!token) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

      await authService.createIzin(token, {
        jenis_izin_id: selectedJenis.id,
        tgl_mulai: toApiDate(tglMulai),
        tgl_selesai: toApiDate(tglSelesai),
        alasan: alasan.trim(),
        file_surat: fileSurat?.uri
          ? {
              uri: fileSurat.uri,
              type: fileSurat.type || "image/jpeg",
              name: fileSurat.fileName || "surat.jpg",
            }
          : undefined,
      });

      Alert.alert("Berhasil", "Pengajuan izin berhasil dikirim.");
      // Reset form
      setSelectedJenis(null);
      setAlasan("");
      setFileSurat(null);
      setTglMulai(new Date());
      setTglSelesai(new Date());
      fetchData();
    } catch (e: any) {
      Alert.alert("Gagal", e.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const jumlahHari =
    Math.floor((tglSelesai.getTime() - tglMulai.getTime()) / 86400000) + 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <AppHeader title="Pengajuan Izin" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* FORM CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Form Pengajuan</Text>

            {/* Jenis Izin */}
            <Text style={styles.label}>Jenis Izin</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => setShowJenisModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={selectedJenis ? COLORS.primary : "#bbb"}
              />
              <Text
                style={[
                  styles.selectText,
                  !selectedJenis && { color: "#bbb" },
                ]}
              >
                {selectedJenis ? selectedJenis.nama : "Pilih jenis izin"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#bbb" />
            </TouchableOpacity>

            {/* Tanggal */}
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Dari Tanggal</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setShowMulai(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dateText}>{formatTanggal(tglMulai)}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Sampai Tanggal</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setShowSelesai(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.dateText}>{formatTanggal(tglSelesai)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {jumlahHari > 0 && (
              <View style={styles.durasiChip}>
                <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                <Text style={styles.durasiText}>Total {jumlahHari} hari</Text>
              </View>
            )}

            {/* Alasan */}
            <Text style={styles.label}>Alasan</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tuliskan alasan pengajuan izin..."
              placeholderTextColor="#bbb"
              value={alasan}
              onChangeText={setAlasan}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Surat (opsional / wajib) */}
            <Text style={styles.label}>
              Surat Pendukung
              {selectedJenis?.butuh_surat ? (
                <Text style={{ color: COLORS.primary }}> *wajib</Text>
              ) : (
                <Text style={{ color: "#aaa" }}> (opsional)</Text>
              )}
            </Text>
            {fileSurat?.uri ? (
              <View style={styles.suratPreview}>
                <Image source={{ uri: fileSurat.uri }} style={styles.suratImg} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suratName} numberOfLines={1}>
                    {fileSurat.fileName || "surat.jpg"}
                  </Text>
                  <TouchableOpacity onPress={() => setFileSurat(null)}>
                    <Text style={styles.suratRemove}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={pickSurat}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                <Text style={styles.uploadText}>Unggah Surat (gambar)</Text>
              </TouchableOpacity>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>AJUKAN IZIN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* RIWAYAT */}
          <Text style={styles.historyHeader}>Riwayat Pengajuan</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : izinList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={36} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada pengajuan izin.</Text>
            </View>
          ) : (
            izinList.map((izin) => {
              const c = statusColor(izin.status);
              return (
                <View key={izin.id} style={styles.izinCard}>
                  <View style={styles.izinTop}>
                    <Text style={styles.izinJenis}>{izin.jenis_izin}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: c.dot }]} />
                      <Text style={[styles.statusText, { color: c.text }]}>
                        {izin.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.izinRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.izinDate}>
                      {izin.tgl_mulai} → {izin.tgl_selesai} ({izin.jumlah_hari} hari)
                    </Text>
                  </View>
                  <Text style={styles.izinAlasan} numberOfLines={2}>
                    {izin.alasan}
                  </Text>
                  {izin.catatan_admin ? (
                    <View style={styles.catatanBox}>
                      <Text style={styles.catatanLabel}>Catatan Admin:</Text>
                      <Text style={styles.catatanText}>{izin.catatan_admin}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showMulai && (
        <DateTimePicker
          value={tglMulai}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, date) => {
            setShowMulai(Platform.OS === "ios");
            if (date) {
              setTglMulai(date);
              if (tglSelesai < date) setTglSelesai(date);
            }
          }}
        />
      )}
      {showSelesai && (
        <DateTimePicker
          value={tglSelesai}
          mode="date"
          minimumDate={tglMulai}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, date) => {
            setShowSelesai(Platform.OS === "ios");
            if (date) setTglSelesai(date);
          }}
        />
      )}

      {/* iOS inline picker needs a done button overlay */}
      {Platform.OS === "ios" && (showMulai || showSelesai) && (
        <TouchableOpacity
          style={styles.pickerDoneBar}
          onPress={() => {
            setShowMulai(false);
            setShowSelesai(false);
          }}
        >
          <Text style={styles.pickerDoneText}>Selesai</Text>
        </TouchableOpacity>
      )}

      {/* Jenis Izin Modal */}
      <Modal
        visible={showJenisModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJenisModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowJenisModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Jenis Izin</Text>
            {jenisList.map((j) => (
              <TouchableOpacity
                key={j.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedJenis(j);
                  setShowJenisModal(false);
                }}
              >
                <View style={styles.modalItemIcon}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemName}>{j.nama}</Text>
                  {j.max_hari ? (
                    <Text style={styles.modalItemSub}>Maks {j.max_hari} hari</Text>
                  ) : null}
                </View>
                {selectedJenis?.id === j.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingTop: 20 },

  headerContainer: { height: 110, position: "relative" },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: 40,
  },
  circleDecor: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 7,
    marginTop: 4,
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#ebebeb",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  selectText: { flex: 1, fontSize: 14, color: COLORS.text },
  dateRow: { flexDirection: "row" },
  dateText: { flex: 1, fontSize: 13, color: COLORS.text },
  durasiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  durasiText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  textArea: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#ebebeb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 10,
    height: 46,
    marginBottom: 18,
  },
  uploadText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  suratPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
  },
  suratImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#eee" },
  suratName: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  suratRemove: { fontSize: 12, color: "#EF5350", marginTop: 4, fontWeight: "600" },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 50,
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

  historyHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyBox: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { color: "#aaa", fontSize: 13 },
  izinCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  izinTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  izinJenis: { fontSize: 15, fontWeight: "bold", color: COLORS.text },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "bold" },
  izinRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  izinDate: { fontSize: 12, color: COLORS.textSecondary },
  izinAlasan: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  catatanBox: {
    marginTop: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 10,
  },
  catatanLabel: { fontSize: 11, fontWeight: "bold", color: COLORS.textSecondary },
  catatanText: { fontSize: 12, color: COLORS.text, marginTop: 2 },

  pickerDoneBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickerDoneText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 14 },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f3",
  },
  modalItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  modalItemName: { fontSize: 14, fontWeight: "500", color: COLORS.text },
  modalItemSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});
