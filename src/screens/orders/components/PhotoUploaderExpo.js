// components/PhotoUploaderExpo.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert, ActivityIndicator, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoUploaderExpo({ onUploaded, onError }) {
  const [localPreview, setLocalPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickAndUpload = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Cần quyền', 'Cần quyền camera để chụp ảnh.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // warning previously: but keep this or use ImagePicker.MediaType
      });

      if (res.cancelled || res.canceled) return;
      const asset = Array.isArray(res.assets) ? res.assets[0] : res;
      if (!asset || !asset.uri) return;

      setLocalPreview(asset.uri);
      setLoading(true);

      // prepare multipart/form-data
      const form = new FormData();
      // On Android Expo file uri must be transformed to { uri, name, type }
      const uriParts = asset.uri.split('/');
      const fileName = asset.fileName || uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
      const fileType = asset.type ? `${asset.type}/jpeg` : 'image/jpeg';

      form.append('file', {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      });

      // your cloudinary preset + cloud name
      const CLOUD_NAME = 'dkfykdjlm'; // replace if different
      const UPLOAD_PRESET = 'asmsapp'; // or your preset name

      form.append('upload_preset', UPLOAD_PRESET);
      form.append('folder', 'asmsapp');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      console.log('uploading to', uploadUrl);

      const resp = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
        headers: {
          'Accept': 'application/json',
          // NOTE: do NOT set Content-Type; fetch will set boundary
        },
      });

      const json = await resp.json().catch(()=>null);
      if (!resp.ok) {
        console.warn('cloudinary failed', resp.status, json);
        Alert.alert('Upload thất bại', json?.error?.message ?? `HTTP ${resp.status}`);
        onError && onError(json);
        setLoading(false);
        return;
      }

      const url = json?.secure_url ?? json?.url;
      if (!url) {
        onError && onError(new Error('No secure_url returned from Cloudinary'));
        setLoading(false);
        return;
      }

      // thành công: trả url cho parent
      onUploaded && onUploaded(url);
      setLoading(false);
    } catch (err) {
      console.error('uploadToCloudinary error', err);
      onError && onError(err);
      setLoading(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity onPress={pickAndUpload} style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
        <Text>{loading ? 'Uploading...' : 'Chụp & Upload'}</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator /> : localPreview ? <Image source={{ uri: localPreview }} style={{ width: 80, height: 80, borderRadius: 6 }} /> : null}
    </View>
  );
}
