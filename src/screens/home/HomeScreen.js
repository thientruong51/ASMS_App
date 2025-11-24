import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  HomeHeader,
  KPIBoxes,
  StatRow,
  ProcessingCard,
  ContainerCard,
  FooterNav
} from './components';

export default function HomeScreen({ navigation }) {
  const [tab, setTab] = useState('today');

  const logoLocal =
    'https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png';

  const kpiItems = [
    { value: 23, label: 'Chờ vận chuyển', color: '#f4a300' },
    { value: 12, label: 'Đang vận chuyển', color: '#0aa' },
    { value: 34, label: 'POD Pending', color: '#0a0' },
  ];

  const statIcons = {
    waiting:
      'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999451/27483185-f093-414f-9b64-ba6bb1d8dbe4.png',
    delivering:
      'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999485/2a6d7fbb-23eb-4495-9b41-44a7153881be.png',
    delivered:
      'https://res.cloudinary.com/dkfykdjlm/image/upload/v1763999506/34ac5bcb-6099-4760-a9f8-81b31dc44218.png',
  };

  const containerItems = [
    {
      ref: '# BAQENPX-24FT',
      distance: '12,3km',
      plate: '51E1-32124',
      type: 'Cont lạnh',
      pickup: {
        date: '16.01.2024',
        address: '27B QL1A, Linh Xuân, Thủ Đức, Hồ Chí Minh',
        contact: 'Dương Văn Linh'
      },
      delivery: {
        date: '16.01.2024',
        address: '162A/12 Đặng Trần Côn, Bình Thạnh, TP. Hồ Chí Minh',
        contact: 'Nguyễn Anh Tuấn'
      },
      note: 'Gọi trước khi lấy hàng'
    }
  ];

  const onStartTransport = (item) => {
    console.log('Start transport', item.ref);
  };

  const onInfo = (item) => {
    console.log('Info', item.ref);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HomeHeader logo={logoLocal} brand="ASMS" />

        {/* KPI */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <KPIBoxes items={kpiItems} />
        </View>

        {/* Body card wrapper */}
        <View style={styles.body}>
          {/* Thống kê theo */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thống kê theo</Text>
            <Button compact mode="text">Tuần này ▾</Button>
          </View>

          {/* Stat rows */}
          <StatRow
            iconUri={statIcons.waiting}
            iconBg="#fff2d9"
            title="Chờ giao"
            value={{ text: '14', color: '#f4a300' }}
          />
          <StatRow
            iconUri={statIcons.delivering}
            iconBg="#e8f8ff"
            title="Đang giao"
            value={{ text: '04', color: '#0aa' }}
          />
          <StatRow
            iconUri={statIcons.delivered}
            iconBg="#eafbe9"
            title="Đã giao"
            value={{ text: '15', color: '#0a0' }}
          />

          {/* Đang vận chuyển (processing card) */}
          <View style={{ marginTop: 6 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đang vận chuyển</Text>
            </View>

            {/* Nếu có item đang xử lý, show ProcessingCard (lấy item đầu làm ví dụ) */}
            <ProcessingCard
              data={{
                ref: containerItems[0].ref,
                distance: containerItems[0].distance,
                plate: containerItems[0].plate,
                type: containerItems[0].type,
                pickupDate: containerItems[0].pickup.date,
                pickupAddress: containerItems[0].pickup.address
              }}
              onStart={() => onStartTransport(containerItems[0])}
              onInfo={() => onInfo(containerItems[0])}
              onConfig={() => console.log('config')}
            />
          </View>

          {/* Tabs: Dự kiến vận chuyển */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dự kiến vận chuyển</Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'today' && styles.tabActive]}
              onPress={() => setTab('today')}
            >
              <Text style={tab === 'today' ? styles.tabTextActive : styles.tabText}>Hôm nay (4)</Text>
              <Text style={styles.tabDate}>(18.04.2024)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, tab === 'tomorrow' && styles.tabActive]}
              onPress={() => setTab('tomorrow')}
            >
              <Text style={tab === 'tomorrow' ? styles.tabTextActive : styles.tabText}>Ngày mai (8)</Text>
              <Text style={styles.tabDate}>(19.04.2024)</Text>
            </TouchableOpacity>
          </View>

          {/* Container cards list (map items) */}
          {containerItems.map((it, idx) => (
            <View key={idx} style={{ marginBottom: 8 }}>
              <ContainerCard
                item={it}
                onInfo={() => onInfo(it)}
                onConfig={() => console.log('config', it.ref)}
                onPress={() => navigation.navigate('OrderDetail', { orderId: it.id ?? it.ref, order: it })}
              />
            </View>
          ))}


        </View>
      </ScrollView>

      <FooterNav navigation={navigation} active="Dashboard" />
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

  sectionTitleRow: { marginTop: 6, marginBottom: 8 },
  sectionSubTitle: { fontSize: 14, fontWeight: '700', color: '#333' },

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
