import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

const { width, height } = Dimensions.get("window");

export const AttendanceScreen = ({ navigation }: any) => {
  // State Izin
  const [permission, requestPermission] = useCameraPermissions();

  // State Data
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [address, setAddress] = useState<string>("-");
  const [photo, setPhoto] = useState<string | null>(null);

  // State UI
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [sending, setSending] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // Minta izin saat pertama kali buka
  useEffect(() => {
    (async () => {
      if (permission && !permission.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  // 1. Fungsi Manual Cek Lokasi
  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Ditolak", "Aktifkan izin lokasi di pengaturan.");
        setLoadingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode.length > 0) {
        const g = geocode[0];
        setAddress(`${g.street || ""} ${g.name || ""}, ${g.city || ""}`);
      } else {
        setAddress("Alamat tidak ditemukan");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mendeteksi lokasi. Pastikan GPS aktif.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // 2. Fungsi Buka Kamera
  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Izin", "Kamera butuh izin akses.");
        return;
      }
    }
    // Reset state kamera
    setIsCameraReady(false);
    setIsCameraOpen(true);
  };

  // 3. Fungsi Jepret Foto
  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        console.log("Mulai mengambil foto..."); // Debug log

        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.7, // Kualitas standar (0.0 - 1.0)
          base64: false, // Kita tidak butuh base64 untuk preview, biar ringan
          // HAPUS baris 'skipProcessing: true' karena sering error di iOS
          exif: false, // Tidak perlu metadata agar lebih cepat
        });

        console.log("Hasil Foto:", photoData?.uri); // Debug log

        if (photoData?.uri) {
          setPhoto(photoData.uri);
          setIsCameraOpen(false); // Tutup kamera
        } else {
          Alert.alert("Error", "Gagal: URI foto kosong.");
        }
      } catch (error) {
        console.error("CAPTURE ERROR:", error);
        Alert.alert("Error", "Gagal mengambil foto. Pastikan wajah terlihat.");
      }
    } else {
      Alert.alert("Loading", "Tunggu kamera siap sepenuhnya...");
    }
  };

  // 4. Kirim Data
  const handleSubmit = () => {
    if (!photo || !location) {
      Alert.alert("Peringatan", "Lengkapi data foto dan lokasi.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert("Sukses", "Absensi berhasil dikirim!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }, 2000);
  };

  // --- RENDERING TAMPILAN KAMERA (FULLSCREEN PENGGANTI MODAL) ---
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar hidden />
        <CameraView
          style={{ flex: 1 }}
          facing="front"
          mode="picture" // <--- TAMBAHKAN INI UNTUK KEPASTIAN
          ref={cameraRef}
          onCameraReady={() => {
            console.log("Kamera Siap!"); // Debugging
            setIsCameraReady(true);
          }}
          onMountError={(error) => {
            console.log("Camera Mount Error:", error);
            Alert.alert("Error Kamera", "Kamera gagal dimuat.");
            setIsCameraOpen(false);
          }}
        >
          {/* Overlay UI Kamera */}
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Tombol Tutup (Kiri Atas) */}
            <TouchableOpacity
              style={styles.closeCameraBtn}
              onPress={() => setIsCameraOpen(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Area Shutter (Bawah) */}
            <View style={styles.shutterArea}>
              <Text style={styles.cameraHint}>
                Pastikan wajah terlihat jelas
              </Text>

              <TouchableOpacity
                style={[styles.shutterBtn, !isCameraReady && { opacity: 0.5 }]}
                onPress={takePicture}
                disabled={!isCameraReady}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // --- RENDERING FORM UTAMA ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Halaman */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Form Absensi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: LOKASI */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Lokasi Anda</Text>
          </View>

          <View style={styles.locationBox}>
            {location ? (
              <>
                <Text style={styles.addressText}>{address}</Text>
                <Text style={styles.coordText}>
                  {location.coords.latitude}, {location.coords.longitude}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Lokasi belum dideteksi</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.btnOutline]}
            onPress={handleGetLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Ionicons name="locate" size={18} color={COLORS.primary} />
                <Text style={[styles.btnText, { color: COLORS.primary }]}>
                  {location ? "Refresh Lokasi" : "Cek Lokasi"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SECTION 2: FOTO */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Foto Selfie</Text>
          </View>

          <View style={styles.photoBox}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.emptyPhoto}>
                <Ionicons name="person-outline" size={40} color="#ccc" />
                <Text style={styles.placeholderText}>Belum ada foto</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.btnOutline]}
            onPress={openCamera}
          >
            <Ionicons name="camera" size={18} color={COLORS.primary} />
            <Text style={[styles.btnText, { color: COLORS.primary }]}>
              {photo ? "Foto Ulang" : "Ambil Foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TOMBOL KIRIM */}
        <View style={styles.footerSpace}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!photo || !location || sending) && styles.disabledBtn,
            ]}
            onPress={handleSubmit}
            disabled={!photo || !location || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.submitText}>KIRIM ABSENSI SEKARANG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F5F9" },
  scrollContent: { padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    elevation: 2,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 8,
  },

  // Location Styles
  locationBox: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 80,
    justifyContent: "center",
  },
  addressText: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  coordText: { fontSize: 11, color: "#999", marginTop: 5 },
  placeholderText: { color: "#aaa", fontSize: 13, textAlign: "center" },

  // Photo Styles
  photoBox: {
    height: 300,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  previewImage: { width: "100%", height: "100%" },
  emptyPhoto: { alignItems: "center" },

  // Buttons
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderColor: COLORS.primary,
  },
  btnText: { fontWeight: "bold", marginLeft: 8 },

  footerSpace: { marginTop: 10, marginBottom: 30 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    elevation: 5,
  },
  disabledBtn: { backgroundColor: "#ccc", shadowOpacity: 0, elevation: 0 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // CAMERA FULLSCREEN STYLES (Pengganti Modal)
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  cameraOverlay: { flex: 1, justifyContent: "space-between" },
  closeCameraBtn: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  shutterArea: {
    alignItems: "center",
    marginBottom: 50,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: "100%",
    paddingVertical: 20,
  },
  cameraHint: { color: "#fff", marginBottom: 20, fontSize: 14 },
  shutterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ddd",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#333",
  },
});
