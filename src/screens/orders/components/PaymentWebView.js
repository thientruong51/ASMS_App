import React, { useCallback, useState, useRef } from 'react';
import { View, Modal, Alert, ActivityIndicator, Platform, TouchableOpacity, Linking } from 'react-native';
import { Surface, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

export default function PaymentWebView({
  orderCode,
  apiBase,
  onPaid,
  onClose, 
  successUrlPatterns = ['success', 'completed', 'status=success', 'result=success'],
}) {
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);

  const webViewRef = useRef(null);

  const maybeExtractUrlFromText = (text) => {
    if (!text) return null;
    const t = String(text).trim();
    const m = t.match(/https?:\/\/[^\s'"]+/);
    if (m) return m[0];
    if (/^https?:\/\//i.test(t)) return t;
    return null;
  };

  const createPaymentLink = useCallback(async () => {
    if (!orderCode) {
      Alert.alert('Lỗi', 'Không có orderCode để tạo liên kết thanh toán.');
      return;
    }
    setPaymentBusy(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const url = `${apiBase}/api/PayOs/mobile/create-link/${encodeURIComponent(orderCode)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let json = null;
      try { json = await res.clone().json(); } catch (e) {}
      let text = null;
      try { text = await res.clone().text(); } catch (e) {}
      const loc = res.headers && (res.headers.get('location') || res.headers.get('Location')) ? (res.headers.get('location') || res.headers.get('Location')) : null;

      let urlCandidate = null;
      if (json) {
        const data = json?.data ?? json;
        urlCandidate =
          (typeof data === 'string' && data) ||
          data?.url ||
          data?.link ||
          data?.paymentUrl ||
          data?.payment_link ||
          null;
      }
      if (!urlCandidate && loc) urlCandidate = loc;
      if (!urlCandidate && text) urlCandidate = maybeExtractUrlFromText(text);
      if (!urlCandidate && text) {
        const found = maybeExtractUrlFromText(text);
        if (found) urlCandidate = found;
      }

      if (!res.ok) {
        console.warn('createPaymentLink HTTP error', res.status, { json, textSnippet: text ? text.slice(0, 200) : null, loc });
        Alert.alert('Lỗi', json?.message ?? json?.errorMessage ?? `HTTP ${res.status}\n${text ? (text.length > 200 ? text.slice(0,200) + '...' : text) : ''}`);
        return;
      }

      if (!urlCandidate) {
        console.warn('createPaymentLink: could not find url', { status: res.status, json, text: text ? text.slice(0,500) : null, loc });
        Alert.alert('Lỗi', 'Không nhận được liên kết thanh toán từ server. Kiểm tra response (xem console).');
        return;
      }

      setPaymentUrl(urlCandidate);
      setWebviewLoading(true);
      setModalVisible(true);
    } catch (err) {
      console.error('createPaymentLink error', err);
      Alert.alert('Lỗi', 'Tạo liên kết thanh toán thất bại. Kiểm tra kết nối.\n' + (err?.message || err));
    } finally {
      setPaymentBusy(false);
    }
  }, [apiBase, orderCode]);

  const openExternally = useCallback(async (u) => {
    if (!u) { Alert.alert('Không có URL'); return; }
    try {
      const supported = await Linking.canOpenURL(u);
      if (supported) await Linking.openURL(u);
      else Alert.alert('Không thể mở', 'Không thể mở liên kết thanh toán này.');
    } catch (e) {
      console.warn('openExternally error', e);
      Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán.');
    }
  }, []);

  const handleSuccess = useCallback((detectedUrl) => {
    console.log('Payment success detected:', detectedUrl);
    try { if (typeof onPaid === 'function') onPaid(detectedUrl); } catch (e) { console.warn('onPaid error', e); }
    setModalVisible(false);
    if (typeof onClose === 'function') {
      try { onClose(); } catch (e) { console.warn('onClose error', e); }
    }
  }, [onPaid, onClose]);

  const handleNavStateChange = useCallback((navState) => {
    const { url } = navState || {};
    if (!url) return;
    const lower = String(url).toLowerCase();
    for (const pat of successUrlPatterns) {
      if (!pat) continue;
      if (lower.includes(String(pat).toLowerCase())) {
        handleSuccess(url);
        return;
      }
    }
  }, [handleSuccess, successUrlPatterns]);

  const doClose = useCallback(() => {
    setModalVisible(false);
    try { if (typeof onClose === 'function') onClose(); } catch (e) { console.warn('onClose error', e); }
  }, [onClose]);

  return (
    <>
      
        <View  style={{alignItems: 'center',     justifyContent: 'center',  }}>
            <Text style={{ color: '#666', marginBottom: 8,  }}>Tạo liên kết thanh toán.</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            mode="contained"
            onPress={() => createPaymentLink()}
            loading={paymentBusy}
            contentStyle={{ height: 44 }}
          >
            Tạo Thanh toán
          </Button>
        </View>
        </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          doClose();
        }}
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ height: Platform.OS === 'ios' ? 80 : 60, paddingTop: Platform.OS === 'ios' ? 36 : 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee' }}>
            <TouchableOpacity onPress={() => doClose()}>
              <Icon name="close" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={{ fontWeight: '800' }}>Thanh toán</Text>
            <TouchableOpacity onPress={() => paymentUrl && openExternally(paymentUrl)}>
              <Icon name="open-in-new" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {paymentUrl ? (
            <View style={{ flex: 1 }}>
              {webviewLoading && <ActivityIndicator style={{ marginTop: 12 }} />}
              <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                onLoadStart={() => setWebviewLoading(true)}
                onLoadEnd={() => setWebviewLoading(false)}
                startInLoadingState={true}
                onNavigationStateChange={handleNavStateChange}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                  Alert.alert('Lỗi WebView', 'Không thể tải trang thanh toán. Mở bằng trình duyệt ngoài?', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Mở', onPress: () => openExternally(paymentUrl) }
                  ]);
                }}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              <Text>Không có liên kết thanh toán. Vui lòng tạo liên kết trước.</Text>
              <View style={{ height: 10 }} />
              <Button mode="contained" onPress={() => createPaymentLink()} loading={paymentBusy}>Tạo liên kết</Button>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
