import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Surface,
  Text,
  Switch,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';

/* =======================
   Helpers (GIỮ NGUYÊN)
======================= */
function safeNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/* =======================
   Screen
======================= */
export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initialData = route.params?.initialData ?? {};
  const employeeIdParam = route.params?.employeeId ?? null;

  const apiBase =
    API_BASE_URL && API_BASE_URL.length
      ? API_BASE_URL
      : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net';

  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState(null);

  const defaultState = useMemo(
    () => ({
      employeeCode: initialData.employeeCode ?? '',
      name: initialData.name ?? '',
      phone: initialData.phone ?? '',
      address: initialData.address ?? '',
      username: initialData.username ?? '',
      status: initialData.status ?? '',
      isActive:
        typeof initialData.isActive === 'boolean'
          ? initialData.isActive
          : initialData.IsActive === true ||
          initialData.IsActive === 'True',
      buildingId: initialData.buildingId ?? 0,
      employeeRoleId:
        initialData.employeeRoleId ??
        initialData.EmployeeRoleId ??
        0,
      imageUrl:

        'https://res.cloudinary.com/dkfykdjlm/image/upload/v1754997985/ifktveiynvqhzab3oyyk.png',
    }),
    [initialData]
  );

  const [form, setForm] = useState(defaultState);
  useEffect(() => setForm(defaultState), [defaultState]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('@auth_token');
      setToken(t);
    })();
  }, []);

  const onChange = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.name || form.name.trim().length < 2) {
      Alert.alert('Lỗi', 'Tên không hợp lệ');
      return false;
    }
    if (!form.username || form.username.trim().length < 3) {
      Alert.alert('Lỗi', 'Username không hợp lệ');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const id = employeeIdParam;
    if (!id) {
      Alert.alert('Lỗi', 'Không xác định được employee id');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        Id: Number(id),
        id: Number(id),
        EmployeeCode: form.employeeCode || null,
        employeeCode: form.employeeCode || null,
        EmployeeRoleId: safeNum(form.employeeRoleId),
        employeeRoleId: safeNum(form.employeeRoleId),
        Name: form.name,
        name: form.name,
        BuildingId: safeNum(form.buildingId),
        buildingId: safeNum(form.buildingId),
        Phone: form.phone || null,
        phone: form.phone || null,
        Address: form.address || null,
        address: form.address || null,
        Username: form.username || null,
        username: form.username || null,
        Status: form.status || null,
        status: form.status || null,
        IsActive: !!form.isActive,
        isActive: !!form.isActive,
        ImageUrl: form.imageUrl,
        imageUrl: form.imageUrl,
      };

      const tokenHeader =
        token ?? (await AsyncStorage.getItem('@auth_token'));

      const url = `${apiBase}/api/Employee/${encodeURIComponent(
        id
      )}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(tokenHeader
            ? { Authorization: `Bearer ${tokenHeader}` }
            : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        Alert.alert(
          'Lỗi',
          `Cập nhật thất bại (${res.status})\n${txt}`
        );
        return;
      }

      Alert.alert('Thành công', 'Đã cập nhật hồ sơ', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const onPickAvatar = () => {
    Alert.alert(
      'Avatar'

    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <Text style={styles.headerSub}>
            Cập nhật thông tin của bạn
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={onPickAvatar}>
            <Image
              source={{ uri: form.imageUrl }}
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <Text style={{ color: '#fff', fontSize: 12 }}>✎</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <Surface style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin</Text>

          <TextInput
            label="Username"
            value={form.username}
            onChangeText={(t) => onChange('username', t)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Họ và tên"
            value={form.name}
            onChangeText={(t) => onChange('name', t)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Số điện thoại"
            value={form.phone}
            onChangeText={(t) => onChange('phone', t)}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Địa chỉ"
            value={form.address}
            onChangeText={(t) => onChange('address', t)}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Kích hoạt tài khoản
            </Text>
            <Switch
              value={!!form.isActive}
              onValueChange={(v) => onChange('isActive', v)}
              color="#2ecc71"     
            />
          </View>

          <Text style={styles.sectionTitle}>Hệ thống</Text>

          <View style={styles.row}>
            <TextInput
              label="Building ID"
              value={String(form.buildingId ?? '')}
              onChangeText={(t) =>
                onChange('buildingId', t)
              }
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
            <View style={{ width: 12 }} />
            <TextInput
              label="Role ID"
              value={String(form.employeeRoleId ?? '')}
              onChangeText={(t) =>
                onChange('employeeRoleId', t)
              }
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={submitting}
            disabled={submitting}
            style={styles.saveBtn}
            contentStyle={{ paddingVertical: 10 }}
            buttonColor="#2ecc71"
            textColor="#ffffff"
          >
            Lưu thay đổi
          </Button>

          {submitting && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator />
            </View>
          )}
        </Surface>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* =======================
   Styles
======================= */
const AVATAR = 110;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f5f7',
  },
  container: {
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  headerSub: {
    marginTop: 4,
    color: '#777',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: '#ddd',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
    marginTop: 6,
    color: '#333',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  switchLabel: {
    fontWeight: '600',
    color: '#444',
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 10,
  },
});
