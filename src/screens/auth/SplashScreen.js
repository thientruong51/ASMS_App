import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem("@auth_token");
        const exp = await AsyncStorage.getItem("@token_expiry");

        if (token && exp && Date.now() < Number(exp)) {
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          });
        }
      } catch (e) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    };

    bootstrap();
  }, []);

  return (
    <LinearGradient colors={["#2B6624", "#5DFC52"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1765056163/1765055950791-removebg-preview_wpkvwn.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ActivityIndicator size="large" color="white" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "white",
    borderRadius: 999,
    padding: 60,
    marginBottom: 30,
  },
  logo: {
    width: 170,
    height: 170,
  },
});
