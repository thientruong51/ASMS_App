import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text as RNText,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

import HomeHeader from '../home/components/HomeHeader';
import FooterNav from '../../components/FooterNav';
import ProcessingCard from '../home/components/ProcessingCard';

function normalizeStatus(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw).toLowerCase().replace(/\s+/g, ' ').trim();
}

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
    null
  );
};

const buildApiBase = () =>
  (API_BASE_URL && API_BASE_URL.length)
    ? API_BASE_URL
    : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net';

const mapOrderToCard = (o) => ({
  orderCode: o.orderCode ?? o.OrderCode ?? o.orderRef ?? o.ref ?? '',
  ref: o.orderCode ?? o.OrderCode ?? o.orderRef ?? o.ref ?? '',
  distance: o.distance ?? '',
  plate: o.plate ?? '',
  type: o.style ?? o.orderType ?? '',
  pickup: {
    date: o.depositDate ?? o.orderDate ?? o.pickupDate ?? o.pickup?.date ?? '',
    customerName: o.customerName ?? o.pickup?.customerName ?? '',
    address: o.pickupAddress ?? o.pickup?.address ?? o.address ?? '',
    contact: o.pickupContact ?? o.pickup?.contact ?? o.phoneContact ?? o.customerContact ?? '',
  },
  delivery: {
    date: o.returnDate ?? o.deliveryDate ?? o.delivery?.date ?? '',
    address: o.deliveryAddress ?? o.delivery?.address ?? o.address ?? '',
    contact: o.deliveryContact ?? o.delivery?.contact ?? o.deliveryPhone ?? '',
  },
  note: o.note ?? o.raw?.note ?? `Status: ${o.status ?? ''} • Payment: ${o.paymentStatus ?? ''}`,
  totalPrice: o.totalPrice ?? o.TotalPrice ?? 0,
  unpaidAmount: o.unpaidAmount ?? o.UnpaidAmount ?? 0,
  status: o.status ?? o.raw?.status ?? o.Status ?? '',
  paymentStatus: o.paymentStatus ?? o.raw?.paymentStatus ?? '',
  style: o.style ?? '',
  raw: o,
});

/* Helpers to group by day and format */
const dayKey = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) {
    // try parsing YYYY-MM-DD
    const parts = String(d).split('-');
    if (parts.length === 3) {
      const t = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(t.getTime())) return t.toISOString().slice(0, 10);
    }
    return String(d || '').slice(0, 10);
  }
  return dt.toISOString().slice(0, 10);
};

const prettyDayLabel = (isoDay) => {
  if (!isoDay) return isoDay;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  if (isoDay === todayKey) return 'Hôm nay';
  if (isoDay === yKey) return 'Hôm qua';
  const d = new Date(isoDay);
  if (isNaN(d.getTime())) return isoDay;
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  return d.toLocaleDateString('vi-VN', options);
};

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          // ignore
        }
      }
      if (!employeeCode) {
        const emp = await AsyncStorage.getItem('@employeeCode');
        if (emp) employeeCode = emp;
      }

      if (!employeeCode) {
        Alert.alert('Lỗi', 'Không tìm thấy mã nhân viên. Vui lòng đăng nhập lại.');
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
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
        Alert.alert('Lấy đơn thất bại', msg.toString());
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const rawList = Array.isArray(json) ? json : json?.data ?? json?.result ?? [];
      if (!Array.isArray(rawList)) {
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Map to normalized card objects
      const mapped = rawList.map(mapOrderToCard);

      // Sort by pickup date desc (fallback to delivery date or current)
      mapped.sort((a, b) => {
        const da = new Date(a.pickup?.date || a.delivery?.date || a.raw?.createAt || a.raw?.createdAt || null).getTime() || 0;
        const db = new Date(b.pickup?.date || b.delivery?.date || b.raw?.createAt || b.raw?.createdAt || null).getTime() || 0;
        return db - da;
      });

      setOrders(mapped);
    } catch (e) {
      console.error('fetchOrders error', e);
      Alert.alert('Lỗi', 'Không thể tải đơn hàng. Kiểm tra kết nối.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  /* group orders by day key */
  const grouped = useMemo(() => {
    const g = new Map();
    for (const o of orders) {
      // determine date to group: try raw createAt, then pickup.date, then delivery.date, else use today's iso
      const rawDate = o.raw?.createAt ?? o.raw?.createdAt ?? o.pickup?.date ?? o.delivery?.date ?? new Date().toISOString();
      const key = dayKey(rawDate);
      if (!g.has(key)) g.set(key, []);
      g.get(key).push(o);
    }
    // convert Map -> array of {day, items} sorted by day desc
    return Array.from(g.entries())
      .map(([day, items]) => ({ day, items }))
      .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  }, [orders]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        <View style={styles.container}>
          <View style={styles.headerBlock}>
            <View style={styles.dot} />
            <Text style={styles.headerTitle}>Thông báo mới</Text>
            <View style={{ height: 8 }} />
            <Text style={styles.subText}>Các cập nhật liên quan tới đơn hàng của bạn</Text>
          </View>

          <View style={styles.notificationsArea}>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={{ color: '#888' }}>Không có thông báo</Text>
              </View>
            ) : (
              grouped.map((grp) => (
                <View key={grp.day} style={styles.dayBlock}>
                  <Text style={styles.dayLabel}>{prettyDayLabel(grp.day)}</Text>
                  <View style={styles.dayCardList}>
                    {grp.items.map((it, idx) => (
                      <View key={it.orderCode ?? it.ref ?? idx} style={styles.notifCardWrap}>
                        <ProcessingCard
                          item={it}
                          onStart={() => {
                            Alert.alert('Start', `Start transport: ${it.ref}`);
                          }}
                          onInfo={() => navigation.navigate('OrderDetail', { orderId: it.orderCode ?? it.ref, order: it.raw ?? it })}
                          onConfig={() => Alert.alert('Cấu hình', `Cấu hình cho ${it.ref}`)}
                          onPress={() => navigation.navigate('OrderDetail', { orderId: it.orderCode ?? it.ref, order: it.raw ?? it })}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))
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
  content: { paddingBottom: 120 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  headerBlock: {
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2ecc71',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  subText: { color: '#777', fontSize: 13 },

  notificationsArea: {
    marginTop: 8,
  },

  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
  },

  dayBlock: {
    marginTop: 14,
  },
  dayLabel: {
    textAlign: 'center',
    color: '#aaa',
    marginBottom: 8,
    fontSize: 12,
  },
  dayCardList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },

  notifCardWrap: {
    marginBottom: 10,
  },
});
