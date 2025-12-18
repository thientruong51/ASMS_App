import React, { useState } from 'react';
import { View, Image, Alert, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Constants from "expo-constants";
const {
  
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET
} = Constants.expoConfig.extra;

export default function PhotoUploaderExpo({
  onUploaded,
  onError,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8,
}) {
  const [localUri, setLocalUri] = useState(null);
  const [remoteUrl, setRemoteUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const ensurePermission = async (forCamera = false) => {
    try {
      if (forCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
    } catch (e) {
      console.warn('ensurePermission err', e);
      return false;
    }
  };

  const _handleResult = (res) => {
    console.log('imagepicker result', res);
    if (!res) return null;
    if (res.canceled === false && Array.isArray(res.assets) && res.assets.length > 0) {
      const uri = res.assets[0].uri;
      setLocalUri(uri);
      setRemoteUrl(null);
      return uri;
    }
    if (res.cancelled === false && res.uri) {
      setLocalUri(res.uri);
      setRemoteUrl(null);
      return res.uri;
    }
    return null;
  };

  const takePhoto = async () => {
    const ok = await ensurePermission(true);
    if (!ok) { Alert.alert('Quyền bị từ chối', 'Cần quyền Camera để chụp ảnh'); return; }

    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality,
        maxWidth,
        maxHeight,
      });
      _handleResult(res);
    } catch (e) {
      console.error('takePhoto error', e);
      Alert.alert('Lỗi', 'Mở camera thất bại');
      onError?.(e);
    }
  };

  const pickFromLibrary = async () => {
    const ok = await ensurePermission(false);
    if (!ok) { Alert.alert('Quyền bị từ chối', 'Cần quyền Thư viện để chọn ảnh'); return; }

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality,
        maxWidth,
        maxHeight,
      });
      _handleResult(res);
    } catch (e) {
      console.error('pickFromLibrary error', e);
      Alert.alert('Lỗi', 'Mở thư viện thất bại');
      onError?.(e);
    }
  };

  const uploadToCloudinary = async () => {
    if (!localUri) { Alert.alert('Chưa có ảnh', 'Chụp hoặc chọn ảnh trước khi upload'); return; }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      Alert.alert('Cấu hình Cloudinary thiếu', 'Kiểm tra CLOUDINARY_CLOUD_NAME & CLOUDINARY_UPLOAD_PRESET trong .env');
      return;
    }

    setUploading(true);
    try {
      const uriParts = localUri.split('/');
      const filename = uriParts[uriParts.length - 1].split('?')[0];
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const form = new FormData();
      form.append('file', { uri: localUri, name: filename, type: mimeType });
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const target = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      console.log('uploading to', target);
      const res = await fetch(target, {
        method: 'POST',
        body: form,
        headers: {
          Accept: 'application/json',
        },
      });

      const json = await res.json().catch(() => null);
      console.log('cloudinary response', res.status, json);

      if (!res.ok) {
        const msg = json?.error?.message ?? json?.message ?? `HTTP ${res.status}`;
        Alert.alert('Upload thất bại', msg);
        onError?.(new Error(msg));
        setUploading(false);
        return;
      }

      const url = json?.secure_url || json?.url;
      if (!url) throw new Error('Cloudinary không trả về secure_url');

      setRemoteUrl(url);
      onUploaded?.(url);
      Alert.alert('Upload thành công');
    } catch (err) {
      console.error('uploadToCloudinary error', err);
      Alert.alert('Lỗi upload', String(err));
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setLocalUri(null);
    setRemoteUrl(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={takePhoto}>
          <Icon name="camera" size={18} color="#108a3f" />
          <Text style={styles.btnText}>Chụp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={pickFromLibrary}>
          <Icon name="image" size={18} color="#108a3f" />
          <Text style={styles.btnText}>Chọn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.uploadBtn]} onPress={uploadToCloudinary} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Icon name="cloud-upload" size={18} color="#fff" />}
          <Text style={[styles.btnText, { color: '#fff' }]}>{uploading ? 'Đang upload' : 'Upload'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#fff' }]} onPress={clear}>
          <Text style={{ color: '#555' }}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewWrap}>
        {remoteUrl ? (
          <>
            <Image source={{ uri: remoteUrl }} style={styles.preview} />
            <Text style={styles.previewLabel}>Ảnh upload (cloud)</Text>
          </>
        ) : localUri ? (
          <>
            <Image source={{ uri: localUri }} style={styles.preview} />
            <Text style={styles.previewLabel}>Ảnh local (chưa upload)</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Icon name="camera-outline" size={36} color="#bbb" />
            <Text style={{ color: '#999' }}>Chưa có ảnh</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#eaffee', marginRight: 6 },
  uploadBtn: { backgroundColor: '#108a3f' },
  btnText: { marginLeft: 8, fontWeight: '700', color: '#108a3f' },
  previewWrap: { height: 260, borderRadius: 12, backgroundColor: '#f6f6f6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  previewLabel: { marginTop: 6, color: '#666', fontSize: 12 },
  empty: { alignItems: 'center' },
});
