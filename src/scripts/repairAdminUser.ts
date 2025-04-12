import { adminAuth, adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to repair a specific admin user's document in Firestore
 * Specifically targeting the admin user with UID: t8m3NoqXXbUeTnHU5eVJCUjtP5k2
 */
async function repairAdminUser() {
  // Target UID
  const targetUid = 't8m3NoqXXbUeTnHU5eVJCUjtP5k2'; // digitaltackler@gmail.com
  const adminEmail = 'digitaltackler@gmail.com';

  try {
    console.log(`Starting admin user repair process for UID: ${targetUid}`);
    
    // Check if user exists in Firebase Auth
    let userData;
    
    try {
      // Try to get the user from Auth
      const userRecord = await adminAuth.getUser(targetUid);
      console.log('✅ User exists in Firebase Auth');
      console.log('User email:', userRecord.email);
      console.log('User display name:', userRecord.displayName);
      
      userData = {
        name: userRecord.displayName || 'Admin User',
        email: userRecord.email || adminEmail,
        emailVerified: userRecord.emailVerified,
        createdAt: new Date(userRecord.metadata.creationTime || Date.now())
      };
    } catch (authError) {
      console.error('❌ User not found in Firebase Auth:', authError);
      console.log('Creating a reference to the user anyway...');
      
      userData = {
        name: 'Admin User',
        email: adminEmail,
        emailVerified: true,
        createdAt: new Date()
      };
    }
    
    // Check if document exists in Firestore
    try {
      const docRef = adminDb.collection('partners').doc(targetUid);
      const doc = await docRef.get();
      
      if (doc.exists) {
        console.log('✅ User document exists in Firestore');
        console.log('Current data:', doc.data());
        
        // Ensure the user has admin role
        await docRef.update({
          role: 'admin',
          active: true,
          updatedAt: new Date()
        });
        
        console.log('✅ Updated user document with admin role');
      } else {
        console.log('❌ User document does not exist in Firestore, creating it...');
        
        // Create the document with admin role
        await docRef.set({
          name: userData.name,
          email: userData.email,
          role: 'admin',
          active: true,
          createdAt: userData.createdAt,
          updatedAt: new Date(),
          subscription: 'none',
          maxLeads: 1000,
          currentLeads: 0
        });
        
        console.log('✅ Created new document for user with admin role');
      }
      
      console.log('✅ Admin user repair completed successfully');
    } catch (firestoreError) {
      console.error('❌ Error accessing Firestore:', firestoreError);
      throw firestoreError;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error repairing admin user:', error);
    process.exit(1);
  }
}

// Run the function
repairAdminUser();