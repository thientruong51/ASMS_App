import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

import {
  HomeHeader,
  KPIBoxes,
  StatRow,
  ProcessingCard,
  ContainerCard,
  FooterNav,
} from './components';

export default function HomeScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [processingOrders, setProcessingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statsPeriod, setStatsPeriod] = useState('week');
  const [trackingStats, setTrackingStats] = useState({ chogiao: 0, danggiao: 0, dagiao: 0 });

  const logoUrl =
    'https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png';

  const MAX_SECTION_HEIGHT = 420;

  const ALLOWED_STATUSES_RAW = ['pending', 'wait pick up', 'verify', 'checkout', 'pick up'];
  const normalizeStatus = (raw) => (raw === null || raw === undefined ? '' : String(raw).toLowerCase().replace(/\s+/g, ' ').trim());

  const {
    allowed: allowedStatusSet,
    planned: plannedStatusSet,
    processing: processingStatusSet,
    stats_chogiao,
    stats_danggiao,
    stats_dagiao
  } = React.useMemo(() => {
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

  const getWeekRange = (refDate = new Date()) => {
    const d = new Date(refDate);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const getMonthRange = (refDate = new Date()) => {
    const d = new Date(refDate);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const fetchTrackingStats = useCallback(async (employeeCode, period = 'week') => {
    if (!employeeCode) return;
    try {
      const base = buildApiBase();
      const url = `${base}/api/TrackingHistory?pageNumber=1&pageSize=1000&currentAssign=${encodeURIComponent(employeeCode)}`;
      const token = await AsyncStorage.getItem('@auth_token');

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
        console.warn('fetchTrackingStats failed', msg);
        return;
      }

      const rawList = Array.isArray(json) ? json : json?.data ?? json?.result ?? [];
      if (!Array.isArray(rawList)) return;

      const now = new Date();
      const range = period === 'month' ? getMonthRange(now) : getWeekRange(now);

      const inRange = rawList.filter((t) => {
        if (!t.createAt) return false;
        const d = new Date(t.createAt);
        if (isNaN(d.getTime())) {
          const parts = String(t.createAt).split('-');
          if (parts.length === 3) {
            const dd = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return dd >= range.start && dd <= range.end;
          }
          return false;
        }
        return d >= range.start && d <= range.end;
      });

      const latestByOrder = new Map();
      for (const t of inRange) {
        const oc = t.orderCode ?? t.orderId ?? t.orderRef ?? null;
        if (!oc) continue;
        const date = new Date(t.createAt);
        const prev = latestByOrder.get(oc);
        if (!prev) latestByOrder.set(oc, { entry: t, date });
        else {
          const prevDate = prev.date;
          if (isNaN(prevDate.getTime()) || isNaN(date.getTime()) || date > prevDate) {
            latestByOrder.set(oc, { entry: t, date });
          }
        }
      }

      let c_chogiao = 0, c_danggiao = 0, c_dagiao = 0;
      for (const { entry } of latestByOrder.values()) {
        const s = normalizeStatus(entry.newStatus ?? entry.newstatus ?? entry.oldStatus ?? '');
        if (!s) continue;
        if (stats_chogiao.has(s) || stats_chogiao.has(s.replace(/\s+/g, ''))) c_chogiao++;
        else if (stats_dagiao.has(s) || stats_dagiao.has(s.replace(/\s+/g, ''))) c_dagiao++;
        else c_danggiao++;
      }

      setTrackingStats({ chogiao: c_chogiao, danggiao: c_danggiao, dagiao: c_dagiao });
    } catch (e) {
      console.error('fetchTrackingStats error', e);
    }
  }, [stats_chogiao, stats_danggiao, stats_dagiao]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const userRaw = await AsyncStorage.getItem('@user');

      let employeeCode = null;
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw);
          employeeCode = extractEmployeeCode(userObj);
        } catch (e) {
          console.warn('Invalid @user JSON', e);
        }
      }

      if (!employeeCode) {
        const emp = await AsyncStorage.getItem('@employeeCode');
        if (emp) employeeCode = emp;
      }

      if (!employeeCode) {
        Alert.alert('Lỗi', 'Không tìm thấy mã nhân viên. Vui lòng đăng nhập lại.');
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setLoading(false);
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
        console.warn('fetchOrders failed', msg);
        Alert.alert('Lấy đơn thất bại', msg);
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setLoading(false);
        return;
      }

      const rawList = Array.isArray(json) ? json : json?.data ?? json?.result ?? [];
      if (!Array.isArray(rawList)) {
        setOrders([]); setPlannedOrders([]); setProcessingOrders([]); setLoading(false);
        return;
      }

      const mappedAll = rawList.map(mapOrderToCard).filter((o) => isAllowedStatus(o.status ?? o.raw?.status ?? o.raw?.Status));

      const planned = [];
      const processing = [];

      for (const o of mappedAll) {
        const candidate = o.status ?? o.raw?.status ?? o.raw?.Status ?? '';
        if (isPlannedStatus(candidate)) planned.push(o);
        else if (isProcessingStatus(candidate)) processing.push(o);
      }

      setOrders(mappedAll);
      setPlannedOrders(planned);
      setProcessingOrders(processing);

      await fetchTrackingStats(employeeCode, statsPeriod);
    } catch (e) {
      console.error('fetchOrders error', e);
      Alert.alert('Lỗi', 'Không thể tải đơn hàng. Kiểm tra kết nối.');
      setOrders([]); setPlannedOrders([]); setProcessingOrders([]); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchTrackingStats, statsPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const kpiItems = [
    { value: count_chogiao, label: 'Chờ giao', color: '#f4a300' },
    { value: count_danggiao, label: 'Đang giao', color: '#0aa' },
    { value: count_dagiao, label: 'Đã giao', color: '#0a0' },
  ];

  const onStartTransport = (item) => {
    Alert.alert('Start', `Start transport: ${item.ref}`);
  };

  const onInfo = (item) => {
    Alert.alert('Chi tiết đơn', JSON.stringify(item.raw ?? item, null, 2));
  };

  const onConfig = (item) => {
    Alert.alert('Cấu hình', `Config ${item.ref}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HomeHeader logo={logoUrl} brand="ASMS" />

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <KPIBoxes items={kpiItems} />
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thống kê theo</Text>
            <Text onPress={() => {
              const next = statsPeriod === 'week' ? 'month' : 'week';
              setStatsPeriod(next);
              (async () => {
                const userRaw = await AsyncStorage.getItem('@user');
                let emp = null;
                if (userRaw) {
                  try { emp = extractEmployeeCode(JSON.parse(userRaw)); } catch (_) {}
                }
                if (!emp) {
                  const emp2 = await AsyncStorage.getItem('@employeeCode');
                  if (emp2) emp = emp2;
                }
                if (emp) fetchTrackingStats(emp, next);
              })();
            }}>{statsPeriod === 'week' ? 'Tuần này ▾' : 'Tháng này ▾'}</Text>
          </View>

          <StatRow iconUri={'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999451/27483185-f093-414f-9b64-ba6bb1d8dbe4.png'} iconBg="#fff2d9" title="Chờ giao" value={{ text: String(count_chogiao), color: '#f4a300' }} />
          <StatRow iconUri={'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999485/2a6d7fbb-23eb-4495-9b41-44a7153881be.png'} iconBg="#e8f8ff" title="Đang giao" value={{ text: String(count_danggiao), color: '#0aa' }} />
          <StatRow iconUri={'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999506/34ac5bcb-6099-4760-a9f8-81b31dc44218.png'} iconBg="#eafbe9" title="Đã giao" value={{ text: String(count_dagiao), color: '#0a0' }} />

          {/* Processing block: horizontal scroll */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đang vận chuyển</Text>
            </View>

            {loading ? (
              <ActivityIndicator style={{ paddingVertical: 12 }} />
            ) : (
              <View style={[styles.innerHorizontalWrap, { maxHeight: MAX_SECTION_HEIGHT }]}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
                  {processingOrders.length === 0 ? (
                    <View style={{ paddingHorizontal: 16 }}>
                      <Text style={{ color: '#888', marginVertical: 8 }}>Không có đơn đang vận chuyển</Text>
                    </View>
                  ) : (
                    processingOrders.map((it, idx) => (
                      <View key={it.orderCode ?? it.ref ?? idx} style={styles.cardWrapper}>
                        <ProcessingCard
                          item={it}
                          onStart={() => onStartTransport(it)}
                          onInfo={() => onInfo(it)}
                          onConfig={() => onConfig(it)}
                          onPress={() => navigation.navigate('OrderDetail', { orderId: it.orderCode ?? it.ref, order: it.raw ?? it })}
                        />
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Planned block: horizontal scroll */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dự kiến vận chuyển</Text>
            </View>

            {loading ? (
              <ActivityIndicator style={{ paddingVertical: 12 }} />
            ) : (
              <View style={[styles.innerHorizontalWrap, { maxHeight: MAX_SECTION_HEIGHT }]}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
                  {plannedOrders.length === 0 ? (
                    <View style={{ paddingHorizontal: 16 }}>
                      <Text style={{ color: '#888', marginVertical: 8 }}>Không có đơn dự kiến</Text>
                    </View>
                  ) : (
                    plannedOrders.map((it, idx) => (
                      <View key={it.orderCode ?? it.ref ?? idx} style={styles.cardWrapper}>
                        <ContainerCard
                          item={it}
                          onInfo={() => onInfo(it)}
                          onConfig={() => onConfig(it)}
                          onPress={() => navigation.navigate('OrderDetail', { orderId: it.orderCode ?? it.ref, order: it.raw ?? it })}
                        />
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <FooterNav navigation={navigation} active="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f5f2' },
  content: { paddingBottom: 170 },

  body: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  innerHorizontalWrap: {
    // wrapper for horizontal scroll area
    overflow: 'hidden',
  },

  horizontalContent: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },

  // wrapper around each card in horizontal list — controls spacing + width
  cardWrapper: {
    marginRight: 12,
    width: 350, // you can tweak width to control card size on screen
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    marginBottom: 14,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#108a3f' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabText: { color: '#444', fontWeight: '700' },
  tabDate: { color: '#aaa', fontSize: 11 },
});
