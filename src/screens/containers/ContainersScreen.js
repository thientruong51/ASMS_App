import  { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView as RNScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl, 
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

import HomeHeader from '../home/components/HomeHeader';
import FooterNav from '../../components/FooterNav';
import ContainerCard from './components/ContainerCard';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const ALLOWED_STATUSES_RAW = ['pending', 'wait pick up', 'verify', 'checkout', 'pick up'];
const normalizeStatus = (raw) =>
  raw === null || raw === undefined ? '' : String(raw).toLowerCase().replace(/\s+/g, ' ').trim();

export default function ContainersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([]); 
  const [plannedOrders, setPlannedOrders] = useState([]); 
  const [processingOrders, setProcessingOrders] = useState([]); 
  const [trackingStats, setTrackingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false); 

  const [activeTab, setActiveTab] = useState('waiting');
  const scrollRef = useRef(null);
  const chipLayouts = useRef({});

  const { allowed: allowedStatusSet, planned: plannedStatusSet, processing: processingStatusSet, stats_chogiao, stats_danggiao, stats_dagiao } =
    useMemo(() => {
      const allowed = new Set();
      const planned = new Set();
      const processing = new Set();
      const stats_chogiao = new Set();
      const stats_danggiao = new Set();
      const stats_dagiao = new Set();

      for (const s of ALLOWED_STATUSES_RAW) {
        const n = normalizeStatus(s);
        allowed.add(n);
        allowed.add(n.replace(/\s+/g, ''));
        if (n === 'pending' || n === 'wait pick up') {
          planned.add(n); planned.add(n.replace(/\s+/g, ''));
          stats_chogiao.add(n); stats_chogiao.add(n.replace(/\s+/g, ''));
        } else if (n === 'pick up') {
          processing.add(n); processing.add(n.replace(/\s+/g, ''));
          stats_dagiao.add(n); stats_dagiao.add(n.replace(/\s+/g, ''));
        } else {
          processing.add(n); processing.add(n.replace(/\s+/g, ''));
          stats_danggiao.add(n); stats_danggiao.add(n.replace(/\s+/g, ''));
        }
      }
      return { allowed, planned, processing, stats_chogiao, stats_danggiao, stats_dagiao };
    }, []);

  const extractEmployeeCode = (user) => {
    if (!user) return null;
    return (
      user.EmployeeCode ||
      user.employeeCode ||
      user.Username ||
      user.UserName ||
      user.username ||
      user.Id ||
      user.id ||
      user.EmployeeCodeId ||
      user.EmployeeRoleId ||
      null
    );
  };

  const buildApiBase = () =>
    (API_BASE_URL && API_BASE_URL.length)
      ? API_BASE_URL
      : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net';

  const mapOrderToCard = (o) => ({
    orderCode: o.orderCode ?? o.OrderCode ?? o.orderRef ?? '',
    ref: o.orderCode ?? o.OrderCode ?? o.orderRef ?? '',
    distance: o.distance ?? '',
    plate: o.plate ?? '',
    type: o.style ?? o.orderType ?? '',
    pickup: {
      date: o.depositDate ?? o.orderDate ?? o.pickupDate ?? '',
      customerName: o.customerName ?? '',
      address: o.pickupAddress ?? o.address ?? '',
      contact: o.pickupContact ?? o.phoneContact ?? o.customerContact ?? '',
    },
    delivery: {
      date: o.returnDate ?? o.deliveryDate ?? '',
      address: o.deliveryAddress ?? o.address ?? '',
      contact: o.deliveryContact ?? o.deliveryPhone ?? '',
    },
    note: o.note ?? `Status: ${o.status ?? ''} • Payment: ${o.paymentStatus ?? ''}`,
    totalPrice: o.totalPrice ?? o.TotalPrice ?? 0,
    unpaidAmount: o.unpaidAmount ?? o.UnpaidAmount ?? 0,
    status: o.status ?? '',
    paymentStatus: o.paymentStatus ?? '',
    style: o.style ?? '',
    raw: o,
    id: o.id ?? o.Id ?? o.orderId ?? o.orderCode ?? Math.random().toString(36).slice(2),
  });

  const isAllowedStatus = (rawStatus) => {
    if (!rawStatus && rawStatus !== 0) return false;
    const n = normalizeStatus(rawStatus);
    return allowedStatusSet.has(n) || allowedStatusSet.has(n.replace(/\s+/g, ''));
  };

  const isPlannedStatus = (rawStatus) => {
    if (!rawStatus && rawStatus !== 0) return false;
    const n = normalizeStatus(rawStatus);
    return plannedStatusSet.has(n) || plannedStatusSet.has(n.replace(/\s+/g, ''));
  };

  const isProcessingStatus = (rawStatus) => {
    if (!rawStatus && rawStatus !== 0) return false;
    const n = normalizeStatus(rawStatus);
    return processingStatusSet.has(n) || processingStatusSet.has(n.replace(/\s+/g, ''));
  };


  const loadFromParamsOrFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = route?.params ?? {};

      if (Array.isArray(params.mappedOrders)) {
        const mappedAll = params.mappedOrders.filter((o) => isAllowedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        const planned = mappedAll.filter((o) => isPlannedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        const processing = mappedAll.filter((o) => isProcessingStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        setOrders(mappedAll); setPlannedOrders(planned); setProcessingOrders(processing);
        setTrackingStats(params.trackingStats ?? null);
        return;
      }

      if (Array.isArray(params.rawOrders)) {
        const mappedAll = params.rawOrders.map(mapOrderToCard).filter((o) => isAllowedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        const planned = mappedAll.filter((o) => isPlannedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        const processing = mappedAll.filter((o) => isProcessingStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
        setOrders(mappedAll); setPlannedOrders(planned); setProcessingOrders(processing);
        setTrackingStats(params.trackingStats ?? null);
        return;
      }

      const token = await AsyncStorage.getItem('@auth_token');

      let employeeCode = null;
      const userRaw = await AsyncStorage.getItem('@user');
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw);
          employeeCode = extractEmployeeCode(userObj);
        } catch (e) {
          // ignore
        }
      }
      if (!employeeCode) {
        const emp = await AsyncStorage.getItem('@employeeCode');
        if (emp) employeeCode = emp;
      }

      if (!employeeCode) {
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]);
        setTrackingStats(null);
        setLoading(false);
        return;
      }

      const base = buildApiBase();
      const url = `${base}/api/Order/employee/${encodeURIComponent(employeeCode)}/active-orders`;

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
        const msg = (json && (json.message || json.errorMessage || JSON.stringify(json))) || `HTTP ${res.status}`;
        console.warn('ContainersScreen: fetch orders failed', msg);
        Alert.alert('Lấy đơn thất bại', msg);
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setTrackingStats(null);
        return;
      }

      const rawList = Array.isArray(json) ? json : json?.data ?? json?.result ?? [];
      if (!Array.isArray(rawList)) {
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setTrackingStats(null);
        return;
      }

      const mappedAll = rawList.map(mapOrderToCard).filter((o) => isAllowedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));
      const planned = []; const processing = [];
      for (const o of mappedAll) {
        const candidate = o.status ?? o.raw?.status ?? o.raw?.Status ?? '';
        if (isPlannedStatus(candidate)) planned.push(o);
        else if (isProcessingStatus(candidate)) processing.push(o);
      }

      setOrders(mappedAll);
      setPlannedOrders(planned);
      setProcessingOrders(processing);

      setTrackingStats(null);
    } catch (e) {
      console.error('ContainersScreen load error', e);
      setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setTrackingStats(null);
    } finally {
      setLoading(false);
    }
  }, [route]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFromParamsOrFetch();
    } finally {
      setRefreshing(false);
    }
  }, [loadFromParamsOrFetch]);

  useFocusEffect(
    useCallback(() => {
      loadFromParamsOrFetch();
    }, [loadFromParamsOrFetch])
  );

  useEffect(() => {
    loadFromParamsOrFetch();
  }, [loadFromParamsOrFetch]);

  const fallback_count_chogiao = orders.filter(o => {
    const n = normalizeStatus(o.status ?? o.raw?.status ?? '');
    return stats_chogiao.has(n) || stats_chogiao.has(n.replace(/\s+/g, ''));
  }).length;

  const fallback_count_danggiao = orders.filter(o => {
    const n = normalizeStatus(o.status ?? o.raw?.status ?? '');
    return stats_danggiao.has(n) || stats_danggiao.has(n.replace(/\s+/g, ''));
  }).length;

  const fallback_count_dagiao = orders.filter(o => {
    const n = normalizeStatus(o.status ?? o.raw?.status ?? '');
    return stats_dagiao.has(n) || stats_dagiao.has(n.replace(/\s+/g, ''));
  }).length;

  const count_chogiao = (trackingStats && typeof trackingStats.chogiao === 'number') ? trackingStats.chogiao : fallback_count_chogiao;
  const count_danggiao = (trackingStats && typeof trackingStats.danggiao === 'number') ? trackingStats.danggiao : fallback_count_danggiao;
  const count_dagiao = (trackingStats && typeof trackingStats.dagiao === 'number') ? trackingStats.dagiao : fallback_count_dagiao;

  const tabList = [
    { key: 'waiting', label: 'Chờ vận chuyển', count: count_chogiao },
    { key: 'delivering', label: 'Đang vận chuyển', count: count_danggiao },
  ];

  const centerChip = (key) => {
    const layout = chipLayouts.current[key];
    if (!layout || !scrollRef.current) return;

    const { x, width } = layout;
    const visible = WINDOW_WIDTH - 28 - 24;
    const target = Math.max(0, x + width / 2 - visible / 2);

    scrollRef.current.scrollTo({ x: target, y: 0, animated: true });
  };

  const onPressTab = (key) => {
    setActiveTab(key);
    setTimeout(() => centerChip(key), 80);
  };

  const filtered = useMemo(() => {
    if (activeTab === 'waiting') return plannedOrders;
    if (activeTab === 'delivering') return processingOrders;
    return orders;
  }, [activeTab, orders, plannedOrders, processingOrders]);

  const handleStart = (item) => {
    Alert.alert('Start', `Start transport: ${item.ref ?? item.orderCode ?? item.id}`);
  };
  const handleInfo = (item) => {
    Alert.alert('Chi tiết đơn', JSON.stringify(item.raw ?? item, null, 2));
  };
  const handleConfig = (item) => {
    Alert.alert('Cấu hình', `Config ${item.ref ?? item.orderCode ?? item.id}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <RNScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollArea}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <HomeHeader
          logo="https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png"
          brand="ASMS"
        />

        {/* TAB */}
        <View style={styles.tabContainer}>
          <View style={styles.tabInnerWrapper}>
            <RNScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {tabList.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.85}
                  style={[styles.chip, activeTab === t.key && styles.chipActive]}
                  onPress={() => onPressTab(t.key)}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    chipLayouts.current[t.key] = { x, width };
                  }}
                >
                  <Text style={[styles.chipText, activeTab === t.key && styles.chipTextActive]}>
                    {t.label}
                  </Text>

                  <View style={[styles.chipBadge, activeTab === t.key && styles.chipBadgeActive]}>
                    <Text style={styles.chipBadgeText}>
                      {String(t.count ?? 0).padStart(2, '0')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </RNScrollView>
          </View>
        </View>

        {/* LIST */}
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator style={{ paddingVertical: 20 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.orderCode ?? item.ref ?? item.id ?? Math.random())}
              renderItem={({ item }) => (
                <View style={{ marginBottom: 14 }}>
                  <ContainerCard
                    item={item}
                    onInfo={() => handleInfo(item)}
                    onConfig={() => handleConfig(item)}
                    onStart={() => handleStart(item)}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderCode ?? item.ref ?? item.id, order: item.raw ?? item })}
                  />
                </View>
              )}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={{ color: '#888', paddingVertical: 12 }}>Không có đơn hàng</Text>}
            />
          )}
        </View>
      </RNScrollView>

      <FooterNav navigation={navigation} active="Containers" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f5f2' },
  scrollArea: { paddingBottom: 120 },

  tabContainer: {
    backgroundColor: '#fff',
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22
  },

  tabInnerWrapper: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: -8,
    paddingVertical: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },

  tabScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  chipActive: {
    backgroundColor: '#e6f7ec',
    borderColor: '#dff3e6'
  },

  chipText: {
    fontWeight: '700',
    color: '#6b6b6b',
    fontSize: 13
  },
  chipTextActive: {
    color: '#108a3f'
  },

  chipBadge: {
    marginLeft: 8,
    backgroundColor: '#ff6b6b',
    height: 22,
    minWidth: 22,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  chipBadgeActive: {
    backgroundColor: '#ff6b6b'
  },
  chipBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  body: { paddingHorizontal: 16, paddingTop: 12 }
});
