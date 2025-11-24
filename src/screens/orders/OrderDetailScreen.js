
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Text, Button, Badge, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DESIGN_REF = '/mnt/data/a695c701-79af-4b2b-bd81-7c1dd118eae5.png';

const STEPS = [
  { key: 'new', label: 'New', icon: 'file-document-outline' },
  { key: 'pickup_scheduled', label: 'Pickup', icon: 'truck-clock' },
  { key: 'pickup_done', label: 'Picked', icon: 'check-circle-outline' },
  { key: 'verified', label: 'Verify', icon: 'shield-check-outline' },
  { key: 'payment_done', label: 'Paid', icon: 'currency-usd' },
  { key: 'in_transit', label: 'Transit', icon: 'truck-fast' },
  { key: 'delivered', label: 'Delivered', icon: 'package-variant-closed' },
];

const STEP_INDEX = STEPS.reduce((acc, s, i) => {
  acc[s.key] = i;
  return acc;
}, {});

function getStepState(stepIndex, currentIndex) {
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export default function OrderDetailScreen({ route, navigation }) {
  const routeOrder = route?.params?.order ?? null;
  const routeOrderId = route?.params?.orderId ?? null;
  const orderId = routeOrder?.id ?? routeOrderId ?? '652210033';

  const defaultOrder = {
    id: orderId,
    status: 'new',
    productName: '',
    sku: '',
    pickup: { id: '', date: '', time: '', status: 'pending' },
    customer: {
      name: '',
      email: '',
      phone: '',
      from: '',
      to: '',
      note: '',
    },
    logistics: {
      provider: '',
      type: '',
      headquarters: '',
    },
    kycDone: false,
    note: '',
  };

  const [order, setOrder] = useState(routeOrder ? { ...defaultOrder, ...routeOrder } : defaultOrder);
  const [busy, setBusy] = useState(false);

  const { width } = useWindowDimensions();
  const isTwoCol = width >= 720;

  const currentIndex = useMemo(() => STEP_INDEX[order?.status] ?? 0, [order?.status]);

  useEffect(() => {
    if (routeOrder) {
      setOrder((prev) => ({ ...defaultOrder, ...prev, ...routeOrder }));
    } else if (routeOrderId && !routeOrder) {
      // If only an ID is passed, you may fetch here. Placeholder:
      // fetchOrder(routeOrderId).then(data => setOrder(prev => ({...defaultOrder, ...prev, ...data})))
    }
  }, [routeOrder, routeOrderId]);

  const updateStatus = async (nextStatus) => {
    if (busy) return;
    const prev = order?.status ?? 'new';
    setOrder((o) => ({ ...o, status: nextStatus }));
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      setOrder((o) => ({ ...o, status: prev }));
      Alert.alert('Lỗi', 'Cập nhật trạng thái thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const goToNextStep = () => {
    const nextIndex = Math.min(currentIndex + 1, STEPS.length - 1);
    const nextStatus = STEPS[nextIndex].key;
    updateStatus(nextStatus);
  };

  const actionsFor = (status) => {
    switch (status) {
      case 'new':
        return [{ key: 'assign', label: 'Assign & Schedule Pickup', onPress: () => updateStatus('pickup_scheduled') }];
      case 'pickup_scheduled':
        return [{ key: 'markPicked', label: 'Mark Picked', onPress: () => updateStatus('pickup_done') }];
      case 'pickup_done':
        return [{ key: 'verify', label: 'Verify & Assign Partner', onPress: () => updateStatus('verified') }];
      case 'verified':
        return [{ key: 'payment', label: 'Proceed to Payment', onPress: () => updateStatus('payment_done') }];
      case 'payment_done':
        return [{ key: 'intransit', label: 'Start Transit', onPress: () => updateStatus('in_transit') }];
      case 'in_transit':
        return [{ key: 'delivered', label: 'Mark Delivered', onPress: () => updateStatus('delivered') }];
      case 'delivered':
        return [{ key: 'invoice', label: 'Download Invoice', onPress: () => Alert.alert('Download', 'Invoice...') }];
      default:
        return [];
    }
  };

  const primaryActions = actionsFor(order?.status ?? 'new');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.statusText}>Status: <Text style={{ fontWeight: '900' }}>{formatStatus(order?.status)}</Text></Text>
          <Text style={styles.orderId}>Order ID: {order?.id ?? '—'}</Text>
        </View>

        <View style={styles.headerRight}>
          {primaryActions.map((a) => (
            <Button
              key={a.key}
              mode="contained"
              compact
              onPress={a.onPress}
              style={{ marginBottom: 6 }}
              contentStyle={{ height: 36 }}
            >
              {a.label}
            </Button>
          ))}

          <TouchableOpacity onPress={() => Alert.alert('Close', 'Close header action')} style={{ marginTop: 6 }}>
            <Icon name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 12, paddingBottom: 140 }}>
        {/* Stepper card */}
        <Surface style={styles.stepCard}>
          <View style={styles.stepCardHeader}>
            <Text style={{ fontWeight: '700' }}>Review the details and proceed with the next steps.</Text>
            <TouchableOpacity onPress={() => Alert.alert('View details')}>
              <Text style={{ color: '#666' }}>View details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepperWrap}>
            <View style={styles.stepperLine} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {STEPS.map((s, i) => {
                const state = getStepState(i, currentIndex);
                return (
                  <View key={s.key} style={styles.stepColumn}>
                    <View style={[
                      styles.stepIconWrap,
                      state === 'done' ? styles.stepDone : state === 'active' ? styles.stepActive : styles.stepPending
                    ]}>
                      <Icon name={s.icon} size={18} color={state === 'pending' ? '#666' : '#fff'} />
                    </View>
                    <Text style={styles.stepLabel}>{s.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Surface>

        {/* badges */}
        <View style={styles.badgesRow}>
          {order?.status === 'new' && <Badge style={styles.badgeYellow}>Awaiting Pickup</Badge>}
          {(order?.status === 'pickup_scheduled' || order?.status === 'pickup_done') && <Badge style={styles.badgeYellow}>Awaiting KYC Verification</Badge>}
          {order?.status !== 'payment_done' && <Badge style={styles.badgeRed}>Payment pending</Badge>}
        </View>

        {/* responsive content: one column on small, two on wide */}
        <View style={[styles.grid, isTwoCol ? styles.gridTwoCols : styles.gridOneCol]}>
          <View style={styles.col}>
            <Surface style={styles.bigCard}>
              <Text style={styles.cardTitle}>Sender / Receiver Details</Text>
              <Divider style={{ marginVertical: 10 }} />
              <View style={styles.row}>
                <Icon name="account-circle" size={36} color="#108a3f" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontWeight: '800' }}>
                    {order?.customer?.name ?? '—'}{' '}
                    <Text style={{ color: '#666', fontWeight: '400' }}>{order?.customer?.email ? ` ${order.customer.email}` : ''}</Text>
                  </Text>

                  <Text style={{ marginTop: 8, fontWeight: '800', fontSize: 16 }}>{order?.customer?.from ?? ''}</Text>

                  <Text style={{ marginTop: 8, color: '#666' }}>{order?.customer?.note ?? ''}</Text>

                  <View style={{ height: 12 }} />

                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={{ color: '#666' }}>Booked</Text>
                      <Text style={{ fontWeight: '700' }}>{order?.bookedOn ?? '14 Feb - 2025 (14:40)'}</Text>
                    </View>
                    <View>
                      <Text style={{ color: '#666' }}>Duration</Text>
                      <Text style={{ fontWeight: '700' }}>{order?.duration ?? '8 days'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Divider style={{ marginVertical: 12 }} />

              <View style={[styles.smallCardsRow, { marginTop: 6 }]}>
                <View style={styles.smallCard}>
                  <Text style={{ color: '#666' }}>Pickup ID</Text>
                  <Text style={{ fontWeight: '800', marginTop: 6 }}>{order?.pickup?.id ?? '—'}</Text>
                </View>
                <View style={styles.smallCard}>
                  <Text style={{ color: '#666' }}>Date</Text>
                  <Text style={{ fontWeight: '800', marginTop: 6 }}>{order?.pickup?.date ?? '—'}</Text>
                </View>
                <View style={styles.smallCard}>
                  <Text style={{ color: '#666' }}>Time</Text>
                  <Text style={{ fontWeight: '800', marginTop: 6 }}>{order?.pickup?.time ?? '—'}</Text>
                </View>
              </View>
            </Surface>

            <Surface style={styles.smallSurface}>
              <Text style={styles.cardTitle}>Pickup</Text>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: '#666' }}>Status</Text>
                <Badge style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: (order?.pickup?.status === 'pending') ? '#fff2b8' : '#dff8e1' }}>
                  {order?.pickup?.status ?? 'pending'}
                </Badge>
              </View>
            </Surface>

            <Surface style={styles.smallSurface}>
              <Text style={styles.cardTitle}>Logistics Provider</Text>
              <Text style={{ marginTop: 6 }}>{order?.logistics?.provider ?? '—'}</Text>
              <Text style={{ color: '#666', marginTop: 6 }}>Type: {order?.logistics?.type ?? '—'}</Text>
              <Text style={{ color: '#666', marginTop: 6 }}>Headquarters: {order?.logistics?.headquarters ?? '—'}</Text>
            </Surface>
          </View>

          <View style={styles.col}>
            <Surface style={styles.bigCard}>
              <Text style={styles.cardTitle}>Order Details</Text>
              <Divider style={{ marginVertical: 10 }} />

              <Text style={{ color: '#666' }}>Product Name</Text>
              <View style={styles.inputLike}><Text>{order?.productName ?? '—'}</Text></View>

              <Text style={{ color: '#666', marginTop: 10 }}>SKU</Text>
              <View style={styles.inputLike}><Text>{order?.sku ?? '—'}</Text></View>

              <View style={{ height: 12 }} />

              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={{ color: '#666' }}>Quantity</Text>
                  <View style={styles.inputLike}><Text>{order?.quantity ?? 1}</Text></View>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={{ color: '#666' }}>Size</Text>
                  <View style={styles.inputLike}><Text>{order?.size ?? '—'}</Text></View>
                </View>
              </View>

              <View style={{ height: 8 }} />

              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={{ color: '#666' }}>Dead Wt.</Text>
                  <View style={styles.inputLike}><Text>{order?.deadWeight ?? '—'}</Text></View>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={{ color: '#666' }}>Volumetric Weight</Text>
                  <View style={styles.inputLike}><Text>{order?.volumetricWeight ?? '—'}</Text></View>
                </View>
              </View>
            </Surface>

            <Surface style={styles.bigCard}>
              <Text style={styles.cardTitle}>KYC & Verification</Text>
              <Divider style={{ marginVertical: 10 }} />

              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#666' }}>KYC Documents</Text>
                <View style={{ marginTop: 8 }}>
                  <RowFile label="Aadhar Card / PAN Card" done={order?.kycDone ?? false} />
                  <RowFile label="GST Certificate" done={order?.kycDone ?? false} />
                  <RowFile label="IEC Certificate" done={order?.kycDone ?? false} />
                </View>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              <View>
                <Text style={{ color: '#666' }}>Essential Shipping Documents</Text>
                <View style={{ marginTop: 8 }}>
                  <RowFile label="Invoice / Commercial Invoice" done />
                  <RowFile label="Packing List" done />
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Download', 'Downloading zip...')}>
                  <Text style={{ color: '#0a8bd6', marginTop: 8 }}>Download files (.zip)</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>
        </View>

        <View style={{ height: 20 }} />
        <Image source={{ uri: DESIGN_REF }} style={styles.hiddenDesign} />
      </ScrollView>

      {/* bottom actions */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Contact', `Contact ${order?.customer?.name ?? 'customer'}`)}
            contentStyle={{ height: 48 }}
          >
            Contact
          </Button>
        </View>

        <View style={{ flex: 1 }}>
          {currentIndex < STEPS.length - 1 ? (
            <Button mode="contained" onPress={goToNextStep} loading={busy} contentStyle={{ height: 48 }}>
              {STEPS[currentIndex + 1]?.label ?? 'Next'}
            </Button>
          ) : (
            <Button mode="contained" onPress={() => Alert.alert('Done', 'Order completed')} contentStyle={{ height: 48 }}>
              Done
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

/* helpers */
function RowFile({ label, done }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <Icon name="file-document-outline" size={18} color={done ? '#108a3f' : '#666'} />
      <Text style={{ marginLeft: 8, flex: 1 }}>{label}</Text>
      <View style={{ width: 12 }} />
      <Icon name={done ? 'check-circle' : 'dots-horizontal'} size={18} color={done ? '#108a3f' : '#999'} />
    </View>
  );
}
function formatStatus(s) {
  switch (s) {
    case 'new':
      return 'New Lead';
    case 'pickup_scheduled':
      return 'Awaiting Pickup';
    case 'pickup_done':
      return 'Awaiting Verification';
    case 'verified':
      return 'Awaiting Assignment';
    case 'payment_done':
      return 'Payment Done';
    case 'in_transit':
      return 'In-Transit';
    case 'delivered':
      return 'Delivered';
    default:
      return s ?? '';
  }
}

/* styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  header: {
    height: Platform.OS === 'ios' ? 92 : 72,
    paddingTop: Platform.OS === 'ios' ? 36 : 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  headerLeft: { width: 40 },
  headerCenter: { flex: 1, paddingLeft: 6 },
  headerRight: { width: 160, alignItems: 'flex-end', justifyContent: 'center' },
  statusText: { fontSize: 14, color: '#222', fontWeight: '600' },
  orderId: { color: '#666', fontSize: 12, marginTop: 4 },

  scroll: { flex: 1 },
  stepCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 1,
  },
  stepCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  stepperWrap: { marginTop: 12, height: 72, justifyContent: 'center' },
  stepperLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#eee',
    top: 36,
    borderRadius: 2,
  },
  stepColumn: { alignItems: 'center', width: 88, paddingHorizontal: 6 },
  stepIconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#108a3f' },
  stepDone: { backgroundColor: '#0a8bd6' },
  stepPending: { backgroundColor: '#eee' },
  stepLabel: { marginTop: 8, fontSize: 12, color: '#444' },

  badgesRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  badgeYellow: { backgroundColor: '#fff2b8', color: '#000', marginRight: 8 },
  badgeRed: { backgroundColor: '#ffd6d6', color: '#000', marginRight: 8 },

  grid: { width: '100%' },
  gridOneCol: { flexDirection: 'column' },
  gridTwoCols: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  col: { flex: 1, paddingHorizontal: 6, minWidth: 300 },

  bigCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 1,
  },
  smallSurface: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 0.5,
  },

  cardTitle: { fontWeight: '800', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  smallCardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallCard: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
  },

  inputLike: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  hiddenDesign: { width: 1, height: 1, opacity: 0 },
});
