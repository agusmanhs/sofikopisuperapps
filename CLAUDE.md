# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Terminal 1 — Metro bundler (wajib jalan sebelum run-ios)
npm start

# Terminal 2 — Build native & install ke simulator (hanya perlu saat ada perubahan native)
npm run ios

# Setelah Metro jalan, perubahan JS langsung hot-reload tanpa rebuild
```

No linter or test suite is configured yet.

## Architecture

React Native **bare** (non-Expo) app, TypeScript, React Navigation. Employee attendance (absensi) system for PT Dataciptacelebes.

**API**: All requests hit `http://sofikopi-web-app.test/api` (dev). Auth uses Bearer tokens.

**Token lifecycle**: After login, `tokenService` stores the token in AsyncStorage under the key `auth_token`. All subsequent API calls in `authService` retrieve it via `tokenService.getToken()`.

**Navigation structure** (two-level):
- `AppNavigator` (NativeStack): `Login` → `Main` (contains TabNavigator) + modal `Attendance` + `Profile`
- `TabNavigator` (BottomTabs): `Beranda` (Home) | center FAB (Absensi) | `Riwayat` (History)

The center tab button is a custom FAB — it intercepts `tabPress` with `e.preventDefault()` and calls `navigation.navigate("Attendance")` to push the Attendance screen as a stack modal, not a real tab.

**Key source layout**:
- `src/screens/` — one file per screen
- `src/navigation/` — `AppNavigator.tsx` (stack + type definitions) and `TabNavigator.tsx`
- `src/services/authService.ts` — all API calls (`login`, `getProfile`, `getHistory`)
- `src/services/tokenService.ts` — AsyncStorage wrapper for the auth token
- `src/types/api.ts` — TypeScript interfaces for all API request/response shapes
- `src/constants/colors.ts` — single source of truth for brand colors (primary red `#c51d2e`)
- `ios/` — native Xcode project (generated via `expo prebuild`, then migrated away from Expo)
- `babel.config.js` / `metro.config.js` — standard React Native config (not Expo)

**Native packages** (all autolinked via CocoaPods):
- `react-native-linear-gradient` — replaces `expo-linear-gradient`
- `react-native-vision-camera` v5 + `react-native-nitro-modules` + `react-native-nitro-image` — replaces `expo-camera`
- `react-native-geolocation-service` — replaces `expo-location`
- `react-native-vector-icons` — replaces `@expo/vector-icons` (fonts declared in `ios/.../Info.plist`)
- `react-native-safe-area-context` — provides `SafeAreaProvider` (wrapped in `App.tsx`) and `initialWindowMetrics`

**Header safe area pattern**: `HomeScreen` uses `initialWindowMetrics?.insets.top ?? 44` (a module-level constant `TOP_INSET`) instead of `useSafeAreaInsets()` hook to avoid re-render issues. `StatusBar` uses `translucent={true}` + `backgroundColor="transparent"` so the gradient extends edge-to-edge.

## Current State / Known Gaps

- `AttendanceScreen.handleSubmit` uses a `setTimeout` mock — the actual API call to submit absensi is **not yet implemented**.
- `HomeScreen` stats (Hadir/Izin/Cuti counts) and the MENUS/NEWS/TASKS sections use **hardcoded dummy data**.
- `HomeScreen` fetches today's attendance from `absensi_history` embedded in the profile response (`response.data.absensi_history`), not a dedicated endpoint.
- The app has New Architecture enabled (`RCTNewArchEnabled: true` in `Info.plist`).
