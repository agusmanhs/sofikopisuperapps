import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./AppNavigator";

// Import Screens
import { HomeScreen } from "../screens/HomeScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { COLORS } from "../constants/colors";

// Dummy Screen untuk Tab Tengah
const PlaceholderScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background }} />
);

const Tab = createBottomTabNavigator();

// --- KOMPONEN IKON DENGAN ANIMASI BOUNCE ---
const AnimatedIcon = ({
  name,
  color,
  focused,
}: {
  name: any;
  color: string;
  focused: boolean;
}) => {
  // Value animasi (mulai dari skala 1)
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      // Efek Membal (Spring) saat aktif
      Animated.spring(scaleValue, {
        toValue: 1.2, // Membesar 20%
        friction: 4, // Kekenyalan (makin kecil makin membal)
        tension: 150, // Kecepatan
        useNativeDriver: true,
      }).start();
    } else {
      // Kembali ke ukuran normal saat tidak aktif
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
};

// --- CUSTOM BUTTON TENGAH (TETAP SAMA) ---
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -25,
      justifyContent: "center",
      alignItems: "center",
      ...styles.shadow,
    }}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View
      style={{
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: COLORS.primary,
        borderWidth: 4,
        borderColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="finger-print-outline" color="#fff" size={32} />
    </View>
    <Text
      style={{
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: "bold",
        marginTop: 4,
        textAlign: "center",
      }}
    >
      Absensi
    </Text>
  </TouchableOpacity>
);

export const TabNavigator = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: Platform.OS === "ios" ? 90 : 75,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          paddingTop: 10,
          ...styles.shadow,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          marginTop: 2, // Tambah jarak sedikit dari icon
        },
      }}
    >
      {/* 1. TAB BERANDA */}
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          // Gunakan AnimatedIcon di sini
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* 2. TAB TENGAH (ABSENSI) */}
      <Tab.Screen
        name="Absensi"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Attendance");
          },
        }}
      />

      {/* 3. TAB RIWAYAT */}
      <Tab.Screen
        name="Riwayat"
        component={HistoryScreen}
        options={{
          tabBarLabel: "Riwayat",
          // Gunakan AnimatedIcon di sini juga
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon
              name={focused ? "time" : "time-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
});
