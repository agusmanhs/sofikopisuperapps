import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { TabNavigator } from "./TabNavigator";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AttendanceScreen } from "../screens/AttendanceScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { IzinScreen } from "../screens/IzinScreen";
import { KelolIzinScreen } from "../screens/KelolIzinScreen";
import { ChangePasswordScreen } from "../screens/ChangePasswordScreen";
import { UserProfile } from "../types/api";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Profile: undefined;
  Attendance: undefined;
  EditProfile: { user: UserProfile; onSaved?: () => void };
  Izin: undefined;
  KelolIzin: undefined;
  ChangePassword: undefined;
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
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Izin"
          component={IzinScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="KelolIzin"
          component={KelolIzinScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
