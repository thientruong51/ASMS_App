import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Alert,
  StatusBar,
  AppState,
  Platform,
} from "react-native";
import {
  Provider as PaperProvider,
  DefaultTheme,
  Button,
  Text,
} from "react-native-paper";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation/RootStack";
import { useFonts } from "expo-font";

// IMPORTANT: load MaterialCommunityIcons font
const materialIconsFont = require(
  "react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"
);

/* ===========================
   Notification display config
   =========================== */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/* ===========================
   Request local notification permission
   =========================== */
async function registerLocalNotificationPermission() {
  if (!Constants.isDevice) return;

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1565c0",
    });
  }
}

/* ===========================
   Theme
   =========================== */
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1565c0",
    accent: "#ff4081",
  },
};

export default function App() {
  /* ===========================
     Fonts
     =========================== */
  const [fontsLoaded] = useFonts({
    MaterialCommunityIcons: materialIconsFont,
  });

  /* ===========================
     UI-only states (kept)
     =========================== */
  const [statusText, setStatusText] = useState("Chưa đăng nhập");
  const [infoText, setInfoText] = useState("Token chưa có");

  /* ===========================
     Refs (kept for future use)
     =========================== */
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const appState = useRef(AppState.currentState);

  /* ===========================
     Request notification permission on app start
     =========================== */
  useEffect(() => {
    registerLocalNotificationPermission();
  }, []);

  /* ===========================
     Placeholder auth / push logic (disabled)
     =========================== */
  useEffect(() => {
    // Intentionally left blank
    return () => {};
  }, []);

  /* ===========================
     Manual test helper (disabled)
     =========================== */
  async function handleManualRegister() {
    Alert.alert(
      "Disabled",
      "Chế độ FE-only. Không dùng Firebase / BE push."
    );
  }

  /* ===========================
     Avoid render before fonts ready
     =========================== */
  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      <NavigationContainer>
        <RootStack />
      </NavigationContainer>

      {/*
      <View style={{ position: "absolute", bottom: 20, left: 12, right: 12 }}>
        <Button
          mode="contained"
          onPress={handleManualRegister}
          style={{ marginBottom: 8 }}
        >
          Test notification
        </Button>
        <Text variant="bodySmall" style={{ color: "#fff" }}>
          {statusText}
        </Text>
        <Text variant="bodySmall" style={{ color: "#fff" }}>
          {infoText}
        </Text>
      </View>
      */}
    </PaperProvider>
  );
}
