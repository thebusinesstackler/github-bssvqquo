import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
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
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to Functions emulator when in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

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

// Create partner user
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
        plan: 'basic',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 99,
        paymentMethod: {
          type: 'credit_card',
          last4: ''
        }
      },
      siteDetails: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        principalInvestigator: '',
        studyCoordinator: '',
        specialties: [],
        certifications: [],
        capacity: {
          maxPatients: 200,
          currentPatients: 0,
          studyRooms: 8,
          staff: 15
        }
      }
    };

    await setDoc(doc(db, 'partners', user.uid), partnerData);

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

// Login with email and password
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
        name: userDoc.data().name,
        firstName: userDoc.data().firstName,
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

// Upload profile picture
export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  if (!file || !userId) throw new Error('File and user ID are required');
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Validate file type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Only JPG and PNG files are allowed');
  }

  const fileExtension = file.type === 'image/jpeg' ? 'jpg' : 'png';
  const fileName = `profile-pictures/${userId}.${fileExtension}`;
  const fileRef = storageRef(storage, fileName);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture');
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const userRef = doc(db, 'partners', userId);
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

// Setup auth state monitoring
export const initializeAuth = (callback: (user: FirebaseUser | null) => void) => {
  try {
    // Set up auth state listener
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        localStorage.removeItem('userSession');
        localStorage.removeItem('impersonatedUser');
        return;
      }

      // Try to restore session from localStorage first
      const storedSession = localStorage.getItem('userSession');
      const storedImpersonation = localStorage.getItem('impersonatedUser');
      
      try {
        if (storedSession) {
          const userData = JSON.parse(storedSession);
          const impersonatedData = storedImpersonation ? JSON.parse(storedImpersonation) : null;
          callback(userData as any);
        } else {
          // User is already authenticated, update the store
          const userData = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: (user.email === 'theranovex@gmail.com' || user.email === 'digitaltackler@gmail.com') ? 'admin' : 'partner',
            createdAt: getUserCreationTime(user),
            active: true
          };

          callback(userData as any);
          localStorage.setItem('userSession', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('userSession');
        localStorage.removeItem('impersonatedUser');
      }
    });
  } catch (error) {
    console.error('Error in initializeAuth:', error);
    callback(null);
    return () => {};
  }
};

export default app;