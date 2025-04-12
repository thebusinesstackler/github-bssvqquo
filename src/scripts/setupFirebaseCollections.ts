import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Admin configuration
const adminEmails = ['theranovex@gmail.com', 'digitaltackler@gmail.com'];
const adminEmail = process.env.ADMIN_EMAIL || 'digitaltackler@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'BlessedYear2025!';

// Initialize Firebase Admin SDK
const adminApp = getApps().length === 0 
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
    }) 
  : getApps()[0];

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

async function setupFirebaseCollections() {
  console.log('Starting Firebase collections setup...');
  
  try {
    // Create necessary collections if they don't exist
    const collections = [
      'partners',
      'notifications',
      'messages',
      'screenerForms',
      'customers'
    ];
    
    // Create or verify collections
    for (const collectionName of collections) {
      console.log(`Setting up collection: ${collectionName}`);
      
      try {
        // Check if collection exists by getting a document
        const snapshot = await adminDb.collection(collectionName).limit(1).get();
        
        if (snapshot.empty) {
          console.log(`Collection ${collectionName} is empty, adding initial document`);
          
          // Add a setup document to create the collection
          const setupDoc = await adminDb.collection(collectionName).add({
            _setup: true,
            _createdAt: new Date(),
            _description: `Setup document for ${collectionName} collection`,
            _note: 'This document can be safely removed'
          });
          
          console.log(`Created setup document for ${collectionName} with ID: ${setupDoc.id}`);
        } else {
          console.log(`Collection ${collectionName} already exists with documents`);
        }
      } catch (error) {
        console.error(`Error setting up collection ${collectionName}:`, error);
      }
    }
    
    // Find admin user by email
    console.log(`Looking for admin user with email: ${adminEmail}`);
    try {
      const userRecord = await adminAuth.getUserByEmail(adminEmail);
      console.log(`Found admin user with UID: ${userRecord.uid}`);
      
      // Check if this user has a document in the partners collection
      const userDoc = await adminDb.collection('partners').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        console.log(`Creating partners document for admin user ${userRecord.uid}`);
        
        // Create admin document
        await adminDb.collection('partners').doc(userRecord.uid).set({
          name: userRecord.displayName || 'Admin User',
          email: adminEmail,
          role: 'admin',
          active: true,
          createdAt: new Date(),
          subscription: 'none',
          maxLeads: 1000,
          currentLeads: 0
        });
        
        console.log(`Created partners document for admin user ${userRecord.uid}`);
      } else {
        console.log(`Updating partners document for admin user ${userRecord.uid}`);
        
        // Update the document to ensure it has admin role
        await adminDb.collection('partners').doc(userRecord.uid).update({
          role: 'admin',
          active: true,
          updatedAt: new Date()
        });
        
        console.log(`Updated partners document for admin user ${userRecord.uid}`);
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Admin user with email ${adminEmail} not found. Please create admin user first.`);
      } else {
        console.error('Error checking admin user:', error);
      }
    }
    
    console.log('Firebase collections setup completed successfully');
  } catch (error) {
    console.error('Error during Firebase collections setup:', error);
    throw error;
  }
}

// Run the setup function
setupFirebaseCollections()
  .then(() => {
    console.log('Firebase collections setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Firebase collections setup failed:', error);
    process.exit(1);
  });