import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'session';

// Secure storage doesn't exist in browsers, so the web preview keeps the session in memory only
// and asks the user to sign in again after a page reload.
let webMemory: string | null = null;

export async function readStoredSession(): Promise<string | null> {
  if (Platform.OS === 'web') return webMemory;
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function writeStoredSession(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemory = value;
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function clearStoredSession(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemory = null;
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
