import { adminAuth, adminDb } from '../lib/firebase-admin';

async function createPartnerUser() {
  try {
    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: 'partner@example.com',
      password: 'Partner123!',
      displayName: 'John Smith',
      emailVerified: true
    });

    // Create the partner document in Firestore
    const partnerData = {
      name: 'John Smith',
      email: 'partner@example.com',
      siteName: 'Research Site #1',
      role: 'partner',
      active: true,
      createdAt: new Date(),
      subscription: 'professional',
      maxLeads: 100,
      currentLeads: 0,
      notificationSettings: {
        newLeads: true,
        leadExpiration: true,
        messages: true,
        responseRate: true,
        emailNotifications: true,
        pushNotifications: true
      },
      responseMetrics: {
        averageResponseTime: 0,
        responseRate: 0,
        totalLeadsReceived: 0,
        totalLeadsContacted: 0,
        lastWeekPerformance: {
          leads: 0,
          responses: 0,
          averageTime: 0
        }
      },
      billing: {
        plan: 'professional',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 299,
        paymentMethod: {
          type: 'credit_card',
          last4: ''
        }
      },
      siteDetails: {
        address: '123 Research Drive',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202',
        phone: '(704) 555-0123',
        principalInvestigator: 'Dr. Sarah Johnson',
        studyCoordinator: 'Michael Smith',
        specialties: ['Cardiology', 'Endocrinology', 'Neurology'],
        certifications: ['ISO 9001', 'GCP Certified'],
        capacity: {
          maxPatients: 200,
          currentPatients: 0,
          studyRooms: 8,
          staff: 15
        }
      }
    };

    await adminDb.collection('partners').doc(userRecord.uid).set(partnerData);

    console.log('Successfully created partner user:');
    console.log('Email:', userRecord.email);
    console.log('UID:', userRecord.uid);
    console.log('Display Name:', userRecord.displayName);
    console.log('Site Name:', partnerData.siteName);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating partner user:', error);
    process.exit(1);
  }
}

createPartnerUser();