import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const POLL_KEY_PREFIX = 'orderPoll:lastId:';
const API_URL = 'https://your-backend.example.com/path/to/orders'; 

export function findAssignedOrdersFromResponse(respJson, currentUserName) {
  if (!respJson || !Array.isArray(respJson.data)) return [];
  const arr = respJson.data;
  return arr.filter(o => {
    const c = (o.currentAssign || '').toString().trim().toLowerCase();
    const u = (currentUserName || '').toString().trim().toLowerCase();
    return c && u && c === u;
  });
}

function getStorageKeyForUser(uid) {
  return `${POLL_KEY_PREFIX}${uid}`;
}

async function getSeenMap(uid) {
  try {
    const key = getStorageKeyForUser(uid);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

async function setSeenMap(uid, map) {
  const key = getStorageKeyForUser(uid);
  await AsyncStorage.setItem(key, JSON.stringify(map || {}));
}

async function sendLocalNotification({ title, body, data = {} }) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, 
  });
}

export async function pollOnceForUser({ uid, currentUserName }) {
  if (!uid) return;
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.warn('Order poll fetch failed', res.status);
      return;
    }
    const json = await res.json();
    const assigned = findAssignedOrdersFromResponse(json, currentUserName);
    if (!assigned || assigned.length === 0) return;

    const seen = await getSeenMap(uid);

    let changed = false;
    for (const order of assigned) {
      const uniqueId = String(order.trackingHistoryId ?? order.orderDetailCode ?? order.orderCode ?? JSON.stringify(order));
      if (!seen[uniqueId]) {
        const title = `Đơn hàng được giao: ${order.orderDetailCode || order.orderCode || ''}`;
        const body = `${order.actionType || ''} • ${order.newStatus || order.oldStatus || ''}`;
        await sendLocalNotification({
          title,
          body,
          data: { orderId: uniqueId, raw: JSON.stringify(order) }
        });
        seen[uniqueId] = true;
        changed = true;
      } else {
      }
    }

    if (changed) {
      await setSeenMap(uid, seen);
    }
  } catch (err) {
    console.error('pollOnceForUser error', err);
  }
}
