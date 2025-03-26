import { adminAuth, adminDb } from '../lib/firebase-admin';

async function createTestPartner() {
  try {
    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: 'john.smith@researchsite.com',
      password: 'TestPartner123!',
      displayName: 'John Smith',
      emailVerified: true
    });

    // Create the partner document in Firestore
    const partnerData = {
      name: 'John Smith',
      email: 'john.smith@researchsite.com',
      siteName: 'Research Site A',
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
        averageResponseTime: 15,
        responseRate: 92,
        totalLeadsReceived: 45,
        totalLeadsContacted: 42,
        lastWeekPerformance: {
          leads: 12,
          responses: 11,
          averageTime: 13
        }
      },
      billing: {
        plan: 'professional',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 299,
        paymentMethod: {
          type: 'credit_card',
          last4: '4242'
        }
      },
      siteDetails: {
        address: '123 Research Drive',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202',
        phone: '(555) 123-4567',
        principalInvestigator: 'Dr. Sarah Johnson',
        studyCoordinator: 'Michael Brown',
        specialties: ['Cardiology', 'Endocrinology', 'Neurology'],
        certifications: ['ISO 9001', 'GCP Certified'],
        capacity: {
          maxPatients: 200,
          currentPatients: 45,
          studyRooms: 8,
          staff: 15
        }
      }
    };

    await adminDb.collection('partners').doc(userRecord.uid).set(partnerData);

    // Create initial site
    const siteData = {
      name: 'Research Site A',
      address: '123 Research Drive',
      city: 'Charlotte',
      state: 'NC',
      zipCode: '28202',
      phone: '(555) 123-4567',
      principalInvestigator: 'Dr. Sarah Johnson',
      studyCoordinator: 'Michael Brown',
      status: 'active',
      leads: 45,
      responseRate: '92%',
      createdAt: new Date()
    };

    await adminDb.collection('partners').doc(userRecord.uid).collection('sites').add(siteData);

    console.log('Successfully created test partner:');
    console.log('Name:', userRecord.displayName);
    console.log('Email:', userRecord.email);
    console.log('UID:', userRecord.uid);
    console.log('Site:', partnerData.siteName);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test partner:', error);
    process.exit(1);
  }
}

createTestPartner();