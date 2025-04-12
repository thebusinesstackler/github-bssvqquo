import { adminAuth, adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';
import { securityConfig } from '../lib/config';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'digitaltackler@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('Error: ADMIN_PASSWORD environment variable is not set');
      process.exit(1);
    }
    
    // Validate this is an allowed admin email
    if (!securityConfig.isAdminEmail(adminEmail)) {
      console.error(`Error: ${adminEmail} is not in the list of allowed admin emails`);
      process.exit(1);
    }
    
    // Create admin user in Firebase Auth
    const adminUser = await adminAuth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'Admin User',
      emailVerified: true
    });

    // Create admin document in Firestore
    await adminDb.collection('partners').doc(adminUser.uid).set({
      name: 'Admin User',
      email: adminEmail,
      role: 'admin',
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      permissions: ['all']
    });

    console.log('Successfully created admin user:');
    console.log('Email:', adminUser.email);
    console.log('UID:', adminUser.uid);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();