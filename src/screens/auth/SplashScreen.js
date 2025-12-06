import { View, Image, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate("Welcome");
  };

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

      <Button mode="contained" onPress={handleGetStarted} style={styles.button} labelStyle={styles.buttonLabel}>
        Get Started
      </Button>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    backgroundColor: "white",
    borderRadius: 999,
    padding: 60,
    marginBottom: 130,
  },
  logo: {
    width: 170,
    height: 170,
  },
  button: {
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 6,
  },
  buttonLabel: {
    color: "#00B050",
    fontWeight: "bold",
    fontSize: 22,
  },
});
