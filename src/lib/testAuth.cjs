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

async function testAuth() {
  // List of passwords to try
  const passwordsToTry = [
    'BlessedYear2025!',
    'Blessed2020!',
    'Admin123!',
    'Digitaltackler123!',
    'Admin123'
  ];
  
  let successful = false;
  
  for (const password of passwordsToTry) {
    try {
      console.log(`Trying password: ${password}`);
      const result = await signInWithEmailAndPassword(auth, 'digitaltackler@gmail.com', password);
      console.log(`✅ SUCCESS! Password "${password}" worked!`);
      console.log('User UID:', result.user.uid);
      
      // Check Firestore document
      const userDoc = await getDoc(doc(db, 'partners', result.user.uid));
      console.log('User document exists:', userDoc.exists());
      if (userDoc.exists()) {
        console.log('User data:', userDoc.data());
      }
      
      successful = true;
      break;
    } catch (error) {
      console.log(`❌ Password "${password}" failed:`, error.message);
    }
  }
  
  if (!successful) {
    console.log('❌ All password attempts failed.');
  }
  
  return { success: successful };
}

// Run the test
testAuth()
  .then(result => {
    console.log('Test completed:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });