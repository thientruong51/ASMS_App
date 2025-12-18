import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Text as RNText,
} from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { useFocusEffect, useNavigation } from '@react-navigation/native';


import { HomeHeader } from '../home/components';
import FooterNav from '../../components/FooterNav';

const {
  API_BASE_URL
  
} = Constants.expoConfig.extra;
function b64UrlDecode(input) {
  if (!input) return null;
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  try {
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(s)));
    }
    const decoded = typeof Buffer !== 'undefined' ? Buffer.from(s, 'base64').toString('utf8') : null;
    if (decoded) return decoded;
    return null;
  } catch (e) {
    try {
      const bin = typeof Buffer !== 'undefined' ? Buffer.from(s, 'base64').toString('binary') : '';
      let out = '';
      for (let i = 0; i < bin.length; i++) {
        const c = bin.charCodeAt(i).toString(16).padStart(2, '0');
        out += '%' + c;
      }
      return decodeURIComponent(out);
    } catch (_) {
      return null;
    }
  }
}
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = b64UrlDecode(parts[1]);
    return payload ? JSON.parse(payload) : null;
  } catch (e) {
    return null;
  }
}

function DefaultHeader() {
  return (
    <View style={fallbackStyles.header}>
      <RNText style={fallbackStyles.headerText}>SmartBus</RNText>
    </View>
  );
}
function DefaultFooter({ navigation, active }) {
  return (
    <View style={fallbackStyles.footer}>
      <RNText>FooterNav fallback — implement your FooterNav component or check import.</RNText>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

  const apiBase = API_BASE_URL && API_BASE_URL.length ? API_BASE_URL : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net';

  const getTokenAndFetch = useCallback(async () => {
    const t = await AsyncStorage.getItem('@auth_token');
    setToken(t);
    await fetchProfile(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getTokenAndFetch();
    }, [getTokenAndFetch])
  );

  const extractIdFromToken = (t) => {
    if (!t) return null;
    const payload = decodeJwtPayload(t);
    if (!payload) return null;
    return payload.Id ?? payload.id ?? payload.employeeId ?? payload.EmployeeId ?? payload.sub ?? payload.userId ?? null;
  };

  const fetchProfile = async (tknArg) => {
    const t = tknArg ?? token ?? await AsyncStorage.getItem('@auth_token');
    if (!t) {
      setProfile(null);
      return;
    }
    const id = extractIdFromToken(t);
    if (!id) {
      const payload = decodeJwtPayload(t);
      if (payload) {
        const normalized = {
          employeeCode: payload.EmployeeCode ?? payload.employeeCode,
          name: payload.Name ?? payload.name ?? payload.fullName,
          phone: payload.Phone ?? payload.phone,
          address: payload.Address ?? payload.address,
          username: payload.Username ?? payload.username,
          status: payload.Status ?? payload.status,
          isActive: payload.IsActive === "True" || payload.IsActive === true || payload.IsActive === "true" || payload.IsActive === true,
          employeeRoleId: payload.EmployeeRoleId ?? payload.employeeRoleId,
          id: payload.Id ?? payload.id ?? payload.employeeId ?? payload.sub
        };
        setProfile(normalized);
        return;
      }
      Alert.alert('Lỗi', 'Không xác định được employee id từ token.');
      return;
    }

    setLoading(true);
    try {
      const url = `${apiBase}/api/Employee/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn('GET /api/Employee error', res.status, json);
        const payload = decodeJwtPayload(t);
        if (payload) {
          const normalized = {
            employeeCode: payload.EmployeeCode ?? payload.employeeCode,
            name: payload.Name ?? payload.name ?? payload.fullName,
            phone: payload.Phone ?? payload.phone,
            address: payload.Address ?? payload.address,
            username: payload.Username ?? payload.username,
            status: payload.Status ?? payload.status,
            isActive: payload.IsActive === "True" || payload.IsActive === true || payload.IsActive === "true" || payload.IsActive === true,
            employeeRoleId: payload.EmployeeRoleId ?? payload.employeeRoleId,
            id: payload.Id ?? payload.id ?? payload.employeeId ?? payload.sub
          };
          setProfile(normalized);
          return;
        }
        Alert.alert('Lỗi', json?.message ?? `HTTP ${res.status}`);
        setProfile(null);
        return;
      }
      const emp = json?.data ?? json;
      const final = Array.isArray(emp) && emp.length > 0 ? emp[0] : emp;
      setProfile(final);
    } catch (err) {
      console.error('fetchProfile error', err);
      const payload = decodeJwtPayload(t);
      if (payload) {
        const normalized = {
          employeeCode: payload.EmployeeCode ?? payload.employeeCode,
          name: payload.Name ?? payload.name ?? payload.fullName,
          phone: payload.Phone ?? payload.phone,
          address: payload.Address ?? payload.address,
          username: payload.Username ?? payload.username,
          status: payload.Status ?? payload.status,
          isActive: payload.IsActive === "True" || payload.IsActive === true || payload.IsActive === "true" || payload.IsActive === true,
          employeeRoleId: payload.EmployeeRoleId ?? payload.employeeRoleId,
          id: payload.Id ?? payload.id ?? payload.employeeId ?? payload.sub
        };
        setProfile(normalized);
        return;
      }
      Alert.alert('Lỗi', 'Không thể tải thông tin nhân viên.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = () => {
    navigation.navigate('EditProfileScreen', {
      employeeId: profile?.id ?? profile?.employeeId ?? profile?.Id ?? null,
      initialData: {
        employeeCode: profile?.employeeCode ?? profile?.EmployeeCode ?? '',
        name: profile?.name ?? profile?.Name ?? '',
        phone: profile?.phone ?? profile?.Phone ?? '',
        address: profile?.address ?? profile?.Address ?? '',
        username: profile?.username ?? profile?.Username ?? '',
        status: profile?.status ?? profile?.Status ?? '',
        isActive: typeof profile?.isActive === 'boolean' ? profile.isActive : (profile?.IsActive === "True" || profile?.IsActive === true),
        buildingId: profile?.buildingId ?? profile?.BuildingId ?? 0,
        employeeRoleId: profile?.employeeRoleId ?? profile?.EmployeeRoleId ?? 0,
        imageUrl: profile?.imageUrl ?? profile?.avatar ?? profile?.Avatar ?? ''
      }
    });
  };

  const HeaderComp = typeof HomeHeader === 'function' ? HomeHeader : DefaultHeader;
  const FooterComp = typeof FooterNav === 'function' ? FooterNav : DefaultFooter;

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <HeaderComp />

      <View style={styles.headerArea}>
        <View style={styles.decor1} />
        <View style={styles.decor2} />

        <View style={styles.headerContent}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profile?.imageUrl ?? profile?.avatar ?? `https://res.cloudinary.com/dkfykdjlm/image/upload/v1754997985/ifktveiynvqhzab3oyyk.png` }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editFab} onPress={onEdit}>
              <Text style={styles.editFabText}>✎</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{profile?.name ?? profile?.fullName ?? profile?.username ?? '—'}</Text>

          <View style={styles.phoneBadge}>
            <Text style={styles.phoneText}>{profile?.phone ?? 'Chưa có số'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator />
          ) : profile ? (
            <>
             
              <Divider style={{ marginVertical: 18 }} />

              <Text style={styles.sectionTitle}>Thông tin</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vai trò</Text>
                <Text style={styles.infoValue}>Nhân viên giao hàng</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{profile.phone ?? '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{profile.address ?? '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tài khoản</Text>
                <Text style={styles.infoValue}>{profile.username ?? '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trạng thái</Text>
                <Text style={styles.infoValue}>Hoạt động</Text>
              </View>

              <View style={{ height: 18 }} />

              
            </>
          ) : (
            <>
              <Text style={{ marginBottom: 12 }}>Không có thông tin nhân viên</Text>
              <Button mode="contained" onPress={() => fetchProfile()}>Tải lại</Button>
            </>
          )}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      <View style={styles.footerWrapper}>
        <FooterComp navigation={navigation} active="Account" />
      </View>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 240;
const AVATAR_SIZE = 110;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f6' },
  headerArea: { height: HEADER_HEIGHT, backgroundColor: 'transparent' },
  decor1: { position: 'absolute', top: 0, left: -20, width: 220, height: HEADER_HEIGHT, backgroundColor: '#2ecc71', borderRadius: 200, opacity: 0.12, transform: [{ scaleX: 1.2 }] },
  decor2: { position: 'absolute', top: 20, right: -40, width: 160, height: 140, backgroundColor: '#27ae60', borderRadius: 100, opacity: 0.08 },
  headerContent: { flex: 1, paddingTop: 12, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: 'hidden' },
  avatarWrapper: { width: AVATAR_SIZE + 10, height: AVATAR_SIZE + 10, borderRadius: (AVATAR_SIZE + 10) / 2, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 6 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 20, borderWidth: 4, borderColor: '#ffffff', backgroundColor: '#f0f0f0' },
  editFab: { position: 'absolute', right: -6, bottom: -6, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  editFabText: { fontSize: 16, color: '#27ae60', fontWeight: '700' },
  username: { marginTop: 10, fontWeight: '800', fontSize: 18, color: '#063f10' },
  phoneBadge: { marginTop: 8, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, elevation: 2 },
  phoneText: { fontWeight: '700', color: '#2b7a3a' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 20 },
  card: { marginTop: 10, borderRadius: 18, backgroundColor: '#fff', padding: 18, elevation: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  sectionSub: { color: '#666', fontSize: 13, marginBottom: 8 },
  journeyRow: { backgroundColor: '#f7f9f7', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0, alignItems: 'center' },
  infoLabel: { color: '#666' },
  infoValue: { fontWeight: '800' },
  footerWrapper: { position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 0 : 0, backgroundColor: 'transparent' },
});

const fallbackStyles = StyleSheet.create({
  header: { height: 56, backgroundColor: '#2ecc71', alignItems: 'center', justifyContent: 'center' },
  headerText: { color: '#fff', fontWeight: '800' },
  footer: { height: 64, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderTopWidth: 0.5, borderColor: '#eee' },
});
