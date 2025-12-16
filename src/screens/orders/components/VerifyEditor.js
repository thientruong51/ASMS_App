import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text as RNText,
} from "react-native";
import { Surface, Text, Button, Card, TextInput, Chip } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FALLBACK_API_BASE =
  "https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net";



export default function VerifyEditor({
  orderCode,
  initialOrder = {},
  initialDetails = [],
  apiBase = FALLBACK_API_BASE,
  onCancel,
  onSaved,
  focusDetailId = null,
}) {
  const normalize = (d) => {
    const qty = Number(d.quantity ?? 1) || 1;
    const cqty = Number(d.containerQuantity ?? 1) || 1;
    const price = Number(d.price ?? 0);
    const sub = Number(d.subTotal ?? price * qty * cqty) || 0;
    return {
      orderDetailId: Number(d.orderDetailId ?? 0),
      price,
      quantity: qty,
      containerQuantity: cqty,
      containerType: Number(d.containerType ?? 0) || null,
      productTypeIds: Array.isArray(d.productTypeIds) ? d.productTypeIds.map(Number) : [],
      serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds.map(Number) : [],
      subTotal: sub,
      raw: d,
    };
  };

  const initialDetailsRef = useRef((initialDetails || []).map(normalize));

  const [localDetails, setLocalDetails] = useState(() =>
    (initialDetailsRef.current || []).map((d) => ({ ...d }))
  );

  const [activeDetailIndex, setActiveDetailIndex] = useState(null);

  const [localOrderMeta, setLocalOrderMeta] = useState({
    depositDate: initialOrder.depositDate ?? initialOrder.orderDate ?? "",
    returnDate: initialOrder.returnDate ?? initialOrder.depositDate ?? "",
    status: "verify",
    paymentStatus: initialOrder.paymentStatus ?? "",
    totalPrice: Number(initialOrder.totalPrice ?? 0),
    unpaidAmount: Number(initialOrder.unpaidAmount ?? 0),
    customerName: initialOrder.customerName ?? initialOrder.customer?.name ?? "",
    phoneContact: initialOrder.phoneContact ?? initialOrder.phone ?? "",
    email: initialOrder.email ?? "",
    note: initialOrder.note ?? "",
    image: initialOrder.image ?? null,
    address: initialOrder.address ?? "",
    style: initialOrder.style ?? "",
    storageTypeId: initialOrder.storageTypeId ?? 0,
    shelfTypeId: initialOrder.shelfTypeId ?? 0,
    shelfQuantity: initialOrder.shelfQuantity ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [containerTypes, setContainerTypes] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [selector, setSelector] = useState({ visible: false, type: null, detailIndex: null });

  const SURCHARGE_RULES = [
    { test: /dễ vỡ|fragile/i, pct: 20 },
    { test: /điện tử|electronics|electro/i, pct: 10 },
    { test: /kho lạnh|cold/i, pct: 15 },
    { test: /nặng|heavy/i, pct: 25 },
  ];

  useEffect(() => {
    let mounted = true;
    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        const token = await AsyncStorage.getItem("@auth_token");
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        try {
          const res = await fetch(`${apiBase}/api/ContainerType`, { headers });
          const json = await res.json().catch(() => null);
          const arr = Array.isArray(json) ? json : json?.data ?? [];
          if (mounted && Array.isArray(arr)) setContainerTypes(arr);
        } catch (err) {
          console.warn("ContainerType fetch failed", err);
        }

        try {
          const res2 = await fetch(`${apiBase}/api/ProductType?pageNumber=1&pageSize=200`, { headers });
          const json2 = await res2.json().catch(() => null);
          const raw = Array.isArray(json2) ? json2 : json2?.data ?? [];
          if (mounted && Array.isArray(raw)) {
            const normalizedList = raw.map((p) => ({
              productTypeId: p.productTypeId ?? p.id ?? 0,
              name: p.name ?? p.vname ?? String(p.productTypeId ?? ""),
              isActive: typeof p.isActive === "boolean" ? p.isActive : (p.status ? String(p.status).toLowerCase().includes("active") : true),
            }));
            setProductTypes(normalizedList);
          }
        } catch (err) {
          console.warn("ProductType fetch failed", err);
        }
      } finally {
        if (mounted) setLoadingLookups(false);
      }
    };
    loadLookups();
    return () => (mounted = false);
  }, [apiBase]);

  const getContainerBasePrice = (containerTypeId) => {
    const ct = containerTypes.find((c) => Number(c.containerTypeId ?? c.containerTypeId) === Number(containerTypeId));
    return ct ? Number(ct.price ?? 0) : 0;
  };
  const getProductTypeName = (id) => {
    const p = productTypes.find((x) => Number(x.productTypeId) === Number(id));
    return p ? p.name : "";
  };
  const detectSurchargeForProductType = (name) => {
    if (!name) return 0;
    for (const r of SURCHARGE_RULES) if (r.test.test(name)) return r.pct;
    return 0;
  };
  const computeSurchargePercentForDetail = (detail) => {
    const ids = detail.productTypeIds || [];
    if (!ids.length) return 0;
    let total = 0;
    for (const id of ids) total += detectSurchargeForProductType(getProductTypeName(id));
    return total;
  };
  const computePriceForDetail = (detail) => {
    const base = getContainerBasePrice(detail.containerType);
    const pct = computeSurchargePercentForDetail(detail);
    return Math.round(base * (1 + pct / 100));
  };
  const computeSubTotal = (detail) => {
    const price = Number(detail.price ?? computePriceForDetail(detail) ?? 0);
    const qty = Number(detail.quantity ?? 1) || 0;
    const cqty = Number(detail.containerQuantity ?? 1) || 1;
    return price * qty * cqty;
  };

  useEffect(() => {
    setLocalDetails((prev) =>
      prev.map((d) => {
        const computed = computePriceForDetail(d);
        const useAuto = d._autoPrice === undefined || d._autoPrice === true || !d.price;
        const newPrice = useAuto ? computed : d.price;
        const newSub = newPrice * Number(d.quantity ?? 1) * Number(d.containerQuantity ?? 1);
        return { ...d, price: newPrice, subTotal: newSub, _autoPrice: useAuto };
      })
    );
  }, [containerTypes, productTypes]);

  useEffect(() => {
    if (!Array.isArray(initialDetails)) return;
    const server = initialDetails.map(normalize);
    setLocalDetails((prev) => {
      const byId = new Map();
      prev.forEach((p) => {
        const id = Number(p.orderDetailId ?? 0);
        byId.set(id, { ...p });
      });
      server.forEach((s) => {
        const id = Number(s.orderDetailId ?? 0);
        if (byId.has(id)) {
          const local = byId.get(id);
          const merged = { ...local, ...s };
          if (local._autoPrice === false) merged.price = local.price;
          if (typeof local.quantity !== "undefined") merged.quantity = local.quantity;
          merged.subTotal = computeSubTotal(merged);
          merged._autoPrice = merged._autoPrice ?? true;
          byId.set(id, merged);
        } else {
          byId.set(id, { ...s, subTotal: computeSubTotal(s), _autoPrice: true });
        }
      });
      const final = [];
      server.forEach((s) => {
        const id = Number(s.orderDetailId ?? 0);
        if (byId.has(id)) {
          final.push(byId.get(id));
          byId.delete(id);
        }
      });
      prev.forEach((p) => {
        const id = Number(p.orderDetailId ?? 0);
        if (byId.has(id)) {
          final.push(byId.get(id));
          byId.delete(id);
        }
      });
      byId.forEach((v) => final.push(v));
      initialDetailsRef.current = server;
      return final;
    });
  }, [initialDetails]);

  useEffect(() => {
    if (focusDetailId === null || typeof focusDetailId === "undefined") {
      setActiveDetailIndex(null);
      return;
    }
    const fid = Number(focusDetailId);
    const idx = localDetails.findIndex((d) => Number(d.orderDetailId) === fid);
    if (idx >= 0) setActiveDetailIndex(idx);
    else setActiveDetailIndex(null);
  }, [focusDetailId, localDetails]);

  const getAllUsedPositiveIds = () => {
    const used = new Set();
    (initialDetailsRef.current || []).forEach((it) => {
      const id = Number(it.orderDetailId ?? 0);
      if (id > 0) used.add(id);
    });
    (localDetails || []).forEach((it) => {
      const id = Number(it.orderDetailId ?? 0);
      if (id > 0) used.add(id);
    });
    return used;
  };
  const generateUniqueRandomId = () => {
    const used = getAllUsedPositiveIds();
    for (let i = 0; i < 200; i++) {
      const id = Math.floor(Math.random() * 99999) + 1;
      if (id < 99999 && !used.has(id)) return id;
    }
    for (let id = 1; id < 99999; id++) if (!used.has(id)) return id;
    return 99998;
  };

  const onChangeDetail = (idx, patch) => {
    setLocalDetails((prev) => {
      const arr = prev.slice();
      const cur = { ...(arr[idx] || {}) };
      Object.assign(cur, patch);
      if (patch.containerType !== undefined || patch.productTypeIds !== undefined) {
        cur.price = computePriceForDetail(cur);
        cur._autoPrice = true;
      } else if (patch.price !== undefined) {
        cur._autoPrice = false;
      }
      if (patch.quantity !== undefined) {
        cur.quantity = Number(patch.quantity ?? 0);
        if (Number.isNaN(cur.quantity) || cur.quantity < 0) cur.quantity = 0;
      }
      cur.subTotal = computeSubTotal(cur);
      arr[idx] = cur;
      return arr;
    });
  };

  const onAddItem = () => {
    const newId = generateUniqueRandomId();
    setLocalDetails((p) => [
      ...p,
      {
        orderDetailId: newId,
        storageCode: null,
        containerCode: "",
        containerType: null,
        containerQuantity: 1,
        price: 0,
        quantity: 1,
        image: null,
        productTypeIds: [],
        serviceIds: [],
        storageTypeId: null,
        shelfTypeId: null,
        shelfQuantity: null,
        subTotal: 0,
        _autoPrice: true,
      },
    ]);
    setActiveDetailIndex(localDetails.length);
  };

  const onRemoveItem = (idx) => {
    const item = localDetails[idx];
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa mục này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          const id = Number(item?.orderDetailId ?? 0);
          const existsInInitial = !!(initialDetailsRef.current || []).find((d) => Number(d.orderDetailId) === id && id > 0);
          if (id > 0 && existsInInitial) {
            setLocalDetails((prev) => {
              const arr = prev.slice();
              const cur = { ...(arr[idx] || {}) };
              cur.quantity = 0;
              cur.containerQuantity = 0;
              cur.subTotal = computeSubTotal(cur);
              arr[idx] = cur;
              return arr;
            });
          } else {
            setLocalDetails((p) => p.filter((_, i) => i !== idx));
          }
        },
      },
    ]);
  };


  const openSelector = (type, detailIndex) => setSelector({ visible: true, type, detailIndex });
  const closeSelector = () => setSelector({ visible: false, type: null, detailIndex: null });

  const toggleProductTypeForDetail = (detailIdx, productTypeId) => {
    setLocalDetails((prev) => {
      const arr = prev.slice();
      const cur = { ...(arr[detailIdx] || {}) };
      const ids = new Set(cur.productTypeIds || []);
      if (ids.has(productTypeId)) ids.delete(productTypeId);
      else ids.add(productTypeId);
      cur.productTypeIds = Array.from(ids);
      cur.price = computePriceForDetail(cur);
      cur.subTotal = computeSubTotal(cur);
      cur._autoPrice = true;
      arr[detailIdx] = cur;
      return arr;
    });
  };

  const selectContainerTypeForDetail = (detailIdx, containerTypeId) => {
    setLocalDetails((prev) => {
      const arr = prev.slice();
      const cur = { ...(arr[detailIdx] || {}) };
      cur.containerType = Number(containerTypeId);
      cur.price = computePriceForDetail(cur);
      cur.subTotal = computeSubTotal(cur);
      cur._autoPrice = true;
      arr[detailIdx] = cur;
      return arr;
    });
    closeSelector();
  };

  const getContainerTypeLabel = (id) => {
    const t = containerTypes.find((c) => Number(c.containerTypeId ?? c.containerTypeId) === Number(id));
    if (!t) return id ? String(id) : "-";
    return `${t.type ?? `#${t.containerTypeId}`} • ${(Number(t.price || 0)).toLocaleString()} đ`;
  };
  const getProductTypeLabel = (id) => {
    const p = productTypes.find((x) => Number(x.productTypeId) === Number(id));
    return p ? p.name : String(id);
  };

  const currentDetailsTotal = useMemo(() => localDetails.reduce((acc, it) => acc + Number(it.subTotal || 0), 0), [localDetails]);
  const originalDetailsTotal = useMemo(() => {
    const arr = initialDetailsRef.current || [];
    return arr.reduce((acc, it) => acc + Number(it.subTotal || 0), 0);
  }, []);

  const originalOrderTotal = useMemo(() => {
    const v = initialOrder && typeof initialOrder.totalPrice !== "undefined"
      ? Number(initialOrder.totalPrice)
      : null;
    if (v !== null && !Number.isNaN(v) && v >= 0) return v;
    const p = initialOrder?.pricing;
    const cand = p ? (p.total ?? p.subtotal ?? p.basePrice ?? null) : null;
    if (cand !== null && typeof cand !== "undefined") {
      const n = Number(cand);
      if (!Number.isNaN(n)) return n;
    }
    return originalDetailsTotal;
  }, [initialOrder, originalDetailsTotal]);

  const computeDelta = () => {
    const origById = {};
    (initialDetailsRef.current || []).forEach((od) => {
      if (Number(od.orderDetailId) > 0) origById[Number(od.orderDetailId)] = od;
    });
    let delta = 0;
    localDetails.forEach((d) => {
      const id = Number(d.orderDetailId ?? 0);
      const newSub = Number(d.subTotal ?? computeSubTotal(d) ?? 0);
      if (id > 0 && origById[id]) {
        const origSub = Number(origById[id].subTotal ?? 0);
        delta += (newSub - origSub);
        delete origById[id];
      } else {
        delta += newSub;
      }
    });
    Object.values(origById).forEach((rem) => {
      delta -= Number(rem.subTotal ?? 0);
    });
    return Math.round(delta);
  };

  const computeFinalTotal = () => {
    const delta = computeDelta();
    const final = Math.round((Number(originalOrderTotal) || 0) + delta);
    return { final, delta };
  };

  const buildPayload = () => {
    const { final, delta } = computeFinalTotal();

    const prevUnpaid = Number(localOrderMeta.unpaidAmount ?? initialOrder.unpaidAmount ?? 0) || 0;
    const newUnpaid = Math.max(0, Math.round(prevUnpaid + delta));

    return {
      depositDate: localOrderMeta.depositDate || null,
      returnDate: localOrderMeta.returnDate || null,
      status: localOrderMeta.status || "verify",
      paymentStatus: localOrderMeta.paymentStatus ?? null,
      totalPrice: final,
      unpaidAmount: newUnpaid,
      customerName: localOrderMeta.customerName ?? "",
      phoneContact: localOrderMeta.phoneContact ?? "",
      email: localOrderMeta.email ?? "",
      note: localOrderMeta.note ?? "",
      image: localOrderMeta.image ?? null,
      address: localOrderMeta.address ?? "",
      style: localOrderMeta.style ?? "",
      storageTypeId: localOrderMeta.storageTypeId ?? 0,
      shelfTypeId: localOrderMeta.shelfTypeId ?? 0,
      shelfQuantity: localOrderMeta.shelfQuantity ?? 0,
      orderDetails: localDetails.map((d) => ({
        orderDetailId: Number(d.orderDetailId ?? 0),
        storageCode: d.storageCode ?? null,
        containerCode: d.containerCode ?? "",
        price: Number(d.price ?? 0),
        quantity: String(d.quantity ?? "0"),
        storageTypeId: d.storageTypeId ?? null,
        shelfTypeId: d.shelfTypeId ?? null,
        shelfQuantity: d.shelfQuantity ?? null,
        image: d.image ?? null,
        containerType: Number(d.containerType ?? 0),
        containerQuantity: Number(d.containerQuantity ?? 0),
        productTypeIds: Array.isArray(d.productTypeIds) ? d.productTypeIds.map(Number) : [],
        serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds.map(Number) : [],
      })),
    };
  };


  const onSubmit = async () => {
    if (!orderCode) {
      Alert.alert("Lỗi", "Không tìm thấy orderCode để cập nhật.");
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      const url = `${apiBase}/api/Order/${encodeURIComponent(orderCode)}/with-details`;
      const payload = buildPayload();

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("PUT failed", res.status, json);
        Alert.alert("Lỗi", json?.message ?? json?.errorMessage ?? `HTTP ${res.status}`);
        setSaving(false);
        return;
      }

      let returnedOrder = null;
      let returnedDetails = null;

      if (json) {
        if (json.order) returnedOrder = json.order;
        if (json.data && json.data.order) returnedOrder = json.data.order;
        if (!returnedOrder && typeof json === "object") {
          const hasOrderFields = ("orderCode" in json) || ("totalPrice" in json) || ("status" in json);
          if (hasOrderFields) returnedOrder = json;
        }

        if (json.orderDetails) returnedDetails = json.orderDetails;
        if (!returnedDetails && json.data && Array.isArray(json.data.orderDetails)) returnedDetails = json.data.orderDetails;
        if (!returnedDetails && Array.isArray(json)) returnedDetails = json;
        if (!returnedDetails && Array.isArray(json.data)) returnedDetails = json.data;
      }

      if (!returnedOrder) returnedOrder = payload;
      if (!returnedDetails) returnedDetails = payload.orderDetails;

      Alert.alert("Thành công", "Đã cập nhật đơn hàng.");
      if (typeof onSaved === "function") {
        onSaved({ order: returnedOrder, details: returnedDetails });
      }
    } catch (err) {
      console.error("submit error", err);
      Alert.alert("Lỗi", "Không thể kết nối tới server. Kiểm tra mạng.");
    } finally {
      setSaving(false);
    }
  };

  const { final: finalTotal, delta } = computeFinalTotal();

  return (
    <Surface style={styles.surface}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Chỉnh sửa chi tiết (Verify)</Text>
        <View style={{ flexDirection: "row" }}>
          <Button mode="text" onPress={() => onCancel && onCancel()}>Hủy</Button>
        </View>
      </View>

      {loadingLookups ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}

      <TextInput
        label="Ghi chú"
        mode="outlined"
        value={localOrderMeta.note}
        onChangeText={(t) => setLocalOrderMeta((p) => ({ ...p, note: t }))}
        style={{ marginBottom: 10 }}
      />

      <View style={{ marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>Mục hàng</Text>

        {localDetails.map((d, idx) => {
          const isSoftDeleted = Number(d.quantity ?? 0) === 0 && (initialDetailsRef.current || []).some((it) => Number(it.orderDetailId) === Number(d.orderDetailId));
          const isActive = activeDetailIndex === idx;
          return (
            <Card key={String(d.orderDetailId ?? idx)} style={[styles.itemCard, isSoftDeleted && { opacity: 0.6 }, isActive && styles.activeCard]}>
              <Card.Content>
                <View style={styles.rowBetween}>
                  <Text style={{ fontWeight: "800" }}>Mục #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => onRemoveItem(idx)}>
                    <Icon name="trash-can-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: "#666", marginBottom: 6 }}>{d.raw?.vname ?? d.raw?.name ?? "Loại container"}</Text>
                  <TouchableOpacity style={styles.selectorBtn} onPress={() => openSelector("container", idx)}>
                    <RNText>{d.containerType ? getContainerTypeLabel(d.containerType) : "Chọn loại container"}</RNText>
                  </TouchableOpacity>
                </View>

                <View style={styles.inlineRow}>
                  <TextInput
                    label="Số lượng container"
                    mode="outlined"
                    keyboardType="numeric"
                    style={{ width: 140 }}
                    value={String(d.containerQuantity ?? 1)}
                    onChangeText={(t) => onChangeDetail(idx, { containerQuantity: Number(t || 0) })}
                  />

                  <TextInput
                    label="Số lượng sản phẩm"
                    mode="outlined"
                    keyboardType="numeric"
                    style={{ flex: 1, marginLeft: 8 }}
                    value={String(d.quantity ?? 1)}
                    onChangeText={(t) => onChangeDetail(idx, { quantity: Number(t || 0) })}
                  />
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: "#666", marginBottom: 6 }}>Loại sản phẩm</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {(d.productTypeIds || []).length === 0 ? <Text style={{ color: "#999" }}>Chưa chọn</Text> : null}
                    {(d.productTypeIds || []).map((ptId) => (
                      <Chip key={ptId} style={styles.chip}>{getProductTypeLabel(ptId)}</Chip>
                    ))}
                    <Button compact mode="outlined" style={{ marginLeft: 8 }} onPress={() => openSelector("product", idx)}>
                      Chọn
                    </Button>
                  </View>
                </View>

                <View style={{ flexDirection: "row", marginTop: 10, gap: 8, alignItems: "center" }}>
                  <TextInput
                    label="Đơn giá (có thể chỉnh)"
                    mode="outlined"
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                    value={String(d.price ?? 0)}
                    onChangeText={(t) => onChangeDetail(idx, { price: Number(t ?? 0) })}
                  />
                  <View style={{ width: 12 }} />
                  <Text style={{ alignSelf: "center", fontWeight: "800" }}>{Number(d.subTotal || 0).toLocaleString()} đ</Text>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </View>

      <Card style={styles.summaryCard}>
        <Card.Content>
          {/* ROWS */}
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Tổng đơn ban đầu</Text>
            <Text style={styles.value}>
              {(Number(originalOrderTotal) || 0).toLocaleString()} đ
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Tổng chi tiết hiện tại</Text>
            <Text style={styles.value}>
              {currentDetailsTotal.toLocaleString()} đ
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Chênh lệch</Text>
            <Text
              style={[
                styles.value,
                { color: delta >= 0 ? "#d32f2f" : "#2e7d32" },
              ]}
            >
              {delta >= 0 ? "+" : ""}
              {delta.toLocaleString()} đ
            </Text>
          </View>

          <View style={styles.divider} />

          {/* FINAL */}
          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>Tổng kết giá</Text>
            <Text style={styles.finalValue}>
              {finalTotal.toLocaleString()} đ
            </Text>
          </View>
        </Card.Content>

        <Card.Actions style={styles.actions}>
          <Button mode="outlined" onPress={onAddItem}>
            Thêm mục
          </Button>
          <Button
            mode="contained"
            loading={saving}
            onPress={onSubmit}
            style={{ marginLeft: 8 }}
          >
            Lưu
          </Button>
        </Card.Actions>
      </Card>

      <Modal visible={selector.visible} animationType="slide" transparent onRequestClose={closeSelector}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={{ fontWeight: "800" }}>{selector.type === "container" ? "Chọn loại container" : "Chọn loại sản phẩm"}</Text>
              <TouchableOpacity onPress={closeSelector}><Icon name="close" size={20} /></TouchableOpacity>
            </View>

            <View style={{ height: 10 }} />

            {selector.type === "container" ? (
              <FlatList
                data={containerTypes.filter(ct =>
                  [1, 2, 3, 4].includes(Number(ct.containerTypeId))
                )}
                keyExtractor={(it, index) => String(it.containerTypeId ?? index)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalRow} onPress={() => selectContainerTypeForDetail(selector.detailIndex, Number(item.containerTypeId))}>
                    <View>
                      <Text style={{ fontWeight: "800" }}>{item.type ?? `#${item.containerTypeId}`}</Text>
                      <Text style={{ color: "#666" }}>{(Number(item.price || 0)).toLocaleString()} đ</Text>
                    </View>
                    <Icon name="chevron-right" />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee" }} />}
              />
            ) : (
              <FlatList
                data={productTypes}
                keyExtractor={(it, index) => String(it.productTypeId ?? index)}
                renderItem={({ item }) => {
                  const selected = (localDetails[selector.detailIndex]?.productTypeIds || []).includes(Number(item.productTypeId));
                  return (
                    <TouchableOpacity style={[styles.modalRow, selected && { backgroundColor: "#f0fff0" }]} onPress={() => toggleProductTypeForDetail(selector.detailIndex, Number(item.productTypeId))}>
                      <View>
                        <Text style={{ fontWeight: "800" }}>{item.name}</Text>
                        <Text style={{ color: "#666" }}>{item.isActive ? "Active" : "Inactive"}</Text>
                      </View>
                      <Icon name={selected ? "checkbox-marked" : "checkbox-blank-outline"} />
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee" }} />}
              />
            )}

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
              <Button mode="text" onPress={closeSelector}>Xong</Button>
            </View>
          </View>
        </View>
      </Modal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: { marginVertical: 12, padding: 12, borderRadius: 10, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerTitle: { fontWeight: "800" },
  sectionTitle: { fontWeight: "800", marginBottom: 6 },
  itemCard: { marginBottom: 10 },
  activeCard: { borderWidth: 2, borderColor: "#6aa84f" },
  inlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  selectorBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e6e6e6" },
  chip: { marginRight: 6, marginBottom: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, maxHeight: "80%", overflow: "hidden", padding: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalRow: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    color: "#666",
  },

  value: {
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },

  finalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  finalLabel: {
    fontSize: 15,
    fontWeight: "800",
  },

  finalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#108a3f",
  },

  actions: {
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
