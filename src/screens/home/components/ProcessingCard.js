import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function ProcessingCard({ data = {}, onStart, onInfo, onConfig }) {
  return (
    <Card style={styles.processingCard}>
      <Card.Content>
        {/* HEADER */}
        <View style={styles.processingHeader}>
          <View>
            <Text style={styles.containerId}>CONTAINER ID:</Text>
            <Text style={styles.containerRef}>{data.ref || "# BAQENPX-24FT"}</Text>
          </View>

          <TouchableOpacity style={styles.infoBtn} onPress={onInfo}>
            <Icon name="information-outline" size={20} color="#777" />
          </TouchableOpacity>
        </View>

        {/* TAGS */}
        <View style={styles.processingInfoRow}>
          <View style={styles.processingTag}>
            <Icon name="map-marker-distance" size={18} color="#777" />
            <Text style={styles.processingTagText}>{data.distance || "12,3km"}</Text>
          </View>

          <View style={styles.processingTag}>
            <Icon name="card-bulleted-outline" size={18} color="#777" />
            <Text style={styles.processingTagText}>{data.plate || "51E1-32124"}</Text>
          </View>

          <View style={styles.processingTag}>
            <Icon name="cube-outline" size={18} color="#777" />
            <Text style={styles.processingTagText}>{data.type || "Cont lạnh"}</Text>
          </View>
        </View>

        {/* PICKUP ROW */}
        <View style={styles.pickupRow}>
          <View style={styles.pickupLeft}>
            <View style={styles.pickupIconWrapper}>
              <Icon name="arrow-up-bold-circle" size={26} color="#1AA64B" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.pickupTitle}>
                LẤY HÀNG: <Text style={styles.pickupDate}>{data.pickupDate || "16.01.2024"}</Text>
              </Text>
              <View style={styles.addressRow}>
                <Icon name="map-marker-outline" size={16} color="#777" />
                <Text style={styles.pickupAddress}>
                  {data.pickupAddress || "27B QL1A, Linh Xuân, Thủ Đức, Hồ Chí Minh"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.gearBtnProcessing} onPress={onConfig}>
            <Icon name="cog-outline" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        {/* START BUTTON */}
        <TouchableOpacity style={styles.startBtn} onPress={onStart}>
          <Icon name="truck-fast" size={18} color="#fff" />
          <Text style={styles.startBtnText}>  vận chuyển</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  processingCard: {
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingTop: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eaeaea"
  },

  processingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },

  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    justifyContent: "center"
  },

  processingInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },

  processingTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },

  processingTagText: {
    marginLeft: 6,
    color: "#555",
    fontWeight: "600"
  },

  pickupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },

  pickupLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center"
  },

  pickupIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e9f9ee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },

  pickupTitle: {
    fontWeight: "800",
    color: "#333"
  },

  pickupDate: {
    color: "#1AA64B",
    fontWeight: "800"
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },

  pickupAddress: {
    flex: 1,
    marginLeft: 8,
    color: "#555",
    lineHeight: 20
  },

  gearBtnProcessing: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
  },

  startBtn: {
    marginTop: 6,
    backgroundColor: "#18A34A",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row"
  },

  startBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },

  containerId: { color: "#777", fontSize: 12 },
  containerRef: { fontSize: 16, fontWeight: "800" }
});
