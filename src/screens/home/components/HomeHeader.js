import { View, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function HomeHeader({ logo, brand }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.brandRow}>
          <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandText}>{brand}</Text>
        </View>

        <TouchableOpacity style={styles.powerWrap}>
          <Icon name="truck-fast" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#108a3f",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, marginRight: 10, borderRadius: 8 },
  brandText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  powerWrap: { padding: 6 }
});
