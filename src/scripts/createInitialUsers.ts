import { adminAuth, adminDb } from '../lib/firebase-admin';

async function createInitialUsers() {
  try {
    // Create admin user in Firebase Auth
    const adminUser = await adminAuth.createUser({
      email: 'theranovex@gmail.com',
      password: 'admin123',
      displayName: 'Admin User',
      emailVerified: true
    });

    // Create admin document in Firestore using the auth UID
    await adminDb.collection('partners').doc(adminUser.uid).set({
      name: 'Admin User',
      email: 'theranovex@gmail.com',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      permissions: ['all']
    });

    // Create partner user in Firebase Auth
    const partnerUser = await adminAuth.createUser({
      email: 'john.smith@researchsite.com',
      password: 'TestPartner123!',
      displayName: 'John Smith',
      emailVerified: true
    });

    // Create partner document in Firestore using the auth UID
    const partnerData = {
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
    };

    await adminDb.collection('partners').doc(partnerUser.uid).set(partnerData);

    // Create initial site for partner
    await adminDb.collection('partners').doc(partnerUser.uid).collection('sites').add({
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

    console.log('Successfully created users:');
    console.log('Admin:', adminUser.email, '(UID:', adminUser.uid, ')');
    console.log('Partner:', partnerUser.email, '(UID:', partnerUser.uid, ')');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createInitialUsers();