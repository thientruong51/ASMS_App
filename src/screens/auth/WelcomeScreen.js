import React from "react";
import { View, StyleSheet, Image, ImageBackground, TouchableOpacity } from "react-native";
import { Text, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground
      source={{
        uri: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1750842962/vnmap_kizr55.png",
      }}
      style={styles.background}
      resizeMode="contain"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1750842738/logobus_vxihzk.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.heading}>
          <Text style={styles.bold}>Chuyến đi</Text>
        </Text>
        <Text style={styles.heading}>
          <Text style={styles.bold}>kế tiếp của bạn</Text>
        </Text>
        <Text style={styles.subText}>
          Bất kể bạn muốn đi đến đâu, chúng tôi sẽ giúp bạn tìm ra lộ trình tốt nhất!
        </Text>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("Login")}
          style={styles.loginBtn}
          labelStyle={{ color: "#00B050" }}
        >
          Đăng nhập
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("Register")}
          style={styles.registerBtn}
          labelStyle={{ color: "white" }}
        >
          Đăng kí
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotText}>Quên mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00B050",
    opacity: 0.85,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    marginTop: 170,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginRight: 8,
  },
  heading: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "600",
    marginBottom: 0,
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
  subText: {
    color: "black",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  loginBtn: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "white",
  },
  registerBtn: {
    width: "100%",
    borderRadius: 8,
    borderColor: "white",
    borderWidth: 1.5,
    marginBottom: 16,
  },
  forgotText: {
    color: "white",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
