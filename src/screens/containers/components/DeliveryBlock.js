import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DeliveryBlock({
  date,
  address,
  contact,
  onSms = () => {},
  onCall = () => {},
  onConfig = () => {}
}) {
  return (
    <View style={[styles.block, { paddingTop: 8 }]}>
      <View style={styles.left}>
        <View style={[styles.badge, { backgroundColor: '#e8f4ff' }]}>
          <Icon name="arrow-down-bold-circle" size={20} color="#0a8bd6" />
        </View>
      </View>

      <View style={styles.main}>
        <Text style={styles.label}>
          GIAO HÀNG: <Text style={styles.date}>{date}</Text>
        </Text>

        <View style={styles.row}>
          <Icon name="map-marker-outline" size={14} color="#777" />
          <Text style={styles.address}>{address}</Text>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactLeft}>
            <Icon name="account-circle" size={16} color="#777" />
            <Text style={styles.contactName}>{contact}</Text>
          </View>

          <View style={styles.contactRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={onSms}>
              <Icon name="message-text-outline" size={18} color="#108a3f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onCall}>
              <Icon name="phone" size={18} color="#108a3f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.configBtn} onPress={onConfig}>
        <Icon name="cog-outline" size={20} color="#777" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8
  },
  left: { width: 56, alignItems: 'center' },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  main: { flex: 1, paddingRight: 8 },
  label: { fontWeight: '800', color: '#333' },
  date: { color: '#0a8bd6', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  address: { marginLeft: 8, color: '#555', flex: 1, lineHeight: 18 },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center' },
  contactName: { marginLeft: 8, color: '#555' },
  contactRight: { flexDirection: 'row' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eaffee',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  configBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }
});
