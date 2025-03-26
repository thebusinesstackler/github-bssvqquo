import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAS20kFBkbKnE0a-3K7zbTuXI-LlvUaO4Q",
  authDomain: "accelerate-trials.firebaseapp.com",
  projectId: "accelerate-trials",
  storageBucket: "accelerate-trials.appspot.com",
  messagingSenderId: "719981672998",
  appId: "1:719981672998:web:130f1f5f2a8dbccaed8fca",
  databaseURL: "https://accelerate-trials-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable persistent auth state
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Helper function to check if a user is admin
export const isAdmin = (email: string | null) => {
  return email === 'theranovex@gmail.com' || email === 'digitaltackler@gmail.com';
};

// Helper function to safely get user creation time
const getUserCreationTime = (user: FirebaseUser | null): Date => {
  try {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime);
    }
  } catch (error) {
    console.error('Error getting creation time:', error);
  }
  return new Date();
};

// Setup auth state monitoring
export const initializeAuth = (callback: (user: FirebaseUser | null) => void) => {
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
                  createdAt: docSnap.data().createdAt?.toDate() || new Date()
                };
                localStorage.setItem('userSession', JSON.stringify(freshData));
                callback(freshData as any);
              } else {
                // If document doesn't exist but we have auth, create it
                const defaultData = {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  role: 'partner',
                  active: true,
                  createdAt: serverTimestamp(),
                  subscription: 'basic',
                  maxLeads: 50,
                  currentLeads: 0
                };
                setDoc(doc(db, 'partners', userData.id), defaultData)
                  .then(() => {
                    localStorage.setItem('userSession', JSON.stringify({
                      ...defaultData,
                      createdAt: new Date()
                    }));
                    callback(defaultData as any);
                  })
                  .catch(error => {
                    console.error('Error creating user document:', error);
                    localStorage.removeItem('userSession');
                    callback(null);
                  });
              }
            })
            .catch(error => {
              console.error('Error refreshing user data:', error);
              localStorage.removeItem('userSession');
              callback(null);
            });
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('userSession');
      }
    }

    // Set up auth state listener
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // For admin user
          if (isAdmin(user.email)) {
            const adminData = {
              id: user.uid,
              email: user.email,
              name: 'Admin User',
              role: 'admin',
              createdAt: getUserCreationTime(user),
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
              createdAt: userDoc.data().createdAt?.toDate() || getUserCreationTime(user),
              email: user.email,
              role: 'partner'
            };
            localStorage.setItem('userSession', JSON.stringify(userData));
            callback(userData as any);
          } else {
            // Create default partner document if it doesn't exist
            const defaultData = {
              id: user.uid,
              email: user.email,
              name: user.displayName || 'Partner User',
              role: 'partner',
              active: true,
              createdAt: serverTimestamp(),
              subscription: 'basic',
              maxLeads: 50,
              currentLeads: 0
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
          localStorage.removeItem('userSession');
          callback(null);
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

export async function loginWithEmailAndPassword(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // If admin login
    if (isAdmin(email)) {
      const userData = {
        id: user.uid,
        email: email,
        name: 'Admin User',
        role: 'admin',
        createdAt: getUserCreationTime(user),
        active: true
      };
      localStorage.setItem('userSession', JSON.stringify(userData));
      return userData;
    }

    // For partner login, fetch additional data from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'partners', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = {
        id: user.uid,
        email: user.email,
        name: userDoc.data().name || user.displayName,
        role: userDoc.data().role || 'partner',
        partnerId: user.uid,
        createdAt: userDoc.data().createdAt?.toDate() || getUserCreationTime(user),
        active: userDoc.data().active ?? true,
        subscription: userDoc.data().subscription || 'basic'
      };

      localStorage.setItem('userSession', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Failed to fetch user data');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
}

export async function createPartnerUser(email: string, password: string, name: string, siteName: string) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: name
    });

    // Create partner document in Firestore
    const partnerData = {
      name,
      email,
      siteName,
      role: 'partner',
      active: true,
      createdAt: serverTimestamp(),
      subscription: 'basic',
      maxLeads: 50,
      currentLeads: 0,
      notificationSettings: {
        newLeads: true,
        leadExpiration: true,
        messages: true,
        responseRate: true,
        emailNotifications: true,
        pushNotifications: true
      }
    };

    await setDoc(doc(db, 'partners', user.uid), partnerData);

    // Send welcome notification
    await addDoc(collection(db, 'notifications'), {
      partnerId: user.uid,
      title: 'Welcome to the Patient Referral Portal!',
      message: 'Thank you for joining our network of research sites. To get started, please complete your site profile and review our quick start guide. Our team is here to help you succeed!',
      type: 'welcome',
      read: false,
      createdAt: serverTimestamp(),
      createdBy: 'system'
    });

    // Create session data
    const userData = {
      id: user.uid,
      ...partnerData,
      createdAt: new Date()
    };

    // Store session
    localStorage.setItem('userSession', JSON.stringify(userData));

    return userData;
  } catch (error: any) {
    console.error('Error creating partner:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use');
    }
    throw new Error(error.message || 'Failed to create partner');
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('userSession');
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to logout');
  }
}

export default app;