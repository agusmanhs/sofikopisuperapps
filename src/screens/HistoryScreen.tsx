import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS } from "../constants/colors";
import { tokenService } from "../services/tokenService";
import { authService } from "../services/authService";
import { AbsensiRecord } from "../types/api";

const { width, height } = Dimensions.get("window");

// Interface State
interface PhotoPreview {
  url: string;
  type: "Masuk" | "Pulang";
  date: string;
  time: string;
}

export const HistoryScreen = () => {
  const [data, setData] = useState<AbsensiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoPreview | null>(null);

  // LOGIC TANGGAL UNTUK HEADER
  const now = new Date();
  const currentMonth = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await tokenService.getToken();
      if (token) {
        const response = await authService.getHistory(token);
        setData(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes("terlambat")) return "#E74C3C";
    if (status.toLowerCase().includes("izin")) return COLORS.info;
    return COLORS.success;
  };

  const PhotoButton = ({
    url,
    type,
    item,
  }: {
    url: string;
    type: "Masuk" | "Pulang";
    item: AbsensiRecord;
  }) => {
    if (!url) return null;
    return (
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() =>
          setSelectedPhoto({
            url: url,
            type: type,
            date: item.tanggal,
            time: type === "Masuk" ? item.jam_masuk : item.jam_pulang,
          })
        }
      >
        <Ionicons name="camera" size={14} color={COLORS.primary} />
        <Text style={styles.photoButtonText}>Lihat</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: AbsensiRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.tanggal)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.timelineContainer}>
        {/* JAM MASUK */}
        <View style={styles.timeRow}>
          <View style={styles.iconWrapper}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <View style={styles.line} />
          </View>
          <View style={styles.timeContent}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.labelTime}>Jam Masuk</Text>
                <Text style={styles.timeValue}>{item.jam_masuk} WIB</Text>
              </View>
              <PhotoButton url={item.foto_masuk_url} type="Masuk" item={item} />
            </View>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.lokasi_masuk}
              </Text>
            </View>
          </View>
        </View>

        {/* JAM PULANG */}
        <View style={styles.timeRow}>
          <View style={styles.iconWrapper}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          </View>
          <View style={styles.timeContent}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.labelTime}>Jam Pulang</Text>
                <Text style={styles.timeValue}>
                  {item.jam_pulang || "--:--"} WIB
                </Text>
              </View>
              <PhotoButton
                url={item.foto_pulang_url}
                type="Pulang"
                item={item}
              />
            </View>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.lokasi_pulang || "-"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="timer-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.durationText}>
          Total Jam Kerja: {item.durasi_kerja}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* --- HEADER GRADIENT BARU --- */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Riwayat Absensi</Text>
              <Text style={styles.headerSubtitle}>Periode {currentMonth}</Text>
            </View>

            {/* Dekorasi Icon Transparan */}
            <Ionicons
              name="calendar"
              size={80}
              color="rgba(255,255,255,0.15)"
              style={styles.headerIconDecoration}
            />
          </View>
        </LinearGradient>
      </View>

      {/* --- MODAL FOTO --- */}
      <Modal visible={!!selectedPhoto} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeArea}
            onPress={() => setSelectedPhoto(null)}
          />
          <View style={styles.polaroidFrame}>
            <View style={styles.frameHeader}>
              <Ionicons name="scan-circle" size={24} color={COLORS.primary} />
              <Text style={styles.frameTitle}>
                BUKTI ABSENSI {selectedPhoto?.type.toUpperCase()}
              </Text>
            </View>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.frameImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.frameFooter}>
              <View>
                <Text style={styles.frameLabel}>TANGGAL</Text>
                <Text style={styles.frameValue}>
                  {selectedPhoto ? formatDate(selectedPhoto.date) : "-"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.frameLabel}>
                  JAM {selectedPhoto?.type.toUpperCase()}
                </Text>
                <Text style={[styles.frameValue, { color: COLORS.primary }]}>
                  {selectedPhoto?.time} WIB
                </Text>
              </View>
            </View>
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>
                Verified by abSenin System
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButtonBottom}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* --- LIST DATA --- */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          // Padding atas untuk memberi ruang di bawah header lengkung
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="folder-open-outline"
                size={50}
                color="#ccc"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.emptyText}>
                Belum ada data absensi bulan ini.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F5F9" },

  // HEADER STYLES (NEW)
  headerContainer: {
    height: 140, // Tinggi Header
    zIndex: 1,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50, // Untuk Status Bar
    borderBottomLeftRadius: 30, // Lengkungan
    borderBottomRightRadius: 30,
    justifyContent: "center",
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  headerIconDecoration: {
    position: "absolute",
    right: -10,
    bottom: -30,
    transform: [{ rotate: "-15deg" }], // Miringkan icon agar estetik
  },

  // LIST CONTENT
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20, // Jarak dari header
    paddingBottom: 100, // Jarak bawah untuk tab bar
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  // CARD STYLES (Sama seperti sebelumnya)
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: { fontSize: 14, fontWeight: "bold", color: COLORS.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },

  // TIMELINE
  timelineContainer: { marginLeft: 5 },
  timeRow: { flexDirection: "row", minHeight: 60 },
  iconWrapper: { alignItems: "center", width: 20, marginRight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  line: { width: 1, flex: 1, backgroundColor: "#ddd", marginVertical: 4 },
  timeContent: { flex: 1, paddingBottom: 15 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  labelTime: { fontSize: 12, color: COLORS.textSecondary },
  timeValue: { fontSize: 14, fontWeight: "bold", color: COLORS.text },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },

  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  photoButtonText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
    marginLeft: 4,
  },

  cardFooter: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: "500",
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },

  // MODAL STYLES (Polaroid)
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeArea: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  polaroidFrame: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  frameHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  frameTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 8,
    letterSpacing: 1,
  },
  frameImage: {
    width: "100%",
    height: width * 0.85 * 1.2,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  frameFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 5,
  },
  frameLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
    marginBottom: 2,
  },
  frameValue: { fontSize: 14, fontWeight: "bold", color: "#333" },
  watermark: { marginTop: 15, alignItems: "center" },
  watermarkText: { fontSize: 10, color: "#ccc", fontStyle: "italic" },
  closeButtonBottom: {
    marginTop: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
});
