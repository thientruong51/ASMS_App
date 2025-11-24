import { View, StyleSheet } from "react-native";
import { Surface, Text } from "react-native-paper";

export default function KPIBoxes({ items = [] }) {
  return (
    <View style={styles.kpiContainer}>
      {items.map((it, idx) => (
        <Surface key={idx} style={[styles.kpiBox, styles.shadow]}>
          <View style={styles.kpiInner}>
            <Text style={[styles.kpiNumber, { color: it.color }]}>{it.value}</Text>
            <Text style={styles.kpiLabel}>{it.label}</Text>
          </View>
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kpiContainer: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between"
  },
  kpiBox: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "white"
  },
  kpiInner: { alignItems: "center" },
  kpiNumber: { fontSize: 20, fontWeight: "900" },
  kpiLabel: { fontSize: 12, color: "#666", marginTop: 4 },

  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  }
});
