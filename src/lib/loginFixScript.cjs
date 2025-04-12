const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAS20kFBkbKnE0a-3K7zbTuXI-LlvUaO4Q',
  authDomain: 'accelerate-trials.firebaseapp.com',
  projectId: 'accelerate-trials',
  storageBucket: 'accelerate-trials.appspot.com',
  messagingSenderId: '719981672998',
  appId: '1:719981672998:web:130f1f5f2a8dbccaed8fca',
  databaseURL: 'https://accelerate-trials-default-rtdb.firebaseio.com'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function verifyUserAuth() {
  try {
    // Try to sign in with correct credentials
    console.log('Attempting to authenticate with credentials...');
    const credentials = await signInWithEmailAndPassword(auth, 'digitaltackler@gmail.com', 'BlessedYear2025!');
    const user = credentials.user;
    
    console.log('✅ Authentication successful for:', user.email);
    console.log('User UID:', user.uid);
    
    // Check if user has a document in Firestore
    const userDoc = await getDoc(doc(db, 'partners', user.uid));
    console.log('User document exists in Firestore:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User role:', userData.role);
      console.log('Is admin by email:', userData.email === 'digitaltackler@gmail.com' || userData.email === 'theranovex@gmail.com');
    }
    
    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    // Try alternate password if first attempt fails
    try {
      console.log('Attempting with alternate credentials...');
      const credentials = await signInWithEmailAndPassword(auth, 'digitaltackler@gmail.com', 'Blessed2020!');
      const user = credentials.user;
      
      console.log('✅ Authentication successful with alternate credentials for:', user.email);
      console.log('User UID:', user.uid);
      
      // Check if user has a document in Firestore
      const userDoc = await getDoc(doc(db, 'partners', user.uid));
      console.log('User document exists in Firestore:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User role:', userData.role);
        console.log('Is admin by email:', userData.email === 'digitaltackler@gmail.com' || userData.email === 'theranovex@gmail.com');
      }
      
      return {
        success: true,
        user: user
      };
    } catch (alternateError) {
      console.error('❌ Authentication with alternate credentials also failed:', alternateError.message);
      return {
        success: false,
        error: alternateError
      };
    }
  }
}

module.exports = { verifyUserAuth };