import  { useState } from "react";
import { View, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

let jwtDecode;
try {
  const _jwt = require("jwt-decode");
  jwtDecode = _jwt && _jwt.default ? _jwt.default : _jwt;
} catch (e) {
  jwtDecode = null;
  console.warn("jwt-decode not available", e);
}

const decodeJwtToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const atobFn =
      typeof globalThis?.atob === "function"
        ? globalThis.atob
        : typeof atob === "function"
        ? atob
        : (typeof Buffer !== "undefined" && Buffer.from)
        ? (s) => Buffer.from(s, "base64").toString("utf8")
        : null;

    if (!atobFn) return null;
    const binary = atobFn(base64);
    let jsonPayload;
    if (/[\x00-\x1f]/.test(binary)) {
      const escaped = Array.prototype.map
        .call(binary, function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("");
      jsonPayload = decodeURIComponent(escaped);
    } else {
      jsonPayload = binary;
    }
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("decodeJwtToken failed", e);
    return null;
  }
};

export default function LoginScreen() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const persistTokenAndPayload = async (token, refreshToken) => {
    if (!token) return;
    try {
      await AsyncStorage.setItem("@auth_token", token);
      if (refreshToken) await AsyncStorage.setItem("@refresh_token", refreshToken);

      const decoder = typeof jwtDecode === "function" ? jwtDecode : decodeJwtToken;
      let payload = null;
      try {
        if (typeof decoder === "function") payload = decoder(token);
      } catch (e) {
        console.warn("jwt decode threw", e);
      }

      if (payload) {
        await AsyncStorage.setItem("@user", JSON.stringify(payload));

        const employeeCode = payload.EmployeeCode ?? payload.employeeCode ?? payload.Username ?? payload.username ?? null;
        const employeeId = payload.Id ?? payload.id ?? null;
        const employeeRoleId = payload.EmployeeRoleId ?? payload.employeeRoleId ?? null;
        const username = payload.Username ?? payload.username ?? payload.UserName ?? null;

        if (employeeCode) await AsyncStorage.setItem("@employeeCode", String(employeeCode));
        if (employeeId) await AsyncStorage.setItem("@employeeId", String(employeeId));
        if (employeeRoleId) await AsyncStorage.setItem("@employeeRoleId", String(employeeRoleId));
        if (username) await AsyncStorage.setItem("@username", String(username));

        if (payload.exp) {
          const expMs = Number(payload.exp) * 1000;
          if (!Number.isNaN(expMs)) {
            await AsyncStorage.setItem("@token_expiry", String(expMs));
          }
        }
      } else {
        console.warn("No payload decoded from token; not saving @user");
      }
    } catch (e) {
      console.warn("persistTokenAndPayload error", e);
    }
  };

  const handleLogin = async () => {
    const { email, password } = formData;
    if (!email || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const url = (API_BASE_URL && API_BASE_URL.length)
        ? `${API_BASE_URL}/api/Authentication/employee-login`
        : "https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net/api/Authentication/employee-login";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const message = (json && (json.message || json.errorMessage || JSON.stringify(json))) || `HTTP ${res.status}`;
        Alert.alert("Đăng nhập thất bại", message);
        setLoading(false);
        return;
      }

      if (!json) {
        Alert.alert("Đăng nhập thất bại", "Không nhận được phản hồi hợp lệ từ server");
        setLoading(false);
        return;
      }

      let accessToken = null;
      if (typeof json === "string") accessToken = json;
      else if (json.accessToken) accessToken = json.accessToken;
      else if (json.token) accessToken = json.token;
      else if (json.data && json.data.token) accessToken = json.data.token;
      else if (json.result && json.result.token) accessToken = json.result.token;
      else {
        const keys = Object.keys(json);
        for (let k of keys) {
          const v = json[k];
          if (typeof v === "string" && v.split && v.split(".").length === 3) {
            accessToken = v;
            break;
          }
        }
      }

      const refreshToken = json.refreshToken ?? json.refresh_token ?? null;

      if (!accessToken) {
        Alert.alert("Đăng nhập thất bại", "Không tìm thấy token trong phản hồi.");
        setLoading(false);
        return;
      }

      await persistTokenAndPayload(accessToken, refreshToken);

      setLoading(false);
      Alert.alert("Đăng nhập thành công");
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      console.error("login error", error);
      Alert.alert("Lỗi mạng", "Không thể kết nối tới server. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1765056163/1765055950791-removebg-preview_wpkvwn.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.title}>Chào mừng trở lại</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(t) => handleChange("email", t)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Mật khẩu"
            value={formData.password}
            onChangeText={(t) => handleChange("password", t)}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword((p) => !p)} />}
          />

          <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={styles.loginBtn} labelStyle={{ color: "white", fontWeight: "bold" }}>
            Đăng nhập
          </Button>

          <Button mode="text" onPress={() => navigation.navigate("ForgotPassword")}>
            Quên mật khẩu?
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", flexGrow: 1, justifyContent: "center", padding: 16 },
  card: { borderRadius: 16, padding: 24 },
  logo: { width: 120, height: 150, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  subtitle: { textAlign: "center", color: "#666", marginBottom: 20 },
  input: { marginBottom: 12, backgroundColor: "white" },
  loginBtn: { backgroundColor: "#00B050", borderRadius: 8, paddingVertical: 6, marginTop: 10 },
});
