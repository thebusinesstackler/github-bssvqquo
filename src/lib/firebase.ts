import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQWyewzgYZODxuZgRQ30Q6zcHKxFxRFiA",
  authDomain: "accelerate-trials-cf6f4.firebaseapp.com",
  projectId: "accelerate-trials-cf6f4",
  storageBucket: "accelerate-trials-cf6f4.appspot.com",
  messagingSenderId: "180818175374",
  appId: "1:180818175374:web:9da41ee980a2309eb3b0df",
  measurementId: "G-QLTFK58Q4V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in supported environments
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(e => console.error('Error checking analytics support:', e));
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Helper function to check if a user is admin based on env variable
export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  return email === 'digitaltackler@gmail.com' || email === 'theranovex@gmail.com';
};

// Update user profile
export const updateUserProfile = async (updates: { name?: string; email?: string }) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    // Update auth profile if name is provided
    if (updates.name) {
      await updateProfile(user, {
        displayName: updates.name
      });
    }

    // Update email if provided
    if (updates.email && updates.email !== user.email) {
      await updateEmail(user, updates.email);
    }

    // Update Firestore document
    const userRef = doc(db, 'partners', user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Update local storage
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      localStorage.setItem('userSession', JSON.stringify({
        ...sessionData,
        ...updates
      }));
    }

    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Login with email and password
export async function loginWithEmailAndPassword(email: string, password: string) {
  try {
    // Log authentication attempt
    console.log(`Attempting to login with email: ${email}`);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Successfully authenticated user: ${user.uid}`);

    // If admin login
    if (isAdmin(email)) {
      console.log('Admin user detected');
      try {
        // Get admin document from Firestore
        const userDoc = await getDoc(doc(db, 'partners', user.uid));
        console.log(`Admin document exists: ${userDoc.exists()}`);
        
        const userData = {
          id: user.uid,
          email: email,
          name: userDoc.exists() ? userDoc.data().name || 'Admin User' : 'Admin User',
          role: 'admin',
          createdAt: new Date(user.metadata.creationTime || Date.now()),
          active: true
        };
        localStorage.setItem('userSession', JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Create admin user document if it doesn't exist
        try {
          const adminData = {
            id: user.uid,
            email: email,
            name: 'Admin User',
            role: 'admin',
            active: true,
            createdAt: serverTimestamp(),
            subscription: 'none',
            maxLeads: 1000,
            currentLeads: 0
          };
          await setDoc(doc(db, 'partners', user.uid), adminData);
          
          const returnData = {
            ...adminData,
            createdAt: new Date()
          };
          localStorage.setItem('userSession', JSON.stringify(returnData));
          return returnData;
        } catch (createError) {
          console.error('Error creating admin user document:', createError);
          // Fallback to basic user data
          const fallbackData = {
            id: user.uid,
            email: email,
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date(),
            active: true
          };
          localStorage.setItem('userSession', JSON.stringify(fallbackData));
          return fallbackData;
        }
      }
    }

    // For partner login, fetch additional data from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'partners', user.uid));
      console.log(`User document exists: ${userDoc.exists()}`);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        try {
          const newUserData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'Partner User',
            role: 'partner',
            active: true,
            createdAt: serverTimestamp(),
            subscription: 'none',
            maxLeads: 50,
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
          
          await setDoc(doc(db, 'partners', user.uid), newUserData);
          
          const returnData = {
            ...newUserData,
            createdAt: new Date()
          };
          
          localStorage.setItem('userSession', JSON.stringify(returnData));
          return returnData;
        } catch (createError) {
          console.error('Error creating user document:', createError);
          // Fallback to basic user data
          const fallbackData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'Partner User',
            role: 'partner',
            createdAt: new Date(),
            active: true,
            subscription: 'none'
          };
          localStorage.setItem('userSession', JSON.stringify(fallbackData));
          return fallbackData;
        }
      }

      const userData = {
        id: user.uid,
        email: user.email,
        name: userDoc.data().name || user.displayName,
        role: isAdmin(user.email) ? 'admin' : userDoc.data().role || 'partner',
        partnerId: user.uid,
        createdAt: userDoc.data().createdAt?.toDate() || new Date(user.metadata.creationTime || Date.now()),
        active: userDoc.data().active ?? true,
        subscription: userDoc.data().subscription || 'none'
      };

      console.log(`User session data: ${JSON.stringify(userData)}`);
      localStorage.setItem('userSession', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to basic user data when Firestore access fails
      const fallbackData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role: isAdmin(user.email) ? 'admin' : 'partner',
        createdAt: new Date(user.metadata.creationTime || Date.now()),
        active: true,
        subscription: 'none'
      };
      localStorage.setItem('userSession', JSON.stringify(fallbackData));
      return fallbackData;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
}

// Sign in with Google
export async function signInWithGoogle(role: 'partner' | 'sponsor') {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user already exists
    const userDoc = await getDoc(doc(db, 'partners', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document with default values (no subscription)
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || 'New User',
        role: isAdmin(user.email) ? 'admin' : role,
        active: true,
        createdAt: serverTimestamp(),
        subscription: 'none',  // Start with no subscription
        maxLeads: isAdmin(user.email) ? 1000 : 50,
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

      await setDoc(doc(db, 'partners', user.uid), userData);
      return userData;
    }

    return {
      id: user.uid,
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

// Create partner user
export async function createPartnerUser(
  email: string, 
  password: string, 
  name: string, 
  siteName: string,
  zipCode: string = '', 
  serviceRadius: number = 25
) {
  try {
    console.log('Creating partner user:', { email, name, siteName, zipCode, serviceRadius });
    
    // Split name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('Firebase Auth user created:', user.uid);

    // Update user profile
    await updateProfile(user, {
      displayName: name
    });

    // Create partner document in Firestore with no subscription by default
    const partnerData = {
      id: user.uid,
      name,
      firstName,  // Add first name
      lastName,   // Add last name
      email,
      siteName,
      role: isAdmin(email) ? 'admin' : 'partner',
      active: true,
      createdAt: serverTimestamp(),
      subscription: 'none',  // Start with no subscription
      maxLeads: 50,  // Default to 50
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
          averageTime: 0,
          trend: 'stable'
        }
      },
      siteDetails: {
        address: '',
        city: '',
        state: '',
        zipCode: zipCode,
        serviceRadius: serviceRadius,
        phone: '',
        principalInvestigator: '',
        studyCoordinator: '',
        specialties: [],
        certifications: [],
        capacity: {
          maxPatients: 0,
          currentPatients: 0,
          studyRooms: 0,
          staff: 0
        }
      }
    };

    await setDoc(doc(db, 'partners', user.uid), partnerData);
    console.log('Firestore document created for partner:', user.uid);

    return {
      id: user.uid,
      ...partnerData,
      createdAt: new Date()
    };
  } catch (error: any) {
    console.error('Error creating partner:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email is already registered');
    }
    throw error;
  }
}

// Logout user
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('userSession');
    localStorage.removeItem('impersonatedUser');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Initialize auth state monitoring
export const initializeAuth = (callback: (user: any | null) => void) => {
  try {
    // First check if there's a stored session
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData && userData.id) {
          // Get fresh user data from Firestore
          getDoc(doc(db, 'partners', userData.id))
            .then(docSnap => {
              if (docSnap.exists()) {
                const freshData = {
                  ...userData,
                  ...docSnap.data(),
                  role: isAdmin(userData.email) ? 'admin' : docSnap.data().role || 'partner',
                  createdAt: docSnap.data().createdAt?.toDate() || new Date()
                };
                localStorage.setItem('userSession', JSON.stringify(freshData));
                callback(freshData as any);
              } else {
                // Document doesn't exist, create it for admin
                if (isAdmin(userData.email)) {
                  setDoc(doc(db, 'partners', userData.id), {
                    name: userData.name || 'Admin User',
                    email: userData.email,
                    role: 'admin',
                    active: true,
                    createdAt: serverTimestamp(),
                    maxLeads: 1000,
                    currentLeads: 0
                  }).then(() => {
                    const adminData = {
                      ...userData,
                      role: 'admin',
                      active: true,
                      createdAt: new Date()
                    };
                    localStorage.setItem('userSession', JSON.stringify(adminData));
                    callback(adminData as any);
                  }).catch(err => {
                    console.error("Error creating admin document:", err);
                    localStorage.removeItem('userSession');
                    callback(null);
                  });
                } else {
                  localStorage.removeItem('userSession');
                  callback(null);
                }
              }
            })
            .catch(error => {
              console.error('Error refreshing user data:', error);
              // For admin users, we'll try to create the document
              if (isAdmin(userData.email)) {
                setDoc(doc(db, 'partners', userData.id), {
                  name: userData.name || 'Admin User',
                  email: userData.email,
                  role: 'admin',
                  active: true,
                  createdAt: serverTimestamp(),
                  maxLeads: 1000,
                  currentLeads: 0
                }).then(() => {
                  const adminData = {
                    ...userData,
                    role: 'admin',
                    active: true,
                    createdAt: new Date()
                  };
                  localStorage.setItem('userSession', JSON.stringify(adminData));
                  callback(adminData as any);
                }).catch(err => {
                  console.error("Error creating admin document:", err);
                  localStorage.removeItem('userSession');
                  callback(null);
                });
              } else {
                localStorage.removeItem('userSession');
                callback(null);
              }
            });
        } else {
          localStorage.removeItem('userSession');
          callback(null);
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('userSession');
        callback(null);
      }
    } else {
      callback(null);
    }

    // Set up auth state listener
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // For admin user
          if (isAdmin(user.email)) {
            const userRef = doc(db, 'partners', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              // Create admin document if it doesn't exist
              await setDoc(userRef, {
                name: user.displayName || 'Admin User',
                email: user.email,
                role: 'admin',
                active: true,
                createdAt: serverTimestamp(),
                maxLeads: 1000,
                currentLeads: 0
              });
            }
            
            const adminData = {
              id: user.uid,
              email: user.email,
              name: user.displayName || 'Admin User',
              role: 'admin',
              createdAt: new Date(user.metadata.creationTime || Date.now()),
              active: true
            };
            localStorage.setItem('userSession', JSON.stringify(adminData));
            callback(adminData as any);
            return;
          }

          // For partner user
          const userDoc = await getDoc(doc(db, 'partners', user.uid));
          if (userDoc.exists()) {
            const userData = {
              id: user.uid,
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate() || new Date(user.metadata.creationTime || Date.now()),
              email: user.email,
              role: isAdmin(user.email) ? 'admin' : userDoc.data().role || 'partner'
            };
            localStorage.setItem('userSession', JSON.stringify(userData));
            callback(userData as any);
          } else {
            // Create default partner document if it doesn't exist
            const defaultData = {
              id: user.uid,
              email: user.email,
              name: user.displayName || 'Partner User',
              role: isAdmin(user.email) ? 'admin' : 'partner',
              active: true,
              createdAt: serverTimestamp(),
              subscription: 'none',  // Start with no subscription
              maxLeads: 50,          // Default value
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
            await setDoc(doc(db, 'partners', user.uid), defaultData);
            localStorage.setItem('userSession', JSON.stringify({
              ...defaultData,
              createdAt: new Date()
            }));
            callback(defaultData as any);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Provide a fallback when Firestore operations fail
          const fallbackData = {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            role: isAdmin(user.email) ? 'admin' : 'partner',
            createdAt: new Date(user.metadata.creationTime || Date.now()),
            active: true,
            subscription: 'none'
          };
          localStorage.setItem('userSession', JSON.stringify(fallbackData));
          callback(fallbackData);
        }
      } else {
        localStorage.removeItem('userSession');
        callback(null);
      }
    });
  } catch (error) {
    console.error('Error in initializeAuth:', error);
    callback(null);
    return () => {};
  }
};

export default app;