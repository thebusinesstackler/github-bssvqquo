import { adminAuth, adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createMultiplePartners() {
  try {
    // Sample partner data
    const partners = [
      {
        email: 'partner1@example.com',
        password: 'Partner123!',
        name: 'Research Center A',
        city: 'Charlotte',
        state: 'NC',
        specialties: ['Cardiology', 'Diabetes']
      },
      {
        email: 'partner2@example.com',
        password: 'Partner123!',
        name: 'Medical Research Group',
        city: 'Raleigh',
        state: 'NC',
        specialties: ['Oncology', 'Neurology']
      },
      {
        email: 'partner3@example.com',
        password: 'Partner123!',
        name: 'Clinical Studies Institute',
        city: 'Durham',
        state: 'NC',
        specialties: ['Pulmonology', 'Infectious Disease']
      },
      {
        email: 'partner4@example.com',
        password: 'Partner123!',
        name: 'Health Research Associates',
        city: 'Greensboro',
        state: 'NC',
        specialties: ['Endocrinology', 'Rheumatology']
      },
      {
        email: 'partner5@example.com',
        password: 'Partner123!',
        name: 'Advanced Clinical Trials',
        city: 'Winston-Salem',
        state: 'NC',
        specialties: ['Dermatology', 'Gastroenterology']
      }
    ];

    // Create each partner
    for (const [index, partner] of partners.entries()) {
      // Create the user in Firebase Auth
      console.log(`Creating partner ${index + 1}/${partners.length}: ${partner.name}`);
      
      const userRecord = await adminAuth.createUser({
        email: partner.email,
        password: partner.password,
        displayName: partner.name,
        emailVerified: true
      });

      // Create the partner document in Firestore
      const partnerData = {
        name: partner.name,
        email: partner.email,
        siteName: partner.name,
        role: 'partner',
        active: true,
        createdAt: new Date(),
        subscription: index === 0 ? 'professional' : 'basic',
        maxLeads: index === 0 ? 100 : 50,
        currentLeads: Math.floor(Math.random() * (index === 0 ? 60 : 30)),
        notificationSettings: {
          newLeads: true,
          leadExpiration: true,
          messages: true,
          responseRate: true,
          emailNotifications: true,
          pushNotifications: true
        },
        responseMetrics: {
          averageResponseTime: 10 + Math.floor(Math.random() * 20),
          responseRate: 70 + Math.floor(Math.random() * 25),
          totalLeadsReceived: 20 + Math.floor(Math.random() * 40),
          totalLeadsContacted: 15 + Math.floor(Math.random() * 30),
          lastWeekPerformance: {
            leads: 5 + Math.floor(Math.random() * 10),
            responses: 4 + Math.floor(Math.random() * 8),
            averageTime: 8 + Math.floor(Math.random() * 10)
          }
        },
        billing: {
          plan: index === 0 ? 'professional' : 'basic',
          status: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: index === 0 ? 299 : 180,
          paymentMethod: {
            type: 'credit_card',
            last4: '4242'
          }
        },
        siteDetails: {
          address: `${100 + index * 100} Research Blvd`,
          city: partner.city,
          state: partner.state,
          zipCode: `2810${index}`,
          phone: `(704) 555-${1000 + index}`,
          principalInvestigator: `Dr. ${['Sarah', 'Michael', 'Jennifer', 'David', 'Lisa'][index]} ${['Johnson', 'Smith', 'Williams', 'Brown', 'Miller'][index]}`,
          specialties: partner.specialties,
          certifications: ['GCP Certified'],
          capacity: {
            maxPatients: 100 + index * 20,
            currentPatients: Math.floor((50 + index * 10) * Math.random()),
            studyRooms: 4 + index,
            staff: 8 + index * 2
          }
        }
      };

      await adminDb.collection('partners').doc(userRecord.uid).set(partnerData);

      // Create initial site
      const siteData = {
        name: partner.name,
        address: `${100 + index * 100} Research Blvd`,
        city: partner.city,
        state: partner.state,
        zipCode: `2810${index}`,
        phone: `(704) 555-${1000 + index}`,
        principalInvestigator: `Dr. ${['Sarah', 'Michael', 'Jennifer', 'David', 'Lisa'][index]} ${['Johnson', 'Smith', 'Williams', 'Brown', 'Miller'][index]}`,
        status: 'active',
        leads: Math.floor(Math.random() * 30),
        responseRate: `${70 + Math.floor(Math.random() * 20)}%`,
        createdAt: new Date()
      };

      await adminDb.collection('partners').doc(userRecord.uid).collection('sites').add(siteData);
      
      // Create sample leads
      const leadCount = 5 + Math.floor(Math.random() * 10);
      console.log(`  Creating ${leadCount} sample leads for ${partner.name}`);
      
      for (let i = 0; i < leadCount; i++) {
        const leadData = {
          firstName: ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Linda', 'James', 'Barbara', 'William', 'Elizabeth'][Math.floor(Math.random() * 10)],
          lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'][Math.floor(Math.random() * 10)],
          email: `patient${i + 1}${Math.floor(Math.random() * 1000)}@example.com`,
          phone: `(704) ${555 + i}-${1000 + Math.floor(Math.random() * 9000)}`,
          status: ['new', 'not_contacted', 'contacted', 'qualified', 'converted'][Math.floor(Math.random() * 5)] as any,
          quality: ['hot', 'warm', 'cold'][Math.floor(Math.random() * 3)] as any,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(),
          indication: partner.specialties[Math.floor(Math.random() * partner.specialties.length)],
          notes: `Sample lead ${i + 1} for ${partner.name}. This patient is interested in clinical trials.`,
          assignmentHistory: [
            {
              toPartnerId: userRecord.uid,
              assignedBy: 'admin',
              assignedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
            }
          ]
        };

        await adminDb.collection('partners').doc(userRecord.uid).collection('leads').add(leadData);
      }
      
      // Create sample notifications
      const notificationCount = 3 + Math.floor(Math.random() * 5);
      console.log(`  Creating ${notificationCount} sample notifications for ${partner.name}`);
      
      for (let i = 0; i < notificationCount; i++) {
        const notificationData = {
          title: ['New Lead Assigned', 'Study Update', 'Action Required', 'Subscription Updated', 'Message Received'][Math.floor(Math.random() * 5)],
          message: [
            'A new lead has been assigned to your site.',
            'The study protocol has been updated. Please review the changes.',
            'Please update your lead status within 24 hours.',
            'Your subscription has been updated to the latest plan.',
            'You have received a new message from the admin team.'
          ][Math.floor(Math.random() * 5)],
          type: ['system', 'admin', 'lead'][Math.floor(Math.random() * 3)] as any,
          read: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
          partnerId: userRecord.uid
        };

        await adminDb.collection('partners').doc(userRecord.uid).collection('notifications').add(notificationData);
        
        // Also add to global notifications for admin visibility
        await adminDb.collection('notifications').add({
          ...notificationData,
          createdBy: 'system'
        });
      }
      
      // Create sample messages
      const messageCount = 2 + Math.floor(Math.random() * 4);
      console.log(`  Creating ${messageCount} sample messages for ${partner.name}`);
      
      for (let i = 0; i < messageCount; i++) {
        const messageData = {
          content: [
            'Welcome to the platform! Let us know if you have any questions.',
            'Please update your lead statuses to improve your response metrics.',
            'Your recent performance has been excellent. Keep up the good work!',
            'We have a new study that might be a good fit for your site. Please review.',
            'Don\'t forget to complete your profile information for better lead matching.'
          ][Math.floor(Math.random() * 5)],
          senderId: 'admin',
          recipientId: userRecord.uid,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
          read: Math.random() > 0.5
        };

        await adminDb.collection('partners').doc(userRecord.uid).collection('messages').add(messageData);
        
        // Also add to global messages for admin visibility
        await adminDb.collection('messages').add({
          ...messageData,
          recipientName: partner.name
        });
      }
      
      console.log(`✅ Successfully created partner: ${partner.name}`);
    }

    console.log('✅ Successfully created all partners with sample data');
    process.exit(0);
  } catch (error) {
    console.error('Error creating partners:', error);
    process.exit(1);
  }
}

// Run the script
createMultiplePartners();