import React, { useEffect, useRef, useState } from "react";
import { View, Alert, StatusBar, AppState } from "react-native";
import { Provider as PaperProvider, DefaultTheme, Button, Text } from "react-native-paper";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation/RootStack";

import { useFonts } from "expo-font";

// IMPORTANT: load MaterialCommunityIcons font used by react-native-vector-icons
// This require points to the font file bundled with react-native-vector-icons package.
const materialIconsFont = require("react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf");

/* ===========================
   NOTE: Push/Auth code is commented out for now.
   When you're ready to re-enable push notifications
  //  and token registration, remove the /* ... */
  //  below and ensure imports/services exist.
  //  =========================== */

/* Firebase auth & fcm service (commented out)
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "./src/firebase/config";
// import { registerDeviceTokenForUser } from "./src/services/fcmService";
*/

/* Notification handler config (kept but safe - no registration calls)
   You can leave this; it only affects how notifications are shown when they arrive.
*/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Custom theme (Material Design)
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1565c0",
    accent: "#ff4081",
  },
};

export default function App() {
  // load the required icon font before rendering app
  const [fontsLoaded] = useFonts({
    MaterialCommunityIcons: materialIconsFont,
  });

  // UI state only
  const [statusText, setStatusText] = useState("Chưa đăng nhập");
  const [infoText, setInfoText] = useState("Token chưa có");

  // refs for future use (kept but currently unused)
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // If you later re-enable auth & push, uncomment and use:
    /*
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setStatusText(`Logged in: ${user.uid}`);
        try {
          const token = await registerDeviceTokenForUser(user.uid);
          if (token) setInfoText(`Token: ${token.slice(0,40)}...`);
        } catch (err) {
          console.error("Register token error:", err);
        }
      } else {
        setStatusText("Chưa đăng nhập");
        setInfoText("Token chưa có");
      }
    });
    return () => unsub();
    */

    // For now: simulate no-op cleanup
    return () => {};
  }, []);

  // If you later want auto-refresh token on resume, enable this block:
  /*
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        if (auth.currentUser) {
          try {
            const token = await registerDeviceTokenForUser(auth.currentUser.uid);
            if (token) setInfoText(`Token: ${token.slice(0,40)}...`);
            console.log("Refreshed device token on resume:", token);
          } catch (err) {
            console.error("Error refreshing token:", err);
          }
        }
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);
  */

  // Notification listeners: kept but safe (no registration required)
  // useEffect(() => {
  //   notificationListener.current = Notifications.addNotificationReceivedListener(n => {
  //     console.log("Received Notification:", n);
  //   });

  //   responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
  //     console.log("User interacted:", r);
  //   });

  //   return () => {
  //     if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
  //     if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
  //   };
  // }, []);

  // Manual helper for testing - left active but uses Alerts only.
  async function handleManualRegister() {
    // This currently only alerts / shows a message.
    // When enabling real auth & registerDeviceTokenForUser, uncomment the code below.
    Alert.alert("Manual register is currently disabled", "Bạn đang ở chế độ phát triển giao diện.");
    /*
    if (!auth.currentUser) {
      return Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để đăng ký thiết bị.");
    }
    try {
      const token = await registerDeviceTokenForUser(auth.currentUser.uid);
      if (token) {
        setInfoText(`Token: ${token.slice(0,40)}...`);
        Alert.alert("Đã đăng ký token", token);
      } else {
        Alert.alert("Không lấy được token");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", String(err.message || err));
    }
    */
  }

  // If fonts not loaded yet, return null to avoid flicker / missing icons
  if (!fontsLoaded) {
    return null; // or return a splash/loading indicator if you prefer
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <NavigationContainer>
        <RootStack />
      </NavigationContainer>

      {/* <View style={{ position: "absolute", bottom: 20, left: 12, right: 12 }}>
        <Button mode="contained" onPress={handleManualRegister} style={{ marginBottom: 8 }}>
          Đăng ký token (Manual) - ĐÃ TẮT
        </Button>
        <Text variant="bodySmall" style={{ color: "#fff" }}>
          {statusText}
        </Text>
        <Text variant="bodySmall" style={{ color: "#fff" }}>
          {infoText}
        </Text>
      </View> */}
    </PaperProvider>
  );
}
