import { adminDb } from '../lib/firebase-admin';

async function createInitialData() {
  try {
    // Create some initial leads
    const leadsCollection = adminDb.collection('leads');
    
    const leads = [
      {
        firstName: 'John',
        lastName: 'Doe',
        age: 45,
        sex: 'male',
        phone: '+1234567890',
        email: 'john.doe@example.com',
        indication: 'Type 2 Diabetes',
        status: 'new',
        partnerId: 'PARTNER_ID', // This will be replaced with actual partner ID
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      // Add more initial leads as needed
    ];

    for (const lead of leads) {
      await leadsCollection.add(lead);
    }

    console.log('Successfully created initial data');
    process.exit(0);
  } catch (error) {
    console.error('Error creating initial data:', error);
    process.exit(1);
  }
}

createInitialData();