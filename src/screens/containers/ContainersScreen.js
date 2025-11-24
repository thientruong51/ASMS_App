import React, { useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView as RNScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';

import HomeHeader from '../home/components/HomeHeader';
import FooterNav from '../../components/FooterNav';
import ContainerCard from './components/ContainerCard';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function ContainersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('waiting');

  const scrollRef = useRef(null);
  const chipLayouts = useRef({}); 

  const tabList = [
    { key: 'waiting', label: 'Chờ vận chuyển', count: 12 },
    { key: 'delivering', label: 'Đang vận chuyển', count: 3 },
    { key: 'pod', label: 'POD Pending', count: 12 }
  ];

  const containers = [
    {
      id: '1',
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
    },
    {
      id: '2',
      ref: '# BAQENPX-24FT',
      distance: '8,4km',
      plate: '51E1-99999',
      type: 'Cont thường',
      pickup: {
        date: '17.01.2024',
        address: 'Lô 3A, Kho C',
        contact: 'Trần Văn A'
      }
    }
  ];

  const filtered = containers;

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

  return (
    <SafeAreaView style={styles.screen}>
      <RNScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
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
                      {String(t.count).padStart(2, '0')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </RNScrollView>
          </View>
        </View>

        {/* LIST */}
        <View style={styles.body}>
          <FlatList
  data={filtered}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={{ marginBottom: 14 }}>
      <ContainerCard
        item={item}
        onInfo={() => {}}
        onConfig={() => {}}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id ?? item.ref, order: item })}
      />
    </View>
  )}
  scrollEnabled={false}
/>

        </View>
      </RNScrollView>

      <FooterNav navigation={navigation} active="Containers" />
    </SafeAreaView>
  );
}

/* Styles */
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
