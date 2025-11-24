import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase/config';
import * as Application from 'expo-application';

export async function registerDeviceTokenForUser(uid) {
  if (!Constants.isDevice) {
    console.warn("FCM: requires real device");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn("No push permission granted");
    return null;
  }

  const tokenObj = await Notifications.getDevicePushTokenAsync(); 
  const token = tokenObj?.data;
  const tokenType = tokenObj?.type || 'unknown';
  if (!token) return null;

  const deviceId = Application.androidId || Application.androidId || Application.getIosIdForVendorAsync?.() || 'unknown-device';

  try {
    const docRef = doc(db, 'users', uid, 'devices', token);
    await setDoc(docRef, {
      token,
      type: tokenType,
      deviceId,
      platform: Constants.platform?.android ? 'android' : 'ios',
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });
    console.log('Saved FCM token to Firestore:', token);
  } catch (err) {
    console.error('Error saving token to Firestore:', err);
  }
  return token;
}
