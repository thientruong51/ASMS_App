import messaging from '@react-native-firebase/messaging';

export async function registerDeviceTokenForUser(userId) {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  const token = await messaging().getToken();
  if (!token) return null;

  await fetch(`${API_BASE_URL}/api/device-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      token,
      platform: 'android',
    }),
  });

  return token;
}
