import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { securityConfig } from './config';

/**
 * Utility function to verify user permissions
 * @param uid User ID to verify
 * @returns Promise with user details and permissions
 */
export async function verifyUserPermissions(uid: string) {
  try {
    console.log(`Verifying permissions for UID: ${uid}`);
    
    // Get user document from partners collection
    const userDoc = await getDoc(doc(db, 'partners', uid));
    
    if (!userDoc.exists()) {
      console.error(`User document not found for UID: ${uid}`);
      return {
        exists: false,
        isAdmin: false,
        error: 'User document not found in partners collection'
      };
    }
    
    // Extract user data
    const userData = userDoc.data();
    const userEmail = userData.email;
    const userRole = userData.role;
    
    // Check if user is admin based on email
    const isAdmin = securityConfig.isAdminEmail(userEmail);
    
    // Check for role-based admin status
    const hasAdminRole = userRole === 'admin';
    
    console.log('User permission check results:', {
      uid,
      email: userEmail,
      role: userRole,
      isAdmin,
      hasAdminRole,
      exists: true
    });
    
    return {
      exists: true,
      data: userData,
      isAdmin,
      hasAdminRole,
      email: userEmail
    };
  } catch (error) {
    console.error(`Error verifying permissions for UID ${uid}:`, error);
    return {
      exists: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}