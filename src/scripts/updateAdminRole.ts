import { adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to update a specific user's role to admin
 */
async function updateAdminRole() {
  // User details
  const targetUid = 't8m3NoqXXbUeTnHU5eVJCUjtP5k2'; // digitaltackler@gmail.com

  try {
    console.log('Starting admin role update process...');
    console.log(`Target UID: ${targetUid}`);
    
    // Get user document reference
    const userRef = adminDb.collection('partners').doc(targetUid);
    
    // Check if user exists
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error(`Error: User with UID ${targetUid} does not exist in the partners collection`);
      process.exit(1);
    }
    
    // Get current user data
    const userData = userDoc.data();
    console.log('Current user data:', userData);
    
    // Update user role to admin
    await userRef.update({
      role: 'admin',
      updatedAt: new Date()
    });
    
    console.log('✅ Success: User role updated to admin');
    console.log('Updated user details:');
    console.log(`  - UID: ${targetUid}`);
    console.log(`  - Email: ${userData?.email}`);
    console.log(`  - Name: ${userData?.name}`);
    console.log(`  - Previous role: ${userData?.role}`);
    console.log(`  - New role: admin`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin role:', error);
    process.exit(1);
  }
}

// Execute the function
updateAdminRole();