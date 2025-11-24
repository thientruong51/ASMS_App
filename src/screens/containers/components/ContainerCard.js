import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function ContainerCard({ item, onInfo, onConfig, onStart, onPress }) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) return onPress(item);
    const orderId = item.id ?? item.ref ?? 'unknown';
    navigation.navigate('OrderDetail', { orderId, order: item });
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.containerId}>CONTAINER ID:</Text>
              <Text style={styles.containerRef}>{item.ref}</Text>
            </View>

            <View style={styles.actions}>
              <Button
                compact
                mode="contained"
                onPress={() => onStart && onStart(item)}
                contentStyle={{ flexDirection: 'row', alignItems: 'center', height: 40 }}
                style={styles.transportBtn}
              >
                <Icon name="truck-fast" size={14} color="#fff" />
                <Text style={styles.transportBtnText}>  vận chuyển</Text>
              </Button>

              <TouchableOpacity style={styles.infoBtn} onPress={() => onInfo && onInfo(item)}>
                <Icon name="information-outline" size={18} color="#777" />
              </TouchableOpacity>
            </View>
          </View>

          {/* small info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Icon name="map-marker-distance" size={16} color="#777" />
              <Text style={styles.infoText}>{item.distance}</Text>
            </View>

            <View style={styles.infoBox}>
              <Icon name="card-bulleted" size={16} color="#777" />
              <Text style={styles.infoText}>{item.plate}</Text>
            </View>

            <View style={styles.infoBox}>
              <Icon name="cube-outline" size={16} color="#777" />
              <Text style={styles.infoText}>{item.type}</Text>
            </View>
          </View>

          {/* pickup block (small) */}
          <View style={styles.transportBlock}>
            <View style={styles.transportLeft}>
              <View style={[styles.transportBadge, { backgroundColor: '#e9f9ee' }]}>
                <Icon name="arrow-up-bold-circle" size={20} color="#1aa64b" />
              </View>
            </View>

            <View style={styles.transportMain}>
              <Text style={styles.transportLabel}>
                LẤY HÀNG: <Text style={styles.transportDate}>{item.pickup?.date}</Text>
              </Text>

              <Text style={styles.transportAddress}>{item.pickup?.address}</Text>

              <View style={styles.transportContactRow}>
                <View style={styles.contactLeft}>
                  <Icon name="account-circle" size={16} color="#777" />
                  <Text style={styles.contactName}> {item.pickup?.contact}</Text>
                </View>

                <View style={styles.contactRight}>
                  <TouchableOpacity style={styles.smallBtn}>
                    <Icon name="message-text-outline" size={16} color="#108a3f" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn}>
                    <Icon name="phone" size={16} color="#108a3f" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.gearBtn} onPress={() => onConfig && onConfig(item)}>
              <Icon name="cog-outline" size={18} color="#777" />
            </TouchableOpacity>
          </View>

          {/* note */}
          {item.note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>GHI CHÚ:</Text>
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    paddingBottom: 6
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  containerId: { color: '#777', fontSize: 12 },
  containerRef: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  actions: { flexDirection: 'row', alignItems: 'center' },
  transportBtn: { backgroundColor: '#18a34a', borderRadius: 8, marginRight: 10 },
  transportBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  infoBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: '#f6f6f6', alignItems: 'center', justifyContent: 'center'
  },

  infoRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee', minWidth: 90, justifyContent: 'center'
  },
  infoText: { marginLeft: 8, color: '#555' },

  transportBlock: { flexDirection: 'row', marginTop: 18, paddingVertical: 12, borderTopWidth: 1, borderColor: '#f0f0f0' },
  transportLeft: { width: 56, alignItems: 'center' },
  transportBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

  transportMain: { flex: 1, paddingRight: 10 },
  transportLabel: { fontWeight: '800', color: '#333' },
  transportDate: { fontWeight: '800', color: '#1aa64b' },
  transportAddress: { marginTop: 6, color: '#555' },

  transportContactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  contactLeft: { flexDirection: 'row', alignItems: 'center' },
  contactName: { marginLeft: 8, color: '#555' },

  contactRight: { flexDirection: 'row' },
  smallBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#eaffee', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  gearBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },

  noteBox: { marginTop: 18, backgroundColor: '#fbfbfb', borderRadius: 10, padding: 12 },
  noteTitle: { color: '#888', fontSize: 12, marginBottom: 6 },
  noteText: { fontWeight: '700', color: '#444' }
});
