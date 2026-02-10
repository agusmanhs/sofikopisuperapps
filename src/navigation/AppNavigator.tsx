import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { TabNavigator } from "./TabNavigator";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AttendanceScreen } from "../screens/AttendanceScreen";

// Tentukan daftar halaman apa saja yang ada
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Profile: undefined; // <--- Tambahkan ini
  Attendance: undefined; // <--- Tambah ini
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Group
          screenOptions={{ presentation: "modal", headerShown: false }}
        >
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
        </Stack.Group>
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false, // Kita ingin menampilkan tombol Back bawaan
            headerTitle: "Profil Saya",
            headerTintColor: "#333",
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
