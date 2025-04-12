import { adminAuth, adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';
import { getDatabase, ref, set } from 'firebase-admin/database';

// Load environment variables
dotenv.config();

async function createPartnerRealtime() {
  try {
    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: 'realtime-partner@example.com',
      password: 'Realtime123!',
      displayName: 'Realtime Research',
      emailVerified: true
    });

    // Create the partner document in Firestore
    const partnerData = {
      name: 'Realtime Research',
      email: 'realtime-partner@example.com',
      siteName: 'Realtime Clinical Center',
      role: 'partner',
      active: true,
      createdAt: new Date(),
      subscription: 'professional',
      maxLeads: 100,
      currentLeads: 25,
      notificationSettings: {
        newLeads: true,
        leadExpiration: true,
        messages: true,
        responseRate: true,
        emailNotifications: true,
        pushNotifications: true
      },
      responseMetrics: {
        averageResponseTime: 12,
        responseRate: 85,
        totalLeadsReceived: 30,
        totalLeadsContacted: 25,
        lastWeekPerformance: {
          leads: 8,
          responses: 7,
          averageTime: 10
        }
      },
      billing: {
        plan: 'professional',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 299,
        paymentMethod: {
          type: 'credit_card',
          last4: '4242',
          brand: 'visa',
          expMonth: 12,
          expYear: 2025
        }
      },
      siteDetails: {
        address: '500 Technology Drive',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28105',
        phone: '(704) 555-7000',
        principalInvestigator: 'Dr. Rebecca Taylor',
        studyCoordinator: 'James Wilson',
        specialties: ['Cardiology', 'Pulmonology', 'Endocrinology'],
        certifications: ['GCP Certified', 'ISO 9001'],
        capacity: {
          maxPatients: 200,
          currentPatients: 85,
          studyRooms: 8,
          staff: 15
        }
      }
    };

    await adminDb.collection('partners').doc(userRecord.uid).set(partnerData);

    // Create a partner in Realtime Database for real-time features
    const db = getDatabase();
    await set(ref(db, `partners/${userRecord.uid}`), {
      name: partnerData.name,
      email: partnerData.email,
      role: 'partner',
      online: false,
      lastSeen: { '.sv': 'timestamp' },
      subscription: 'professional'
    });

    // Create initial site
    const siteData = {
      name: 'Realtime Clinical Center',
      address: '500 Technology Drive',
      city: 'Charlotte',
      state: 'NC',
      zipCode: '28105',
      phone: '(704) 555-7000',
      principalInvestigator: 'Dr. Rebecca Taylor',
      status: 'active',
      leads: 25,
      responseRate: '85%',
      createdAt: new Date()
    };

    const siteRef = await adminDb.collection('partners').doc(userRecord.uid).collection('sites').add(siteData);

    // Create sample leads
    const leadCount = 12;
    console.log(`Creating ${leadCount} sample leads for Realtime Research`);
    
    for (let i = 0; i < leadCount; i++) {
      const statuses = ['new', 'not_contacted', 'contacted', 'qualified', 'converted', 'lost'];
      const statusWeights = [4, 2, 3, 2, 1, 0.5]; // More likely to be new/contacted
      const randomStatus = weightedRandom(statuses, statusWeights);
      
      const qualities = ['hot', 'warm', 'cold'];
      const qualityWeights = [1, 3, 1]; // More likely to be warm
      const randomQuality = weightedRandom(qualities, qualityWeights);
      
      const leadData = {
        firstName: ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'William', 'Susan'][Math.floor(Math.random() * 8)],
        lastName: ['Smith', 'Jones', 'Williams', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson'][Math.floor(Math.random() * 8)],
        email: `patient${i + 1}${Math.floor(Math.random() * 1000)}@example.com`,
        phone: `(704) 555-${1000 + Math.floor(Math.random() * 9000)}`,
        status: randomStatus,
        quality: randomQuality,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
        siteId: siteRef.id,
        indication: ['Type 2 Diabetes', 'Hypertension', 'COPD', 'Rheumatoid Arthritis'][Math.floor(Math.random() * 4)],
        notes: `Patient interested in participating in clinical trials. Initial screening completed. ${i % 3 === 0 ? 'High priority follow-up required.' : ''}`,
        assignmentHistory: [
          {
            toPartnerId: userRecord.uid,
            assignedBy: 'admin',
            assignedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
          }
        ]
      };

      const leadRef = await adminDb.collection('partners').doc(userRecord.uid).collection('leads').add(leadData);
      
      // Add to Realtime Database for real-time features
      await set(ref(db, `partners/${userRecord.uid}/leads/${leadRef.id}`), {
        id: leadRef.id,
        name: `${leadData.firstName} ${leadData.lastName}`,
        status: leadData.status,
        quality: leadData.quality,
        updatedAt: { '.sv': 'timestamp' }
      });
    }
    
    // Create sample notifications
    const notificationCount = 8;
    
    for (let i = 0; i < notificationCount; i++) {
      const isRead = i < 3 ? false : Math.random() > 0.5;
      const daysAgo = Math.floor(Math.random() * 14);
      
      const notificationTypes = ['system', 'admin', 'lead'];
      const notificationTitles = {
        system: ['System Maintenance', 'Platform Update', 'Security Alert'],
        admin: ['Message from Admin', 'Performance Update', 'Action Required'],
        lead: ['New Lead Assigned', 'Lead Status Update', 'Lead Expiring Soon']
      };
      
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const title = notificationTitles[type][Math.floor(Math.random() * 3)];
      
      const notificationData = {
        partnerId: userRecord.uid,
        title: title,
        message: getNotificationMessage(type, title),
        type: type,
        read: isRead,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        createdBy: type === 'admin' ? 'admin' : 'system'
      };

      await adminDb.collection('partners').doc(userRecord.uid).collection('notifications').add(notificationData);
      
      // Also add to global notifications for admin visibility
      await adminDb.collection('notifications').add({
        ...notificationData,
        createdBy: 'system'
      });
    }

    console.log('✅ Successfully created Realtime Partner with sample data');
    console.log('Email:', userRecord.email);
    console.log('Password: Realtime123!');
    console.log('UID:', userRecord.uid);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating partner:', error);
    process.exit(1);
  }
}

// Helper function to get random item with weights
function weightedRandom(items: any[], weights: number[]): any {
  let i;
  const random = Math.random() * weights.reduce((a, b) => a + b);
  for (i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      break;
    }
    weights[i + 1] += weights[i];
  }
  return items[i];
}

// Helper function to generate notification messages
function getNotificationMessage(type: string, title: string): string {
  if (type === 'system') {
    if (title === 'System Maintenance') return 'Scheduled maintenance will occur tonight from 2-3 AM EST. No action required.';
    if (title === 'Platform Update') return 'The platform has been updated with new features. Check the dashboard for details.';
    if (title === 'Security Alert') return 'Please update your password to maintain account security.';
  } else if (type === 'admin') {
    if (title === 'Message from Admin') return 'The admin team has sent you an important message. Please check your inbox.';
    if (title === 'Performance Update') return 'Your site is performing well with a 85% response rate. Great job!';
    if (title === 'Action Required') return 'Please update your site profile information to improve lead matching.';
  } else if (type === 'lead') {
    if (title === 'New Lead Assigned') return 'A new lead has been assigned to your site. Please respond within 24 hours.';
    if (title === 'Lead Status Update') return 'A lead status has been automatically updated due to inactivity.';
    if (title === 'Lead Expiring Soon') return 'You have leads that will expire in 48 hours. Please take action.';
  }
  
  return 'Please check your dashboard for important updates.';
}

// Run the script
createPartnerRealtime();