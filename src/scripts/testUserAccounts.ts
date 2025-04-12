import { adminAuth, adminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';
import { securityConfig } from '../lib/config';
import { getAuth, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, isAdmin } from '../lib/firebase';

// Load environment variables
dotenv.config();

// Test account information
const TEST_ACCOUNTS = [
  {
    email: 'admin_test@example.com',
    password: 'Test123!',
    name: 'Admin Test',
    role: 'admin'
  },
  {
    email: 'partner_complete@example.com',
    password: 'Partner123!',
    name: 'Partner Complete',
    siteName: 'Complete Research Center',
    role: 'partner',
    fullProfile: true
  },
  {
    email: 'partner_partial@example.com',
    password: 'Partner123!',
    name: 'Partner Partial',
    siteName: 'Partial Research Center',
    role: 'partner',
    fullProfile: false
  },
  {
    email: 'basic_user@example.com',
    password: 'Basic123!',
    name: 'Basic User',
    siteName: 'Basic Research',
    subscription: 'basic',
    role: 'partner'
  },
  {
    email: 'enterprise_user@example.com',
    password: 'Enterprise123!',
    name: 'Enterprise User',
    siteName: 'Enterprise Research',
    subscription: 'enterprise',
    role: 'partner'
  }
];

// Helper function for colored console logging
const log = {
  info: (msg: string) => console.log(`\x1b[36mINFO:\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32mSUCCESS:\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31mERROR:\x1b[0m ${msg}`),
  warning: (msg: string) => console.log(`\x1b[33mWARNING:\x1b[0m ${msg}`)
};

/**
 * Create test accounts using Firebase Admin SDK
 */
async function createTestAccounts() {
  log.info('Creating test accounts...');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      // Check if user already exists
      try {
        const existingUser = await adminAuth.getUserByEmail(account.email);
        log.warning(`User ${account.email} already exists with UID: ${existingUser.uid}`);
        
        // For existing users, make sure their Firestore document exists
        const userDoc = await adminDb.collection('partners').doc(existingUser.uid).get();
        
        if (!userDoc.exists) {
          log.warning(`Creating missing Firestore document for user ${account.email}`);
          
          // Create document with appropriate role
          await adminDb.collection('partners').doc(existingUser.uid).set({
            name: account.name,
            email: account.email,
            role: account.role,
            siteName: account.siteName || 'Research Center',
            active: true,
            createdAt: new Date(),
            subscription: account.subscription || 'none',
            maxLeads: account.role === 'admin' ? 1000 : 50,
            currentLeads: 0,
            updatedAt: new Date()
          });
          
          log.success(`Created missing document for ${account.email}`);
        } else {
          // Update the document to ensure correct role
          await adminDb.collection('partners').doc(existingUser.uid).update({
            role: account.role,
            updatedAt: new Date()
          });
          
          log.success(`Updated existing document for ${account.email}`);
        }
        
        results.push({
          email: account.email,
          uid: existingUser.uid,
          status: 'existing',
          role: account.role
        });
        
        continue;
      } catch (err) {
        // User doesn't exist, proceed with creation
        if (err.code === 'auth/user-not-found') {
          log.info(`User ${account.email} does not exist. Creating new account...`);
        } else {
          throw err;
        }
      }
      
      // Create new user
      const userRecord = await adminAuth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.name,
        emailVerified: true
      });
      
      log.success(`Created user ${account.email} with UID: ${userRecord.uid}`);
      
      // Create Firestore document
      const userData = {
        name: account.name,
        email: account.email,
        siteName: account.siteName || 'Research Center',
        role: account.role,
        active: true,
        createdAt: new Date(),
        subscription: account.subscription || 'none',
        maxLeads: account.role === 'admin' ? 1000 : 50,
        currentLeads: 0,
        responseMetrics: {
          averageResponseTime: 0,
          responseRate: 0,
          totalLeadsReceived: 0,
          totalLeadsContacted: 0,
          lastWeekPerformance: {
            leads: 0,
            responses: 0,
            averageTime: 0,
            trend: 'stable'
          }
        }
      };
      
      // Add profile data for full profiles
      if (account.fullProfile) {
        Object.assign(userData, {
          phone: '(555) 123-4567',
          company: account.siteName,
          position: 'Research Coordinator',
          website: 'https://example.com',
          siteDetails: {
            address: '123 Research Drive',
            city: 'Charlotte',
            state: 'NC',
            zipCode: '28202',
            phone: '(555) 123-4567',
            principalInvestigator: `Dr. ${account.name.split(' ')[0]} Johnson`,
            specialties: ['Cardiology', 'Endocrinology', 'Neurology'],
            certifications: ['GCP Certified', 'ISO 9001'],
            serviceRadius: 25
          }
        });
      }
      
      await adminDb.collection('partners').doc(userRecord.uid).set(userData);
      
      log.success(`Created Firestore document for ${account.email}`);
      results.push({
        email: account.email,
        uid: userRecord.uid,
        status: 'created',
        role: account.role
      });
    } catch (error) {
      log.error(`Failed to create user ${account.email}: ${error.message}`);
      results.push({
        email: account.email,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Test login functionality for each account
 */
async function testLoginFunctionality() {
  log.info('Testing login functionality...');
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      // Attempt to sign in
      log.info(`Testing login for ${account.email}...`);
      
      const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
      const user = userCredential.user;
      
      log.success(`Successfully logged in as ${account.email} (UID: ${user.uid})`);
      
      // Verify Firestore document
      const userDoc = await getDoc(doc(db, 'partners', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        log.success(`Retrieved Firestore document for ${account.email}`);
        log.info(`Role: ${userData.role}, Subscription: ${userData.subscription || 'none'}`);
        
        // Verify user role matches expected role
        if (userData.role !== account.role) {
          log.warning(`Role mismatch: expected ${account.role}, got ${userData.role}`);
          
          // Update role if needed
          if (account.role === 'admin') {
            log.info(`Updating role to admin for ${account.email}`);
            await updateDoc(doc(db, 'partners', user.uid), {
              role: 'admin',
              updatedAt: serverTimestamp()
            });
            log.success(`Updated role to admin for ${account.email}`);
          }
        }
      } else {
        log.error(`No Firestore document found for ${account.email}`);
      }
      
      // Check admin status
      const adminStatus = isAdmin(user.email);
      log.info(`Admin status for ${account.email}: ${adminStatus}`);
      
      results.push({
        email: account.email,
        uid: user.uid,
        loginSuccess: true,
        firestoreDocExists: userDoc.exists(),
        role: userDoc.exists() ? userDoc.data().role : null,
        isAdmin: adminStatus
      });
      
    } catch (error) {
      log.error(`Login failed for ${account.email}: ${error.message}`);
      results.push({
        email: account.email,
        loginSuccess: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Test profile updating functionality
 */
async function testProfileUpdating() {
  log.info('Testing profile updating functionality...');
  
  // Use the first partner account for testing
  const testAccount = TEST_ACCOUNTS.find(a => a.role === 'partner' && a.fullProfile);
  
  if (!testAccount) {
    log.error('No suitable test account found for profile updating test');
    return { success: false, error: 'No suitable test account found' };
  }
  
  try {
    // Sign in as the test user
    log.info(`Signing in as ${testAccount.email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, testAccount.email, testAccount.password);
    const user = userCredential.user;
    
    // Update display name
    const newName = `${testAccount.name} Updated`;
    log.info(`Updating display name to "${newName}"...`);
    
    await updateProfile(user, {
      displayName: newName
    });
    
    // Update Firestore document
    await updateDoc(doc(db, 'partners', user.uid), {
      name: newName,
      updatedAt: serverTimestamp()
    });
    
    log.success(`Profile updated for ${testAccount.email}`);
    
    // Verify the update
    const updatedDoc = await getDoc(doc(db, 'partners', user.uid));
    
    if (updatedDoc.exists() && updatedDoc.data().name === newName) {
      log.success('Profile update verified in Firestore');
      return { success: true, updatedName: newName };
    } else {
      log.error('Profile update failed or not reflected in Firestore');
      return { 
        success: false, 
        error: 'Update not reflected in Firestore',
        expected: newName,
        actual: updatedDoc.exists() ? updatedDoc.data().name : 'Document not found'
      };
    }
  } catch (error) {
    log.error(`Profile update test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test permission restrictions
 */
async function testPermissionRestrictions() {
  log.info('Testing permission restrictions...');
  
  // Get admin and regular user accounts
  const adminAccount = TEST_ACCOUNTS.find(a => a.role === 'admin');
  const partnerAccount = TEST_ACCOUNTS.find(a => a.role === 'partner');
  
  if (!adminAccount || !partnerAccount) {
    log.error('Missing required test accounts for permission test');
    return { success: false, error: 'Missing required test accounts' };
  }
  
  const results = {
    adminAccess: { success: false, details: {} },
    partnerAccess: { success: false, details: {} }
  };
  
  try {
    // Test admin access
    log.info(`Testing admin permissions for ${adminAccount.email}...`);
    const adminCredential = await signInWithEmailAndPassword(auth, adminAccount.email, adminAccount.password);
    const adminUser = adminCredential.user;
    
    // Check if user can access admin-only collections
    const adminDoc = await getDoc(doc(db, 'partners', adminUser.uid));
    results.adminAccess.details.canAccessOwnDocument = adminDoc.exists();
    
    // Try to access a partner document (should be allowed for admin)
    try {
      // First sign in as partner to get their UID
      const partnerCredential = await signInWithEmailAndPassword(auth, partnerAccount.email, partnerAccount.password);
      const partnerUser = partnerCredential.user;
      
      // Now sign back in as admin
      await signInWithEmailAndPassword(auth, adminAccount.email, adminAccount.password);
      
      // Try to access partner document as admin
      const partnerDoc = await getDoc(doc(db, 'partners', partnerUser.uid));
      results.adminAccess.details.canAccessPartnerDocument = partnerDoc.exists();
      results.adminAccess.success = results.adminAccess.details.canAccessPartnerDocument;
      
      log.success(`Admin permission test completed for ${adminAccount.email}`);
    } catch (error) {
      log.error(`Admin permission test failed: ${error.message}`);
      results.adminAccess.details.error = error.message;
    }
    
    // Test partner access
    log.info(`Testing partner permissions for ${partnerAccount.email}...`);
    const partnerCredential = await signInWithEmailAndPassword(auth, partnerAccount.email, partnerAccount.password);
    const partnerUser = partnerCredential.user;
    
    // Check if partner can access their own document
    const partnerOwnDoc = await getDoc(doc(db, 'partners', partnerUser.uid));
    results.partnerAccess.details.canAccessOwnDocument = partnerOwnDoc.exists();
    
    // Try to access admin document (should be denied for partner)
    try {
      const adminDoc = await getDoc(doc(db, 'partners', adminUser.uid));
      results.partnerAccess.details.canAccessAdminDocument = adminDoc.exists();
      
      // This should not happen - partner should not access admin document
      if (adminDoc.exists()) {
        log.warning('SECURITY ISSUE: Partner was able to access admin document');
      } else {
        log.success('Partner correctly denied access to admin document');
      }
    } catch (error) {
      // This is expected - security rules should prevent access
      log.success('Partner correctly denied access to admin document (expected error)');
      results.partnerAccess.details.correctlyDeniedAccess = true;
    }
    
    results.partnerAccess.success = results.partnerAccess.details.canAccessOwnDocument;
    
    log.success(`Partner permission test completed for ${partnerAccount.email}`);
    
    return results;
    
  } catch (error) {
    log.error(`Permission test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  log.info('Starting user account system tests...');
  
  try {
    // Step 1: Create test accounts
    const creationResults = await createTestAccounts();
    log.info('Account creation results:');
    console.table(creationResults);
    
    // Step 2: Test login functionality
    const loginResults = await testLoginFunctionality();
    log.info('Login test results:');
    console.table(loginResults);
    
    // Step 3: Test profile updating
    const profileUpdateResults = await testProfileUpdating();
    log.info('Profile update results:');
    console.log(profileUpdateResults);
    
    // Step 4: Test permissions
    const permissionResults = await testPermissionRestrictions();
    log.info('Permission test results:');
    console.log(JSON.stringify(permissionResults, null, 2));
    
    log.success('All tests completed!');
    
    // Overall test summary
    const summary = {
      accountsCreated: creationResults.filter(r => r.status === 'created').length,
      accountsExisting: creationResults.filter(r => r.status === 'existing').length,
      accountsWithError: creationResults.filter(r => r.status === 'error').length,
      loginSuccessful: loginResults.filter(r => r.loginSuccess).length,
      loginFailed: loginResults.filter(r => !r.loginSuccess).length,
      profileUpdateSuccessful: profileUpdateResults.success,
      permissionTestsSuccessful: permissionResults.adminAccess.success && permissionResults.partnerAccess.success
    };
    
    log.info('Test Summary:');
    console.table(summary);
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Execute the tests
runTests()
  .then(() => {
    log.info('Test script completed.');
    process.exit(0);
  })
  .catch(error => {
    log.error(`Test script failed with error: ${error.message}`);
    process.exit(1);
  });