import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { pollOnceForUser } from '../services/orderPoller';
import { getCurrentUserInfo } from './userMock'; 

export const ORDER_FETCH_TASK = 'ORDER_FETCH_TASK_EXPO';

TaskManager.defineTask(ORDER_FETCH_TASK, async ({ data, error }) => {
  try {
    const user = await getCurrentUserInfo(); 
    if (!user) return BackgroundFetch.Result.NewData; 

    await pollOnceForUser({ uid: user.uid, currentUserName: user.name });
    return BackgroundFetch.Result.NewData;
  } catch (err) {
    console.error('Background task error', err);
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
    console.warn('Background fetch restricted/denied');
    return false;
  }

  try {
    await BackgroundFetch.registerTaskAsync(ORDER_FETCH_TASK, {
      minimumInterval: 60 * 15, 
      stopOnTerminate: false,
      startOnBoot: true,
    });
    return true;
  } catch (err) {
    console.error('registerBackgroundFetchAsync error', err);
    return false;
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(ORDER_FETCH_TASK);
  } catch (e) {
    // ignore
  }
}
