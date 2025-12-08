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
import { TextInput, Button, Surface, Text, Switch, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { useNavigation, useRoute } from '@react-navigation/native';


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
    return decodeURIComponent(escape(global?.atob ? global.atob(s) : ''));
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

function safeNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initialData = route.params?.initialData ?? {};
  const employeeIdParam = route.params?.employeeId ?? null;

  const apiBase = API_BASE_URL && API_BASE_URL.length ? API_BASE_URL : 'https://asmsapi-agbeb7evgga8feda.southeastasia-01.azurewebsites.net';

  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState(null);

  const defaultState = useMemo(() => ({
    employeeCode: initialData.employeeCode ?? '',
    name: initialData.name ?? '',
    phone: initialData.phone ?? '',
    address: initialData.address ?? '',
    username: initialData.username ?? '',
    status: initialData.status ?? '',
    isActive: typeof initialData.isActive === 'boolean' ? initialData.isActive : (initialData.IsActive === "True" || initialData.IsActive === true),
    buildingId: initialData.buildingId ?? 0,
    employeeRoleId: initialData.employeeRoleId ?? initialData.EmployeeRoleId ?? 0,
    imageUrl: 'https://res.cloudinary.com/dkfykdjlm/image/upload/v1754997985/ifktveiynvqhzab3oyyk.png' ?? initialData.imageUrl ?? initialData.avatar 
  }), [initialData]);

  const [form, setForm] = useState(defaultState);
  useEffect(() => setForm(defaultState), [defaultState]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('@auth_token');
      setToken(t);
    })();
  }, []);

  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.name || form.name.trim().length < 2) {
      Alert.alert('Lỗi', 'Tên không hợp lệ.');
      return false;
    }
    if (!form.username || form.username.trim().length < 3) {
      Alert.alert('Lỗi', 'Username không hợp lệ.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const id = employeeIdParam ?? (await (async () => {
      if (!token) return null;
      try {
        const payload = JSON.parse(
          typeof Buffer !== 'undefined'
            ? Buffer.from(token.split('.')[1], 'base64').toString('utf8')
            : atob(token.split('.')[1])
        );
        return payload.Id ?? payload.id ?? payload.employeeId ?? payload.sub ?? null;
      } catch (e) {
        return null;
      }
    })());

    if (!id) {
      Alert.alert('Lỗi', 'Không xác định được employee id để cập nhật.');
      return;
    }

    setSubmitting(true);
    try {
      const theId = Number(id);
      const bodyPascal = {
        Id: theId,
        EmployeeCode: form.employeeCode || null,
        EmployeeRoleId: safeNum(form.employeeRoleId),
        Name: form.name,
        BuildingId: safeNum(form.buildingId),
        Phone: form.phone || null,
        Address: form.address || null,
        Username: form.username || null,
        Status: form.status || null,
        IsActive: !!form.isActive,
      };

      const bodyCamel = {
        id: theId,
        employeeCode: form.employeeCode || null,
        employeeRoleId: safeNum(form.employeeRoleId),
        name: form.name,
        buildingId: safeNum(form.buildingId),
        phone: form.phone || null,
        address: form.address || null,
        username: form.username || null,
        status: form.status || null,
        isActive: !!form.isActive,
      };

      const mergedBody = { ...bodyPascal, ...bodyCamel };

      if (form.imageUrl) {
        mergedBody.ImageUrl = form.imageUrl;
        mergedBody.imageUrl = form.imageUrl;
      }
      if (form.password && form.password.length > 0) {
        mergedBody.Password = form.password;
        mergedBody.password = form.password;
      }

      const tokenHeader = token ?? await AsyncStorage.getItem('@auth_token');

      // debug GET (optional)
      try {
        const getUrl = `${apiBase}/api/Employee/${encodeURIComponent(theId)}`;
        const getRes = await fetch(getUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            ...(tokenHeader ? { Authorization: `Bearer ${tokenHeader}` } : {}),
          },
        });
        const getText = await getRes.text().catch(() => null);
        console.log('DEBUG GET /api/Employee', getRes.status, getText && getText.slice ? getText.slice(0,1000) : getText);
      } catch (e) {
        console.warn('DEBUG: GET employee failed', e);
      }

      const url = `${apiBase}/api/Employee/${encodeURIComponent(theId)}`;
      console.log('DEBUG PUT url/body', url, mergedBody);
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          ...(tokenHeader ? { Authorization: `Bearer ${tokenHeader}` } : {}),
        },
        body: JSON.stringify(mergedBody),
      });

      let rawText = null;
      try { rawText = await res.clone().text(); } catch (e) { /* ignore */ }
      let json = null;
      try { json = await res.clone().json(); } catch (e) { /* ignore */ }

      console.log('DEBUG PUT res', res.status, json ?? (rawText ? rawText.slice(0,2000) : null));

      if (!res.ok) {
        const serverMsg = (json?.message ?? json?.error ?? rawText) || `HTTP ${res.status}`;
        const display = typeof serverMsg === 'string' ? serverMsg.slice(0,1500) : JSON.stringify(serverMsg).slice(0,1500);
        Alert.alert('Lỗi server', `Status ${res.status}: ${display}`);
        return;
      }

      Alert.alert('Thành công', 'Cập nhật thông tin nhân viên thành công', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('update employee error', err);
      Alert.alert('Lỗi', 'Cập nhật thất bại. Kiểm tra console/logs.\n' + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const onPickAvatar = () => {
    // placeholder: you can integrate ImagePicker here
    Alert.alert('Avatar', 'Chức năng chọn avatar chưa được cài. Bạn có thể sử dụng react-native-image-picker.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header green area */}
        <View style={styles.header}>
          <View style={styles.headerDecorLeft} />
          <View style={styles.headerDecorRight} />

          <View style={styles.avatarArea}>
            <View style={styles.avatarBorder}>
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarIcon}>🖼️</Text>
                </View>
              )}
            </View>

            <IconButton
              icon="camera"
              size={20}
              style={styles.cameraBtn}
              onPress={onPickAvatar}
              accessibilityLabel="Chọn ảnh đại diện"
            />
          </View>

          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ của bạn bên dưới</Text>
        </View>

        {/* Card with inputs */}
        <Surface style={styles.card}>
          <TextInput
            label="Tên người dùng"
            value={form.username}
            onChangeText={t => onChange('username', t)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="account" />}
            placeholder="thientruong51"
          />
          <TextInput
            label="Họ và Tên"
            value={form.name}
            onChangeText={t => onChange('name', t)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="account-circle" />}
            placeholder="Diệp Nguyễn Thiên Trường"
          />
          <TextInput
            label="Số điện thoại"
            value={form.phone}
            onChangeText={t => onChange('phone', t)}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="phone" />}
            placeholder="0912345678"
          />
          <TextInput
            label="Email"
            value={form.email ?? ''}
            onChangeText={t => onChange('email', t)}
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="email" />}
          />
          <TextInput
            label="Địa chỉ"
            value={form.address}
            onChangeText={t => onChange('address', t)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="map-marker" />}
          />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Active</Text>
            <Switch value={!!form.isActive} onValueChange={v => onChange('isActive', v)} />
          </View>

          <View style={styles.row}>
            <TextInput
              label="BuildingId"
              value={String(form.buildingId ?? '')}
              onChangeText={t => onChange('buildingId', t)}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
            <View style={{ width: 12 }} />
            <TextInput
              label="EmployeeRoleId"
              value={String(form.employeeRoleId ?? '')}
              onChangeText={t => onChange('employeeRoleId', t)}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <TextInput
            label="Avatar URL"
            value={form.imageUrl ?? ''}
            onChangeText={t => onChange('imageUrl', t)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon name="image" />}
          />

          <View style={{ height: 12 }} />

          <Button mode="contained" onPress={handleSave} loading={submitting} disabled={submitting} contentStyle={{ paddingVertical: 6 }}>
            Lưu
          </Button>

          {submitting && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator />
            </View>
          )}
        </Surface>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 260;
const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f4f6' },
  container: {

  },
  header: {
    height: HEADER_HEIGHT,
    marginTop: 6,
    marginBottom: 0,
    borderRadius: 16,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 18,
    overflow: 'hidden',
  },
  headerDecorLeft: {
    position: 'absolute',
    width: 220,
    height: HEADER_HEIGHT,
    left: -40,
    top: -20,
    backgroundColor: '#27ae60',
    borderRadius: 200,
    opacity: 0.14,
  },
  headerDecorRight: {
    position: 'absolute',
    width: 160,
    height: 120,
    right: -30,
    top: 30,
    backgroundColor: '#2ecc71',
    borderRadius: 100,
    opacity: 0.08,
  },
  avatarArea: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorder: {
    width: AVATAR_SIZE + 10,
    height: AVATAR_SIZE + 10,
    borderRadius: (AVATAR_SIZE + 10) / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 18,
    backgroundColor: '#f7f9f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 36 },
  cameraBtn: {
    position: 'absolute',
    marginTop: 84,
    backgroundColor: '#fff',
    right: (Platform.OS === 'ios' ? 0 : 0),
  },
  headerTitle: {
    marginTop: 12,
    fontWeight: '800',
    fontSize: 18,
    color: '#063f10',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  card: {
    marginTop: -36,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    fontWeight: '700',
    color: '#333',
  },
});
