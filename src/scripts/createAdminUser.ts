import { adminAuth, adminDb } from '../lib/firebase-admin';

async function createAdminUser() {
  try {
    // Create admin user in Firebase Auth
    const adminUser = await adminAuth.createUser({
      email: 'digitaltackler@gmail.com',
      password: 'Blessed2020!',
      displayName: 'Admin User',
      emailVerified: true
    });

    // Create admin document in Firestore
    await adminDb.collection('partners').doc(adminUser.uid).set({
      name: 'Admin User',
      email: 'digitaltackler@gmail.com',
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