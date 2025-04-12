/**
 * Secure storage utility to handle sensitive data
 * It follows best practices for storage in browser environments
 */

// Constants
const SESSION_KEY = 'userSession';
const TOKEN_KEY = 'authToken';
const IMPERSONATED_USER_KEY = 'impersonatedUser';

/**
 * Save data to secure storage with optional expiration
 * @param key Storage key
 * @param value Data to store
 * @param expirationMinutes Optional expiration time in minutes
 */
export function secureSet(key: string, value: any, expirationMinutes?: number): void {
  const data = {
    value,
    timestamp: Date.now(),
    expiration: expirationMinutes ? Date.now() + expirationMinutes * 60 * 1000 : undefined
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
}

/**
 * Get data from secure storage, handling expiration
 * @param key Storage key
 * @returns The stored value or null if expired or not found
 */
export function secureGet(key: string): any {
  try {
    const dataString = localStorage.getItem(key);
    if (!dataString) return null;
    
    const data = JSON.parse(dataString);
    
    // Check for expiration
    if (data.expiration && Date.now() > data.expiration) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove data from secure storage
 * @param key Storage key
 */
export function secureRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
}

/**
 * Clear all secure storage data
 */
export function secureClear(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_USER_KEY);
  } catch (error) {
    console.error('Error clearing secure storage:', error);
  }
}

// User session specific methods
export const userStorage = {
  saveSession: (userData: any) => secureSet(SESSION_KEY, userData),
  getSession: () => secureGet(SESSION_KEY),
  clearSession: () => secureRemove(SESSION_KEY),
  
  saveToken: (token: string, expirationMinutes: number) => 
    secureSet(TOKEN_KEY, token, expirationMinutes),
  getToken: () => secureGet(TOKEN_KEY),
  clearToken: () => secureRemove(TOKEN_KEY),
  
  saveImpersonation: (userData: any) => secureSet(IMPERSONATED_USER_KEY, userData),
  getImpersonation: () => secureGet(IMPERSONATED_USER_KEY),
  clearImpersonation: () => secureRemove(IMPERSONATED_USER_KEY)
};