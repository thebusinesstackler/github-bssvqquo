import { adminDb } from '../lib/firebase-admin';

async function createFirestoreUsers() {
  try {
    // Create admin document
    await adminDb.collection('partners').doc('admin').set({
      name: 'Admin User',
      email: 'theranovex@gmail.com',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      permissions: ['all']
    });

    // Create partner document with complete profile
    await adminDb.collection('partners').doc('partner1').set({
      name: 'John Smith',
      email: 'john.smith@researchsite.com',
      siteName: 'Research Site A',
      role: 'partner',
      active: true,
      createdAt: new Date(),
      subscription: 'professional',
      maxLeads: 100,
      currentLeads: 45,
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
    });

    // Create initial site for partner
    await adminDb.collection('partners').doc('partner1').collection('sites').add({
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
    });

    console.log('Successfully created Firestore documents for:');
    console.log('- Admin (theranovex@gmail.com)');
    console.log('- Partner (john.smith@researchsite.com)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating Firestore documents:', error);
    process.exit(1);
  }
}

createFirestoreUsers();