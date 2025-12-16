// OrderDetailScreen.js
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Text, Surface, Divider, Button, Card, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import VerifyEditor from './components/VerifyEditor';
import PhotoUploader from './components/PhotoUploaderExpo';
import PaymentWebView from './components/PaymentWebView';

const STEPS = [
  { key: 'pending', icon: 'file-document-outline', label: 'Chờ' },
  { key: 'wait pick up', icon: 'truck', label: 'Chờ lấy' },
  { key: 'verify', icon: 'shield-check-outline', label: 'Kiểm tra' },
  { key: 'checkout', icon: 'credit-card-check', label: 'Tính tiền' },
  { key: 'pick up', icon: 'truck-fast', label: 'Đã lấy' },
  { key: 'delivered', icon: 'truck-check', label: 'Đã giao' },
];

const normalizeKey = (s) => {
  if (!s && s !== 0) return '';
  return String(s).toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const STEP_INDEX = STEPS.reduce((acc, s, i) => {
  const k = normalizeKey(s.key);
  acc[k] = i;
  acc[k.replace(/\s+/g, '')] = i;
  acc[k.replace(/\s+/g, '_')] = i;
  return acc;
}, {});

function getStepState(stepIndex, currentIndex) {
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

function mapStatusToVN(s) {
  if (!s) return '-';
  const t = normalizeKey(s);
  switch (t) {
    case 'pending':
      return 'Chờ xử lý';
    case 'wait pick up':
    case 'waitpickup':
      return 'Chờ lấy hàng';
    case 'verify':
      return 'Đang kiểm tra';
    case 'checkout':
      return 'Thanh toán';
    case 'pick up':
    case 'pickup':
      return 'Đã lấy hàng';
    case 'delivered':
    case 'deliver':
      return 'Đã giao';
    default:
      return s ?? '-';
  }
}

function mapPaymentToVN(p) {
  if (!p) return '-';
  const pp = String(p).toLowerCase();
  if (pp === 'pending') return 'Đang chờ';
  if (pp === 'paid') return 'Đã thanh toán';
  if (pp === 'unpaid' || pp === 'un-paid') return 'Chưa thanh toán';
  return p;
}

function mapStyleToVN(sty) {
  if (!sty) return '-';
  const s = String(sty).toLowerCase();
  if (s === 'full') return 'Trọn gói';
  if (s === 'self') return 'Tự quản';
  return sty;
}

function SummaryRow({ label, value }) {
  return (
    <View style={ui.summaryRow}>
      <Text style={ui.summaryLabel}>{label}</Text>
      <Text style={ui.summaryValue}>{value}</Text>
    </View>
  );
}

function OrderBadge({ text, color = '#108a3f' }) {
  return (
    <View style={[ui.badge, { backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

/* ---------- translation maps & helpers (unchanged) ---------- */
const SERVICE_TRANSLATIONS = {
  'From shipping to warehouse': 'Vận chuyển đến kho',
  Protecting: 'Bảo hiểm',
  'Product Packaging': 'Đóng gói sản phẩm',
  Delivery: 'Giao hàng',
  Basic: 'Gói Basic',
  'Basic AC': 'Gói Basic (AC)',
  Business: 'Gói Business',
  'Business AC': 'Gói Business (AC)',
  Premium: 'Gói Premium',
  'Premium AC': 'Gói Premium (AC)',
};

const SHELF_TRANSLATIONS = {
  Shelf_Storage: 'Kệ Kho tự quản',
  Shelf_Logistics: 'Kệ Logistics',
  Small: 'Kệ Nhỏ',
  Medium: 'Kệ Trung',
  Large: 'Kệ Lớn',
};

const STORAGE_TRANSLATIONS = {
  Small: 'Kho Nhỏ',
  Medium: 'Kho Trung',
  Large: 'Kho Lớn',
  WareHouse: 'Nhà kho',
  WarehouseExpired: 'Kho hết hạn',
  SmallAC: 'Kho Nhỏ (AC)',
  MediumAC: 'Kho Trung (AC)',
  LargeAC: 'Kho Lớn (AC)',
  WareHouseAC: 'Nhà kho (AC)',
  WarehouseOversize: 'Kho Oversize',
};

const PRODUCTTYPE_TRANSLATIONS = {
  'Fragile': 'Hàng dễ vỡ',
  'Electronics': 'Hàng điện tử',
  'Cold Storage': 'Cần kho lạnh',
  'Heavy': 'Hàng nặng',
  'Box/Bag': 'Thùng/Vali',
};

const CONTAINER_TYPE_PREFIX = 'Thùng';

function translateServiceName(en) {
  if (!en) return null;
  if (typeof en !== 'string') return String(en);
  if (SERVICE_TRANSLATIONS[en]) return SERVICE_TRANSLATIONS[en];
  if (/shipping/i.test(en)) return 'Vận chuyển';
  if (/protect/i.test(en)) return 'Bảo hiểm';
  if (/pack/i.test(en)) return 'Đóng gói';
  if (/delivery/i.test(en)) return 'Giao hàng';
  return en;
}

function translateShelfName(en) {
  if (!en) return null;
  if (SHELF_TRANSLATIONS[en]) return SHELF_TRANSLATIONS[en];
  return en;
}

function translateStorageName(en) {
  if (!en) return null;
  if (STORAGE_TRANSLATIONS[en]) return STORAGE_TRANSLATIONS[en];
  return en;
}

function translateProductTypeName(en) {
  if (!en) return null;
  if (/[^\x00-\x7F]/.test(en)) return en;
  if (PRODUCTTYPE_TRANSLATIONS[en]) return PRODUCTTYPE_TRANSLATIONS[en];
  if (/fragile/i.test(en)) return 'Hàng dễ vỡ';
  if (/electro/i.test(en)) return 'Hàng điện tử';
  if (/cold/i.test(en)) return 'Cần kho lạnh';
  if (/heavy|nặng/i.test(en)) return 'Hàng nặng';
  return en;
}

function translateContainerType(item) {
  if (!item) return null;
  if (item.vname && String(item.vname).trim() !== '') return item.vname;
  if (item.type && String(item.type).trim() !== '') {
    const t = String(item.type).trim();
    const parts = t.split('_').map(p => p.trim());
    if (parts.length === 1) return `${CONTAINER_TYPE_PREFIX} ${parts[0]}`;
    const remainder = parts.slice(1).join(' ');
    const remTranslated = remainder
      .replace(/Storage/i, 'Storage')
      .replace(/AC/i, 'AC');
    return `${CONTAINER_TYPE_PREFIX} ${parts[0]} ${remTranslated}`;
  }
  if (item.name && String(item.name).trim() !== '') return item.name;
  return null;
}
/* ---------- end helpers ---------- */

function DetailItem({ it, lookups }) {
  const {
    productTypesMap, serviceMap, containerMap, storageMap, shelfMap,
    productTypesFull, serviceFull, containerFull, storageFull, shelfFull
  } = lookups || {};

  let productDisplayName = null;
  if (it?.productName && String(it.productName).trim() !== '') productDisplayName = it.productName;
  else if (it?.name && String(it.name).trim() !== '') productDisplayName = it.name;
  else if (it?.sku && String(it.sku).trim() !== '') productDisplayName = `#${it.sku}`;
  else if (it?.code && String(it.code).trim() !== '') productDisplayName = `#${it.code}`;

  let productTypeNames = [];
  if (Array.isArray(it?.productTypeNames) && it.productTypeNames.length > 0) productTypeNames = it.productTypeNames.map(translateProductTypeName);
  else if (Array.isArray(it?.productTypeIds) && it.productTypeIds.length > 0) {
    productTypeNames = it.productTypeIds.map(id => {
      const full = productTypesFull?.[id];
      if (full?.displayName) return full.displayName;
      const raw = productTypesMap?.[id] ?? full?.name ?? null;
      return translateProductTypeName(raw ?? `#${id}`);
    });
  } else if (it?.productTypeId) {
    const full = productTypesFull?.[it.productTypeId];
    const raw = full?.displayName ?? productTypesMap?.[it.productTypeId] ?? it.productTypeName;
    productTypeNames = [translateProductTypeName(raw)];
  } else if (it?.productTypeName) productTypeNames = [translateProductTypeName(it.productTypeName)];

  if (!productDisplayName && productTypeNames.length > 0) productDisplayName = productTypeNames.join(', ');
  if (!productDisplayName) productDisplayName = 'Sản phẩm';

  let serviceNames = [];
  if (Array.isArray(it?.serviceNames) && it.serviceNames.length > 0) {
    serviceNames = it.serviceNames.map(s => translateServiceName(s));
  } else if (Array.isArray(it?.serviceIds) && it.serviceIds.length > 0) {
    serviceNames = it.serviceIds.map(id => {
      const full = serviceFull?.[id];
      const raw = full?.displayName ?? serviceMap?.[id] ?? full?.name ?? null;
      return translateServiceName(raw ?? `#${id}`);
    });
  } else if (it?.serviceId) {
    const full = serviceFull?.[it.serviceId];
    const raw = full?.displayName ?? serviceMap?.[it.serviceId] ?? it.serviceName;
    serviceNames = [translateServiceName(raw)];
  }
  const containerObj = it?.containerTypeId ? containerFull?.[it.containerTypeId] : null;

  const containerName = containerObj
    ? String(containerObj.type ?? containerObj.name ?? containerMap?.[it.containerTypeId] ?? '')
    : (
      (it?.containerType !== undefined && (typeof it.containerType === 'number' || /^\d+$/.test(String(it.containerType))))
        ? (containerMap?.[Number(it.containerType)] ?? String(it.containerType))
        : (it?.containerType ?? null)
    );
  const storageObj = it?.storageTypeId ? storageFull?.[it.storageTypeId] : null;
  let storageName = null;
  if (storageObj?.displayName) storageName = storageObj.displayName;
  else if (storageObj?.name) storageName = translateStorageName(storageObj.name);
  else if (it?.storageType) storageName = translateStorageName(it.storageType);
  else if (storageMap?.[it.storageTypeId]) storageName = storageMap[it.storageTypeId];

  const shelfObj = it?.shelfTypeId ? shelfFull?.[it.shelfTypeId] : null;
  let shelfName = null;
  if (shelfObj?.displayName) shelfName = shelfObj.displayName;
  else if (shelfObj?.name) shelfName = translateShelfName(shelfObj.name);
  else if (it?.shelfType) shelfName = translateShelfName(it.shelfType);
  else if (shelfMap?.[it.shelfTypeId]) shelfName = shelfMap[it.shelfTypeId];

  const fmtNum = (v) => (v === null || v === undefined ? '-' : String(v));
  const formatMoney = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString() + ' đ');

  const showProductType = productTypeNames && productTypeNames.length > 0;
  const showServices = serviceNames && serviceNames.length > 0;
  const showContainer = !!(containerName || containerObj);
  const showStorage = !!(storageName || storageObj);
  const showShelf = !!(shelfName || shelfObj);

  return (
    <Card style={ui.itemCard}>
      <Card.Content style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Image source={{ uri: it?.image }} style={ui.itemImage} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text style={ui.itemTitle}>{productDisplayName}</Text>

          {showProductType && (
            <Text style={{ color: '#666', marginTop: 6 }}>Loại: {productTypeNames.join(', ')}</Text>
          )}

          {showServices && (
            <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
              {serviceNames.map((s, idx) => <Chip key={idx} style={ui.serviceChip} compact>{s}</Chip>)}
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: (showProductType || showServices) ? 12 : 8 }}>
            <Text style={ui.itemMeta}>Số lượng: <Text style={{ fontWeight: '800' }}>{it?.quantity ?? '-'}</Text></Text>
            <Text style={ui.itemPrice}>{formatMoney(it?.subTotal ?? 0)}</Text>
          </View>

          {showContainer && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#444', fontWeight: '700' }}>Thùng</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>Loại: {containerName}</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>{containerObj ? `Kích thước: ${fmtNum(containerObj.length)} x ${fmtNum(containerObj.width)} x ${fmtNum(containerObj.height)} m` : ''}</Text>
              {containerObj?.price ? <Text style={{ color: '#777', marginTop: 4 }}>Giá thùng: {formatMoney(containerObj.price)}</Text> : null}
            </View>
          )}

          {showStorage && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#444', fontWeight: '700' }}>Kho</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>Loại: {storageName}</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>{storageObj ? `Kích thước: ${fmtNum(storageObj.length)} x ${fmtNum(storageObj.width)} x ${fmtNum(storageObj.height)} m` : ''}</Text>
              {storageObj?.area ? <Text style={{ color: '#777', marginTop: 4 }}>Diện tích: {fmtNum(storageObj.area)} m² • Thể tích: {fmtNum(storageObj.totalVolume)} m³</Text> : null}
            </View>
          )}

          {showShelf && (
            <View style={{ marginTop: 8, marginBottom: 6 }}>
              <Text style={{ color: '#444', fontWeight: '700' }}>Kệ</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>Loại: {shelfName}</Text>
              <Text style={{ color: '#777', marginTop: 4 }}>{shelfObj?.length || shelfObj?.width || shelfObj?.height ? `Kích thước: ${fmtNum(shelfObj.length)} x ${fmtNum(shelfObj.width)} x ${fmtNum(shelfObj.height)} m` : ''}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function OrderDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();

  const routeOrder = route?.params?.order ?? null;
  const routeOrderId = route?.params?.orderId ?? null;
  const routeOrderCode = routeOrder?.orderCode ?? routeOrder?.orderId ?? routeOrderId ?? routeOrder?.id ?? null;

  const [order, setOrder] = useState(
    routeOrder
      ? { ...(routeOrder || {}) }
      : {
        orderCode: routeOrderCode ?? '',
        status: 'pending',
      }
  );

  const [details, setDetails] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  const [productTypesMap, setProductTypesMap] = useState({});
  const [serviceMap, setServiceMap] = useState({});
  const [containerMap, setContainerMap] = useState({});
  const [storageMap, setStorageMap] = useState({});
  const [shelfMap, setShelfMap] = useState({});
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [productTypesFull, setProductTypesFull] = useState({});
  const [serviceFull, setServiceFull] = useState({});
  const [containerFull, setContainerFull] = useState({});
  const [storageFull, setStorageFull] = useState({});
  const [shelfFull, setShelfFull] = useState({});

  const [showVerifyEditor, setShowVerifyEditor] = useState(false);

  const isTwoCol = width >= 720;

  const currentIndex = useMemo(() => {
    const k = normalizeKey(order?.status);
    return typeof STEP_INDEX[k] === 'number' ? STEP_INDEX[k] : 0;
  }, [order?.status]);

  const apiBase = useMemo(
    () => ((API_BASE_URL && API_BASE_URL.length) ? API_BASE_URL : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net'),
    []
  );

  const fetchOrderSummary = useCallback(async (orderCode) => {
    if (!orderCode) return null;
    setLoadingSummary(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const url = `${apiBase}/api/Order/${encodeURIComponent(orderCode)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.warn('fetchOrderSummary failed', res.status, json);
        return null;
      }

      const payload = json?.data ?? json;
      if (!payload) return null;
      return payload;
    } catch (err) {
      console.error('fetchOrderSummary error', err);
      return null;
    } finally {
      setLoadingSummary(false);
    }
  }, [apiBase]);

  const fetchOrderDetails = useCallback(async (orderCode) => {
    if (!orderCode) return [];
    setLoadingDetails(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const url = `${apiBase}/api/Order/${encodeURIComponent(orderCode)}/details`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn('fetchOrderDetails failed', res.status, json);
        Alert.alert('Lỗi', json?.message ?? json?.errorMessage ?? `HTTP ${res.status}`);
        return [];
      }

      const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      return arr;
    } catch (err) {
      console.error('fetchOrderDetails error', err);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng. Kiểm tra kết nối.');
      return [];
    } finally {
      setLoadingDetails(false);
    }
  }, [apiBase]);

  const fetchLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const endpoints = {
        storage: `${apiBase}/api/StorageType`,
        shelf: `${apiBase}/api/ShelfType`,
        productType: `${apiBase}/api/ProductType`,
        container: `${apiBase}/api/ContainerType`,
        service: `${apiBase}/api/Service`,
      };

      const [storageRes, shelfRes, productTypeRes, containerRes, serviceRes] = await Promise.all(
        Object.values(endpoints).map(url =>
          fetch(url, { method: 'GET', headers })
            .then(r => r.json().catch(() => null))
            .catch(() => null)
        )
      );

      const storageArr = Array.isArray(storageRes) ? storageRes : (storageRes?.data ?? []);
      const shelfArr = Array.isArray(shelfRes) ? shelfRes : (shelfRes?.data ?? []);
      const productTypeArr = Array.isArray(productTypeRes) ? productTypeRes : (productTypeRes?.data ?? []);
      const containerArr = Array.isArray(containerRes) ? containerRes : (containerRes?.data ?? []);
      const serviceArr = Array.isArray(serviceRes) ? serviceRes : (serviceRes?.data ?? []);

      const sMap = {}; const sFull = {};
      (Array.isArray(storageArr) ? storageArr : []).forEach(item => {
        if (!item) return;
        const id = item.storageTypeId ?? item.id;
        if (id !== undefined) {
          const rawName = item.vname && String(item.vname).trim() !== '' ? item.vname : item.name;
          const displayName = rawName ? (translateStorageName(rawName) ?? rawName) : String(id);
          sMap[id] = displayName;
          sFull[id] = { ...item, displayName };
        }
      });

      const shMap = {}; const shFull = {};
      (Array.isArray(shelfArr) ? shelfArr : []).forEach(item => {
        if (!item) return;
        const id = item.shelfTypeId ?? item.id;
        if (id !== undefined) {
          const rawName = item.vname && String(item.vname).trim() !== '' ? item.vname : item.name;
          const displayName = rawName ? (translateShelfName(rawName) ?? rawName) : String(id);
          shMap[id] = displayName;
          shFull[id] = { ...item, displayName };
        }
      });

      const pMap = {}; const pFull = {};
      (Array.isArray(productTypeArr) ? productTypeArr : []).forEach(item => {
        if (!item) return;
        const id = item.productTypeId ?? item.id;
        if (id !== undefined) {
          const rawName = item.vname && String(item.vname).trim() !== '' ? item.vname : item.name;
          const displayName = rawName ? (translateProductTypeName(rawName) ?? rawName) : String(id);
          pMap[id] = displayName;
          pFull[id] = { ...item, displayName };
        }
      });

      const cMap = {}; const cFull = {};
      (Array.isArray(containerArr) ? containerArr : []).forEach(item => {
        if (!item) return;
        const id = item.containerTypeId ?? item.id;
        if (id !== undefined) {
          const displayName = translateContainerType(item) ?? (item.name ?? String(id));
          cMap[id] = displayName;
          cFull[id] = { ...item, displayName };
        }
      });

      const svcMap = {}; const svcFull = {};
      (Array.isArray(serviceArr) ? serviceArr : []).forEach(item => {
        if (!item) return;
        const id = item.serviceId ?? item.id;
        if (id !== undefined) {
          const rawName = item.vname && String(item.vname).trim() !== '' ? item.vname : item.name;
          const displayName = rawName ? (translateServiceName(rawName) ?? rawName) : String(id);
          svcMap[id] = displayName;
          svcFull[id] = { ...item, displayName };
        }
      });

      setStorageMap(sMap); setStorageFull(sFull);
      setShelfMap(shMap); setShelfFull(shFull);
      setProductTypesMap(pMap); setProductTypesFull(pFull);
      setContainerMap(cMap); setContainerFull(cFull);
      setServiceMap(svcMap); setServiceFull(svcFull);

    } catch (err) {
      console.warn('fetchLookups failed', err);
    } finally {
      setLoadingLookups(false);
    }
  }, [apiBase]);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      const code = routeOrder?.orderCode ?? routeOrderCode ?? routeOrderId ?? routeOrder?.id;
      try {
        if (!code) {
          await fetchLookups();
          return;
        }

        await Promise.all([
          fetchLookups(),
          (async () => {
            const summary = await fetchOrderSummary(code);
            if (!mounted) return;
            if (summary) {
              const summaryObj = Array.isArray(summary) && summary.length > 0 ? summary[0] : summary;
              setOrder((prev) => ({ ...prev, ...summaryObj }));
            } else if (routeOrder) {
              setOrder((prev) => ({ ...prev, ...routeOrder }));
            }

            const det = await fetchOrderDetails(code);
            if (!mounted) return;
            setDetails(det);
          })()
        ]);
      } catch (err) {
        console.warn('loadAll error', err);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [routeOrder, routeOrderId, routeOrderCode, fetchOrderSummary, fetchOrderDetails, fetchLookups]);

  const totalFromDetails = details.reduce((acc, it) => acc + Number(it.subTotal ?? 0), 0);
  const totalPrice = order?.totalPrice && Number(order.totalPrice) > 0 ? Number(order.totalPrice) : totalFromDetails;

  /* ---------- NEW: queue-safe image appender ---------- */
  const uploadQueueRef = useRef({ queue: [], running: false });

 const processUploadQueue = useCallback(async () => {
  const q = uploadQueueRef.current;
  if (q.running) return;
  q.running = true;

  while (q.queue.length > 0) {
    const job = q.queue.shift();
    const { orderCode, imageUrl, resolve, reject } = job;

    try {
      let mergedImages = [];

      // 1. Optimistic update (local state)
      setOrder(prev => {
        const cur = prev || {};
        const curImgs = Array.isArray(cur.image)
          ? cur.image
          : Array.isArray(cur.images)
          ? cur.images
          : [];

        mergedImages = Array.from(new Set([...curImgs, imageUrl]));
        return { ...cur, image: mergedImages };
      });

      // 2. CALL PUT API (đúng theo Swagger)
      const token = await AsyncStorage.getItem('@auth_token');
      const url = `${apiBase}/api/OrderStatus/tracking/update-image`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderCode,
          image: mergedImages,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.warn('update-image failed', res.status, json);
        Alert.alert(
          'Cập nhật ảnh thất bại',
          json?.message ?? json?.errorMessage ?? `HTTP ${res.status}`
        );
        reject && reject(json);
        continue;
      }

      const payload = json?.data ?? json;
      if (payload) {
        setOrder(prev => ({ ...prev, ...payload }));
      }

      resolve && resolve(true);
    } catch (err) {
      console.error('processUploadQueue error', err);
      reject && reject(err);
    }
  }

  q.running = false;
}, [apiBase]);



  const queueUpdateOrderWithImage = useCallback((orderCode, imageUrl) => {
    return new Promise((resolve, reject) => {
      uploadQueueRef.current.queue.push({ orderCode, imageUrl, resolve, reject });
      processUploadQueue().catch(e => {
        console.warn('processUploadQueue top error', e);
      });
    });
  }, [processUploadQueue]);

  /* ---------- end queue logic ---------- */

  const goToNextStep = async () => {
    if (busy) return;

    const code = order?.orderCode ?? routeOrderCode;
    if (!code) {
      Alert.alert('Lỗi', 'Không có orderCode để cập nhật.');
      return;
    }

    setBusy(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const url = `${apiBase}/api/OrderStatus/${encodeURIComponent(code)}/update-status`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: null,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.warn('update-status failed', res.status, json);
        Alert.alert('Lỗi', json?.message ?? json?.errorMessage ?? `HTTP ${res.status}`);
        return;
      }

      try {
        const freshSummary = await fetchOrderSummary(code);
        if (freshSummary) setOrder((prev) => ({ ...prev, ...(Array.isArray(freshSummary) ? freshSummary[0] : freshSummary) }));
        const freshDetails = await fetchOrderDetails(code);
        setDetails(freshDetails);
      } catch (e) {
        console.warn('refresh after update failed', e);
        Alert.alert('Cảnh báo', 'Cập nhật trạng thái thành công nhưng tải lại dữ liệu thất bại.');
      }

      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng.');
    } catch (err) {
      console.error('goToNextStep error', err);
      Alert.alert('Lỗi', 'Cập nhật trạng thái thất bại. Kiểm tra kết nối.');
    } finally {
      setBusy(false);
    }
  };

  const G = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
  const formatDate = (d) => {
    if (!d) return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split('-');
      return `${day}.${m}.${y}`;
    }
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
    return String(d);
  };

  const onPhonePress = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Lỗi', 'Không thể gọi số này.'));
  };

  const lookups = {
    productTypesMap, serviceMap, containerMap, storageMap, shelfMap,
    productTypesFull, serviceFull, containerFull, storageFull, shelfFull
  };

  return (
    <View style={ui.container}>
      {/* HEADER */}
      <View style={ui.header}>
        <TouchableOpacity style={ui.backWrap} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>

        <View style={ui.headerCenter}>
          <Text style={ui.statusText}>{mapStatusToVN(order?.status)}</Text>
          <Text style={ui.orderCodeText}>{G(order?.orderCode ?? order?.id)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 140 }}>
        {/* STEPPER */}
        <Surface style={ui.stepCard}>
          <View style={ui.stepHeaderRow}>
            <Text style={{ fontWeight: '800' }}>Quy trình</Text>
            <Text style={{ color: '#666' }}>{mapStatusToVN(order?.status)}</Text>
          </View>

          <View style={[ui.stepperWrap, { marginTop: 12 }]}>
            <View style={ui.stepperRow}>
              {STEPS.map((s, i) => {
                const state = getStepState(i, currentIndex);
                const iconSize = width < 360 ? 16 : 18;
                const iconBox = width < 360 ? 40 : 44;

                return (
                  <View key={s.key} style={ui.stepFlexItem}>
                    <View style={{ alignItems: 'center', width: '100%' }}>
                      <View style={[
                        ui.stepIcon,
                        { width: iconBox, height: iconBox, borderRadius: Math.round(iconBox / 4) },
                        state === 'done' ? ui.stepDone : state === 'active' ? ui.stepActive : ui.stepPending
                      ]}>
                        <Icon name={s.icon} size={iconSize} color={state === 'pending' ? '#666' : '#fff'} />
                      </View>

                      <Text
                        style={[ui.stepLabel, state === 'active' && { color: '#108a3f', fontWeight: '800' }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {s.label}
                      </Text>
                    </View>

                    {i < STEPS.length - 1 && (
                      <View style={ui.connectorContainer}>
                        <View style={[
                          ui.connectorLine,
                          (i < currentIndex) ? ui.connectorDone : ui.connectorPending
                        ]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </Surface>

        {/* SUMMARY CARD */}
        <Surface style={ui.summaryCard}>
          <View style={{ flexDirection: isTwoCol ? 'row' : 'column', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={ui.cardTitle}>Thông tin đơn hàng</Text>
              <Divider style={{ marginVertical: 10 }} />

              <SummaryRow label="Mã đơn" value={G(order?.orderCode ?? order?.id)} />
              <SummaryRow label="Mã khách" value={G(order?.customerCode)} />
              <SummaryRow label="Khách hàng" value={G(order?.customerName ?? order?.customer?.name)} />
              <SummaryRow label="Địa chỉ lấy" value={G(order?.address ?? order?.pickupAddress ?? order?.customer?.address)} />
              <SummaryRow label="Ghi chú" value={G(order?.note)} />
            </View>

            <View style={{ width: isTwoCol ? 340 : '100%' }}>
              <Text style={ui.cardTitle}>Tóm tắt</Text>
              <Divider style={{ marginVertical: 10 }} />
              <OrderBadge text={mapStatusToVN(order?.status)} color="#108a3f" />

              <View style={{ height: 10 }} />
              <SummaryRow label="Trạng thái thanh toán" value={mapPaymentToVN(order?.paymentStatus)} />
              <SummaryRow label="Tổng" value={`${(totalPrice ?? 0).toLocaleString()} đ`} />
              <SummaryRow label="Còn nợ" value={`${(Number(order?.unpaidAmount ?? 0)).toLocaleString()} đ`} />
              <SummaryRow label="Hình thức" value={mapStyleToVN(order?.style)} />
              <SummaryRow label="Ngày đặt" value={formatDate(order?.orderDate ?? order?.depositDate)} />

              <View style={{ height: 8 }} />
              
              {normalizeKey(order?.status) === 'checkout' && (
          <PaymentWebView
            orderCode={order?.orderCode ?? routeOrderCode}
            apiBase={apiBase}
            onPaid={async () => {
              const code = order?.orderCode ?? routeOrderCode;
              if (!code) return;
              const fresh = await fetchOrderSummary(code);
              if (fresh) setOrder(prev => ({ ...prev, ...(Array.isArray(fresh) ? fresh[0] : fresh) }));
              const freshDet = await fetchOrderDetails(code);
              setDetails(freshDet);
              Alert.alert('Cập nhật', 'Đã làm mới thông tin đơn hàng sau khi thanh toán.');
            }}
            onClose={async () => {
              const code = order?.orderCode ?? routeOrderCode;
              if (!code) return;
              try {
                const fresh = await fetchOrderSummary(code);
                if (fresh) setOrder(prev => ({ ...prev, ...(Array.isArray(fresh) ? fresh[0] : fresh) }));
                const freshDet = await fetchOrderDetails(code);
                setDetails(freshDet);
              } catch (e) {
                console.warn('refresh onClose failed', e);
              }
            }}
          />

        )}
            </View>
          </View>
          
        </Surface>

       
        {/* --- PHOTO UPLOADER (only when pick up OR delivered) --- */}
        {['pick up', 'pickup', 'delivered', 'deliver'].includes(normalizeKey(order?.status)) && (
          <Surface style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fff' }}>
            <Text style={{ fontWeight: '800', marginBottom: 8 }}>Ảnh xác nhận</Text>
            <PhotoUploader
              onUploaded={(url) => {
                // push to queue so uploads are serialized and images are appended
                queueUpdateOrderWithImage(order?.orderCode ?? routeOrderCode, url)
                  .then(() => console.log('queued update done'))
                  .catch(e => {
                    console.warn('queued update failed', e);
                    Alert.alert('Lỗi', 'Không thể cập nhật ảnh lên order.');
                  });
              }}
              onError={(e) => {
                console.warn('upload error', e);
                Alert.alert('Lỗi upload', String(e));
              }}
            />
            <Text style={{ color: '#666', marginTop: 8, fontSize: 12 }}>
              Chụp ảnh chứng từ/giao nhận và nhấn Upload. Ảnh sẽ được lưu vào đơn hàng.
            </Text>
            {/* show previews from order.image if any */}
            {Array.isArray(order?.image) && order.image.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                {order.image.map((u, idx) => (
                  <Image key={idx} source={{ uri: u }} style={{ width: 80, height: 80, borderRadius: 6 }} />
                ))}
              </View>
            )}
          </Surface>
        )}

        {/* DETAILS CARD */}
        <Surface style={ui.summaryCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={ui.cardTitle}>Chi tiết sản phẩm</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#666' }}>{details.length} mục</Text>

              {normalizeKey(order?.status) === 'verify' ? (
                <Button
                  mode={showVerifyEditor ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setShowVerifyEditor((v) => !v)}
                  contentStyle={{ height: 36 }}
                >
                  {showVerifyEditor ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
                </Button>
              ) : null}
            </View>
          </View>

          <Divider style={{ marginVertical: 10 }} />

          {loadingDetails || loadingLookups ? (
            <ActivityIndicator style={{ marginVertical: 12 }} />
          ) : details.length === 0 ? (
            <View style={{ paddingVertical: 18 }}>
              <Text style={{ color: '#888' }}>Không có chi tiết sản phẩm</Text>
            </View>
          ) : (
            details.map((it) => <DetailItem key={it.orderDetailId ?? `${it.containerType}-${it.price}`} it={it} lookups={lookups} />)
          )}
        </Surface>

        {/* VerifyEditor */}
        {normalizeKey(order?.status) === 'verify' && showVerifyEditor && (
          <VerifyEditor
            orderCode={order?.orderCode ?? order?.id}
            initialOrder={order}
            initialDetails={details}
            apiBase={apiBase}
            onCancel={() => {
              setShowVerifyEditor(false);
            }}
            onSaved={({ order: updatedOrder, details: updatedDetails }) => {
              setOrder(prev => ({ ...prev, ...(updatedOrder || {}) }));
              if (Array.isArray(updatedDetails)) setDetails(updatedDetails);
              setShowVerifyEditor(false);
            }}
          />
        )}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={ui.bottomBar}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Button mode="outlined" onPress={() => {
            const phone = order?.pickup?.phone ?? order?.phone;
            if (phone) Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Lỗi', 'Không thể gọi số này.'));
            else Alert.alert('Không có số', 'Không tìm thấy số điện thoại liên hệ.');
          }} contentStyle={{ height: 48 }}>
            Liên hệ
          </Button>
        </View>

        <View style={{ flex: 1 }}>
          <Button mode="contained" onPress={goToNextStep} loading={busy} contentStyle={{ height: 48 }}>
            {STEPS[Math.min(currentIndex + 1, STEPS.length - 1)]?.label ?? 'Tiếp theo'}
          </Button>
        </View>
      </View>
    </View>
  );
}

const ui = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f6' },

  header: {
    height: Platform.OS === 'ios' ? 92 : 72,
    paddingTop: Platform.OS === 'ios' ? 36 : 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backWrap: { width: 40, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'flex-start' },
  headerRight: { width: 120, alignItems: 'flex-end' },

  statusText: { fontSize: 12, color: '#888', marginBottom: 4 },
  orderCodeText: { fontSize: 16, fontWeight: '900' },

  stepCard: { borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 12, elevation: 1 },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  stepperWrap: { justifyContent: 'center' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepFlexItem: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    position: 'relative',
  },
  stepIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#108a3f' },
  stepDone: { backgroundColor: '#0a8bd6' },
  stepPending: { backgroundColor: '#eee' },
  stepLabel: { marginTop: 6, fontSize: 12, color: '#444', textAlign: 'center' },

  connectorContainer: {
    position: 'absolute',
    right: 6,
    top: 22,
    height: 2,
    width: '20%',
    justifyContent: 'center',
  },
  connectorLine: {
    marginTop: 12,
    marginLeft: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#eee',
    width: '100%',
  },
  connectorDone: { backgroundColor: '#0a8bd6' },
  connectorPending: { backgroundColor: '#eee' },

  summaryCard: { marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  cardTitle: { fontWeight: '900', fontSize: 15, marginBottom: 6 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#666' },
  summaryValue: { fontWeight: '800' },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },

  itemCard: { borderRadius: 12, marginBottom: 10, elevation: 1, overflow: 'hidden' },
  itemImage: { width: 70, height: 88, borderRadius: 8, backgroundColor: '#f0f0f0' },
  itemTitle: { fontWeight: '800', fontSize: 15 },
  itemMeta: { color: '#666' },
  itemPrice: { fontWeight: '900' },
  serviceChip: { marginRight: 6, backgroundColor: '#f2f7f2' },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
});
