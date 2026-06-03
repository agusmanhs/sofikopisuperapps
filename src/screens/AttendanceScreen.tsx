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
  PermissionsAndroid,
  Platform,
} from "react-native";
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from "react-native-vision-camera";
import Geolocation from "react-native-geolocation-service";
import Ionicons from "react-native-vector-icons/Ionicons";
import { COLORS } from "../constants/colors";

const { width, height } = Dimensions.get("window");

export const AttendanceScreen = ({ navigation }: any) => {
  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } =
    useCameraPermission();
  const device = useCameraDevice("front");

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>("-");
  const [photo, setPhoto] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sending, setSending] = useState(false);

  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      if (!hasCamPermission) {
        await requestCamPermission();
      }
    })();
  }, [hasCamPermission]);

  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Izin Ditolak", "Aktifkan izin lokasi di pengaturan.");
          setLoadingLocation(false);
          return;
        }
      } else {
        const auth = await Geolocation.requestAuthorization("whenInUse");
        if (auth !== "granted") {
          Alert.alert("Izin Ditolak", "Aktifkan izin lokasi di pengaturan.");
          setLoadingLocation(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setLoadingLocation(false);
        },
        (error) => {
          Alert.alert("Error", "Gagal mendeteksi lokasi. Pastikan GPS aktif.");
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } catch (error) {
      Alert.alert("Error", "Gagal mendeteksi lokasi.");
      setLoadingLocation(false);
    }
  };

  const openCamera = async () => {
    if (!hasCamPermission) {
      const granted = await requestCamPermission();
      if (!granted) {
        Alert.alert("Izin", "Kamera butuh izin akses.");
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePhoto({ quality: 70 });
        if (photoData?.path) {
          setPhoto(`file://${photoData.path}`);
          setIsCameraOpen(false);
        } else {
          Alert.alert("Error", "Gagal: URI foto kosong.");
        }
      } catch (error) {
        console.error("CAPTURE ERROR:", error);
        Alert.alert("Error", "Gagal mengambil foto. Pastikan wajah terlihat.");
      }
    }
  };

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

  if (isCameraOpen) {
    if (!device) {
      return (
        <View style={styles.cameraContainer}>
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 100 }}>
            Kamera depan tidak tersedia
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.cameraContainer}>
        <StatusBar hidden />
        <Camera
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          ref={cameraRef}
          photo={true}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeCameraBtn}
              onPress={() => setIsCameraOpen(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.shutterArea}>
              <Text style={styles.cameraHint}>
                Pastikan wajah terlihat jelas
              </Text>
              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={takePicture}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Camera>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Lokasi Anda</Text>
          </View>

          <View style={styles.locationBox}>
            {location ? (
              <>
                <Text style={styles.addressText}>{address}</Text>
                <Text style={styles.coordText}>
                  {location.latitude}, {location.longitude}
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
