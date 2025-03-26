import { adminAuth, adminDb } from '../lib/firebase-admin';

const partners = [
  {
    name: 'Sarah Thompson',
    email: 'sarah.thompson@carolinaresearch.com',
    siteName: 'Carolina Research Institute',
    address: '789 Medical Center Blvd',
    city: 'Raleigh',
    state: 'NC',
    metrics: {
      responseRate: 88,
      averageResponseTime: 22,
      totalLeads: 78,
      contactedLeads: 69
    }
  },
  {
    name: 'Michael Chen',
    email: 'mchen@advancedtrials.com',
    siteName: 'Advanced Clinical Trials',
    address: '456 Innovation Way',
    city: 'Durham',
    state: 'NC',
    metrics: {
      responseRate: 95,
      averageResponseTime: 12,
      totalLeads: 120,
      contactedLeads: 114
    }
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.r@piedmontresearch.com',
    siteName: 'Piedmont Research Center',
    address: '234 Healthcare Drive',
    city: 'Winston-Salem',
    state: 'NC',
    metrics: {
      responseRate: 82,
      averageResponseTime: 28,
      totalLeads: 65,
      contactedLeads: 53
    }
  }
];

async function createPartners() {
  try {
    for (const partner of partners) {
      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: partner.email,
        password: 'Partner123!',
        displayName: partner.name,
        emailVerified: true
      });

      // Create partner document
      const partnerData = {
        name: partner.name,
        email: partner.email,
        siteName: partner.siteName,
        role: 'partner',
        active: true,
        createdAt: new Date(),
        subscription: 'professional',
        maxLeads: 200,
        currentLeads: partner.metrics.totalLeads,
        notificationSettings: {
          newLeads: true,
          leadExpiration: true,
          messages: true,
          responseRate: true,
          emailNotifications: true,
          pushNotifications: true
        },
        responseMetrics: {
          averageResponseTime: partner.metrics.averageResponseTime,
          responseRate: partner.metrics.responseRate,
          totalLeadsReceived: partner.metrics.totalLeads,
          totalLeadsContacted: partner.metrics.contactedLeads,
          lastWeekPerformance: {
            leads: Math.floor(partner.metrics.totalLeads * 0.2),
            responses: Math.floor(partner.metrics.contactedLeads * 0.2),
            averageTime: partner.metrics.averageResponseTime
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
          address: partner.address,
          city: partner.city,
          state: partner.state,
          zipCode: '27601',
          phone: '(919) 555-' + Math.floor(1000 + Math.random() * 9000),
          principalInvestigator: `Dr. ${partner.name.split(' ')[0]} ${partner.name.split(' ')[1]}`,
          studyCoordinator: 'Jane Smith',
          specialties: ['Cardiology', 'Endocrinology', 'Neurology'],
          certifications: ['GCP Certified', 'ACRP Certified'],
          capacity: {
            maxPatients: 250,
            currentPatients: partner.metrics.totalLeads,
            studyRooms: 6,
            staff: 12
          }
        }
      };

      await adminDb.collection('partners').doc(userRecord.uid).set(partnerData);

      // Create initial site
      const siteData = {
        name: partner.siteName,
        address: partner.address,
        city: partner.city,
        state: partner.state,
        zipCode: '27601',
        phone: partnerData.siteDetails.phone,
        principalInvestigator: partnerData.siteDetails.principalInvestigator,
        studyCoordinator: partnerData.siteDetails.studyCoordinator,
        status: 'active',
        leads: partner.metrics.totalLeads,
        responseRate: partner.metrics.responseRate + '%',
        createdAt: new Date()
      };

      await adminDb.collection('partners').doc(userRecord.uid).collection('sites').add(siteData);

      console.log(`Created partner: ${partner.name}`);
      console.log(`Email: ${partner.email}`);
      console.log(`UID: ${userRecord.uid}`);
      console.log('---');
    }

    console.log('Successfully created all partners!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating partners:', error);
    process.exit(1);
  }
}

createPartners();