import { View, Image, StyleSheet } from "react-native";
import { Card, Title, Text } from "react-native-paper";

export default function StatRow({ iconUri, title, value, iconBg }) {
  return (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statLeft}>
          <View style={[styles.statIconCircle, { backgroundColor: iconBg || "#fff" }]}>
            <Image source={{ uri: iconUri }} style={styles.statIconImage} />
          </View>
          <Title style={styles.statTitle}>{title}</Title>
        </View>

        <Text style={[styles.statValue, { color: value.color }]}>{value.text}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  statCard: {
    borderRadius: 12,
    marginBottom: 12
  },
  statCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statLeft: { flexDirection: "row", alignItems: "center" },
  statIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  statIconImage: { width: 32, height: 28 },
  statTitle: { fontSize: 16, fontWeight: "700" },
  statValue: { fontSize: 20, fontWeight: "900" }
});
