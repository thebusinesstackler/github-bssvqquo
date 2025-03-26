import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCU5BkOF8YNXy8jH23Ar17m2C4lnncZ4aI",
  authDomain: "theranovex-54c40.firebaseapp.com",
  projectId: "theranovex-54c40",
  storageBucket: "theranovex-54c40.appspot.com",
  messagingSenderId: "993232976383",
  appId: "1:993232976383:web:130f1f5f2a8dbccaed8fca",
  databaseURL: "https://theranovex-54c40-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function createPartnerUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'site1@researchsite.com',
      'ResearchSite1!'
    );

    // Update user profile
    await updateProfile(userCredential.user, {
      displayName: 'Research Site #1'
    });

    // Create partner data in Realtime Database
    const partnerData = {
      name: 'Research Site #1',
      email: 'site1@researchsite.com',
      siteName: 'Research Site #1',
      role: 'partner',
      active: true,
      createdAt: new Date().toISOString(),
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
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

    // Add partner data to Realtime Database
    await set(ref(db, `partners/${userCredential.user.uid}`), partnerData);

    console.log('Successfully created Research Site #1:');
    console.log('Email:', userCredential.user.email);
    console.log('UID:', userCredential.user.uid);
    console.log('Display Name:', userCredential.user.displayName);
    console.log('Site Name:', partnerData.siteName);

    // Exit successfully
    process.exit(0);
  } catch (error: any) {
    console.error('Error creating partner user:', error.message);
    process.exit(1);
  }
}

createPartnerUser();