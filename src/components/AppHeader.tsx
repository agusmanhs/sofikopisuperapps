import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const TOP_INSET = initialWindowMetrics?.insets.top ?? 47;

type Props = {
  title: string;
  onBack: () => void;
  /** Konten tambahan di bawah title (tab filter, subtitle, dll) */
  children?: React.ReactNode;
  /** Override tinggi default jika ada konten tambahan */
  extraHeight?: number;
};

export const AppHeader = ({ title, onBack, children, extraHeight = 0 }: Props) => (
  <View style={[styles.wrapper, { height: TOP_INSET + 92 + extraHeight }]}>
    <LinearGradient
      colors={COLORS.primaryGradient}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <View style={styles.decor} />
    <View style={styles.row}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    paddingTop: TOP_INSET + 8,
  },
  decor: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
