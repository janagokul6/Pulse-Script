import * as SecureStore from 'expo-secure-store';

const CLERK_JWT_KEY = '__clerk_client_jwt';

const secureStoreOpts = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const tokenCache = {
  getToken: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key, secureStoreOpts);
    } catch {
      await SecureStore.deleteItemAsync(key, secureStoreOpts);
      return null;
    }
  },
  saveToken: (key: string, token: string) => {
    return SecureStore.setItemAsync(key, token, secureStoreOpts);
  },
};

/**
 * Call this from the native WebView handler when the web app posts the Clerk JWT
 * after sign-in. Stores the token so Clerk's getToken() will return it.
 */
export async function setTokenFromWebView(token: string): Promise<void> {
  await SecureStore.setItemAsync(CLERK_JWT_KEY, token, secureStoreOpts);
}

export { tokenCache, CLERK_JWT_KEY };
