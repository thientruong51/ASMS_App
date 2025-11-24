import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/config';

export async function getCurrentUserInfo() {
  try {
    const raw = await AsyncStorage.getItem('currentUserInfo');
    if (raw) return JSON.parse(raw);
    const user = auth.currentUser;
    if (user) {
      return { uid: user.uid, name: user.displayName || user.email || user.uid };
    }
  } catch (e) {}
  return null;
}
