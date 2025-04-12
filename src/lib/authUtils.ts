import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { securityConfig } from './config';

/**
 * Checks if the current user has admin permissions
 * @returns Promise that resolves to a boolean indicating if user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  
  // Check if email is in admin list
  if (securityConfig.isAdminEmail(user.email)) {
    return true;
  }
  
  // Check role in database
  try {
    const userDoc = await getDoc(doc(db, 'partners', user.uid));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Verifies if a user has permissions to access a specific resource
 * @param resourceId The ID of the resource to check permissions for
 * @param actionType The type of action being performed (read, write, delete)
 * @returns Promise that resolves to a boolean indicating if user has permission
 */
export async function hasPermission(resourceId: string, actionType: 'read' | 'write' | 'delete'): Promise<boolean> {
  // First check if user is admin
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) return true;
  
  const user = auth.currentUser;
  if (!user) return false;
  
  // Check if user owns the resource
  if (resourceId === user.uid) return true;
  
  // Check specific permissions in database
  try {
    const userDoc = await getDoc(doc(db, 'partners', user.uid));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const permissions = userData.permissions || [];
    
    // Check if user has the specific permission
    const permissionMap: Record<string, string[]> = {
      'read': ['read_all', 'read_' + resourceId],
      'write': ['write_all', 'write_' + resourceId],
      'delete': ['delete_all', 'delete_' + resourceId]
    };
    
    return permissions.some((p: string) => permissionMap[actionType].includes(p));
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}