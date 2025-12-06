import { View, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

export default function ContainerCard({ item = {}, onInfo, onConfig, onPress }) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) return onPress(item);
    navigation.navigate("OrderDetail", { orderId: item.orderCode ?? item.ref, order: item });
  };

  const currency = (v) => {
    const n = Number(v || 0);
    return n.toLocaleString?.() ?? String(n);
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, day] = d.split("-");
        return `${day}.${m}.${y}`;
      }
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString();
      }
      return String(d);
    } catch {
      return String(d);
    }
  };

  const statusColor = (s) => {
    if (!s) return "#777";
    const st = String(s).toLowerCase();
    if (st.includes("paid")) return "#1AA64B";
    if (st.includes("pending")) return "#f39c12";
    if (st.includes("unpaid") || st.includes("un-paid")) return "#e74c3c";
    if (st.includes("inorder") || st.includes("active") || st.includes("verify") || st.includes("checkout")) return "#108a3f";
    if (st.includes("pick") || st.includes("pick up") || st.includes("wait pick up")) return "#0a8bd6";
    return "#777";
  };

  const openDial = (phone) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then((ok) => ok && Linking.openURL(url)).catch(() => {});
  };

  const openSms = (phone) => {
    if (!phone) return;
    const url = `sms:${phone}`;
    Linking.canOpenURL(url).then((ok) => ok && Linking.openURL(url)).catch(() => {});
  };

  const openEmail = (email) => {
    if (!email) return;
    const url = `mailto:${email}`;
    Linking.canOpenURL(url).then((ok) => ok && Linking.openURL(url)).catch(() => {});
  };

  const mapStatusToVN = (s) => {
    if (!s) return "-";
    const st = String(s).toLowerCase();

    if (st.includes("pending")) return "Đang chờ";
    if (st.includes("wait pick up") || st.includes("wait_pick_up") || st.includes("waiting pickup")) return "Chờ lấy hàng";
    if (st.includes("pick up") || st.includes("pickup")) return "Đang lấy hàng";
    if (st.includes("verify")) return "Đang xác minh";
    if (st.includes("checkout")) return "Đã xác nhận";

    if (st.includes("paid")) return "Đã thanh toán";
    if (st.includes("unpaid") || st.includes("un-paid")) return "Chưa thanh toán";
    if (st.includes("inorder")) return "Trong đơn";
    if (st.includes("active")) return "Hoạt động";

    return s;
  };

  const mapPaymentToVN = (p) => {
    if (!p) return "-";
    const pp = String(p).toLowerCase();
    if (pp === "pending") return "Đang chờ";
    if (pp === "paid") return "Đã thanh toán";
    if (pp === "unpaid" || pp === "un-paid") return "Chưa thanh toán";
    return p;
  };

  const mapStyleToVN = (sty) => {
    if (!sty) return "-";
    const s = String(sty).toLowerCase();
    if (s === "full") return "Trọn gói";
    if (s === "self") return "Tự quản";
    return sty;
  };

  const address = item.pickup?.address ?? item.address ?? item.raw?.pickupAddress ?? "-";
  const phone = item.pickup?.contact ?? item.phoneContact ?? item.raw?.phoneContact ?? "-";
  const email = item.raw?.email ?? item.email ?? "-";
  const note = item.note ?? item.raw?.note ?? "";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Card style={styles.card}>
        <Card.Content>
          {/* header: code + actions */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>MÃ ĐƠN</Text>
              <Text style={styles.title}>{item.orderCode ?? item.ref ?? "-"}</Text>
              {/* address displayed under title */}
              <Text style={styles.subText} numberOfLines={2}>
                <Icon name="map-marker-outline" size={14} color="#666" />{" "}
                {address ?? "-"}
              </Text>
            </View>

            <View style={styles.actionsRight}>
              <View style={[styles.statusWrap, { borderColor: statusColor(item.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(item.status) }]} numberOfLines={1}>
                  {mapStatusToVN(item.status)}
                </Text>
              </View>

              <TouchableOpacity style={styles.infoBtn} onPress={() => onInfo && onInfo(item)}>
                <Icon name="information-outline" size={18} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          {/* top detail row: dates + payment */}
          <View style={styles.topDetailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.smallLabel}>Ngày đặt</Text>
              <Text style={styles.smallValue}>{formatDate(item.pickup?.date)}</Text>
            </View>

            <View style={styles.detailCol}>
              <Text style={styles.smallLabel}>Ngày trả</Text>
              <Text style={styles.smallValue}>{formatDate(item.delivery?.date)}</Text>
            </View>
          </View>

          {/* money & style */}
          <View style={[styles.topDetailRow, { marginTop: 10 }]}>
            <View style={styles.detailCol}>
              <Text style={styles.smallLabel}>Tổng</Text>
              <Text style={[styles.smallValue, styles.boldValue]}>{currency(item.totalPrice)} đ</Text>
            </View>

            <View style={styles.detailCol}>
              <Text style={styles.smallLabel}>Còn nợ</Text>
              <Text style={[styles.smallValue, { color: (Number(item.unpaidAmount) > 0 ? "#e74c3c" : "#1AA64B"), fontWeight: "700" }]}>
                {currency(item.unpaidAmount)} đ
              </Text>
            </View>

            <View style={styles.detailCol}>
              <Text style={styles.smallLabel}>Hình thức</Text>
              <Text style={styles.smallValue}>{mapStyleToVN(item.style ?? "-")}</Text>
            </View>
          </View>

          {/* contact block (phone + email) */}
          <View style={styles.contactBlock}>
            <View style={styles.contactMain}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="account-circle-outline" size={18} color="#108a3f" />
                <Text style={styles.contactName}>{ (item.pickup?.customerName ?? "-")}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <Icon name="phone" size={16} color="#108a3f" />
                <Text style={styles.contactInfo}>{phone}</Text>
              </View>
            </View>
          </View>

          {/* note & paymentStatus */}
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              {note ? (
                <>
                  <Text style={styles.noteTitle}>GHI CHÚ</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </>
              ) : null}
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.smallLabel}>Trạng thái thanh toán</Text>
              <Text style={[styles.paymentStatus, { color: statusColor(item.paymentStatus) }]}>
                {mapPaymentToVN(item.paymentStatus)}
              </Text>
            </View>
          </View>

          {/* bottom actions */}
          <View style={styles.bottomActions}>
            <Button
              mode="contained"
              compact
              onPress={() => console.log("Primary action", item.orderCode)}
              contentStyle={styles.actionContent}
              style={[styles.primaryBtn]}
            >
              <Icon name="truck-fast" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>  vận chuyển</Text>
            </Button>

            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.iconAction} onPress={() => phone && openSms(phone)}>
                <Icon name="message-text-outline" size={18} color="#108a3f" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconAction} onPress={() => phone && openDial(phone)}>
                <Icon name="phone" size={18} color="#108a3f" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconAction} onPress={() => email && openEmail(email)}>
                <Icon name="email" size={18} color="#108a3f" />
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 3,
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  label: { color: "#777", fontSize: 12 },
  title: { fontSize: 16, fontWeight: "800", color: "#222", marginTop: 4 },
  subText: { color: "#666", marginTop: 6 },

  actionsRight: { alignItems: "flex-end", marginLeft: 12 },
  statusWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusText: { fontWeight: "700", fontSize: 12 },

  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    justifyContent: "center",
  },

  topDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  detailCol: { flex: 1, paddingRight: 8 },
  smallLabel: { fontSize: 12, color: "#888" },
  smallValue: { fontSize: 14, color: "#333", marginTop: 6 },
  boldValue: { fontWeight: "800" },

  contactBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  contactMain: { flex: 1 },
  contactName: { marginLeft: 8, color: "#333", fontWeight: "700", marginLeft: 6 },
  contactInfo: { marginLeft: 8, color: "#666" },

  contactActions: { flexDirection: "row", marginLeft: 8 },

  transportBlock: {
    flexDirection: "row",
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },

  transportLeft: { width: 56, alignItems: "center" },
  badge: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },

  transportMain: { flex: 1, paddingRight: 10 },
  transportLabel: { fontWeight: "800", color: "#333" },
  transportDate: { fontWeight: "800", color: "#1aa64b" },
  transportAddress: { marginTop: 6, color: "#555" },

  transportContactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  contactLeft: { flexDirection: "row", alignItems: "center" },
  contactName: { marginLeft: 8, color: "#555" },

  contactRight: { flexDirection: "row" },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#eaffee",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  gearBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  noteTitle: { color: "#888", fontSize: 12 },
  noteText: { marginTop: 6, fontWeight: "700", color: "#444" },

  paymentStatus: { fontWeight: "800", marginTop: 4 },

  bottomActions: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  actionContent: { height: 44 },
  primaryBtn: { backgroundColor: "#18a34a", borderRadius: 8, paddingHorizontal: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#eaffee",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
