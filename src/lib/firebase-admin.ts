import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Get environment variables
const serviceAccount = {
  "type": "service_account",
  "project_id": "accelerate-trials",
  "private_key_id": "8cdad3e7beb172867760ef1ba4edf8fe2db8e9c5",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyMpjc2I0YHeFo\nw9ESdA9Hf0pl910M5WWGFnZl3BgR2vh5rHPqGa13/k6vDvnb+xbcjlY+/yVXMmlK\nwmSr/AIRr9X/dFnT5vJrI9uPZYGfAXtxJ88zD4YHftLkFQqG31jM6WQYGDk5EDpy\n3hS8ezHcyXjcYRydFR1eQk4Ufz7qrjLa/DoUTy4MIgfQkznwlbrMj/A6XVpVjPhV\nVpvvAlfLSWpA/Hjar7ExEbcFUKEJD+2yrhngIjxhlGzC3TvjpjgHuJolgJJXhmQP\nrse0wREo4ZD3Xn1GxSaJD5p57/aqaINdiE6i7b7i6erS9UQ1CS1qF1PxEtOkhztH\nq9EUwZBVAgMBAAECggEAIbkOkbjPltFMz6lDHzVkkNjHiR1zeBXPjT0iAevRiEuC\nu3AF7bcXS36OgHWalmVhsbKkIr7hX6uUHohESgHimFtI6dOojkAF/32lNvF0QtWi\neUsZ3KVi7Xc0TOKof9aztO+0OBUZezGVhhh+Hx9HU+uy2i3sntOYn7Z3lUxxaTLl\n04jbIW/XlI+et5RiFUMHbprvJ+0mZOJ0ezaMVh+XGWs72WFi4Y8R3QRhb3Jq2yw6\n6RNmnVE2TpIhEpthk9fTrpKuf0UQ0J5UJwEtB+qSGJcLI5KifxjHLyI/3ESjaBed\nXSa7MQwjJlHE92IkIHdyzvd82L/KiGHaozUOwsqxMQKBgQDw0AtBTD1Bnf7W2rDO\n79ak8OSB6K/+f6NknRopwmPi1981fsSgpz8XoCJpSsxMNmINIEl8SLqQeqEQTov1\nPDXeCibB1yjX7ZPrCdxaNHojFnpOnJ5bft5BG4tfMQbIuYnDiiYjvdSrPeagXM+t\nFIQY3Jo4nNhSpR5so/c3W+Gl6QKBgQC9b5/UIJwyf4NXc6srQrEt/rXj+cLHCK6b\nxCU2qanlzilLgLA882bzqY3w5jTmBSz2T5JaJHgZYvFDXEBDlZDUYiVSzREabpai\nphUOYAiimuY/i3+4ZLoBrUSDT6u6Q5QCWJ6BIzh3tonqd6bC8hYbzKeEfXIdgSaX\nJ7tJ7/9XjQKBgQCiIbAyOn5Tm2hkh8Da0qeVTYrL3DoCAzWjHBLtYq+VnvntLnh8\nIZ5c7be9ZFrARS0m4UIYp27Ur3uZWwjoB63M3NDTWWVqW85nRLBTG1nQHeYi31fP\nCk/hTgY8BOooYqLaQD0Fe12gHYEVHufEBDgb9QrwaslKe1lMk+hyIS5/YQKBgCDT\n4DGleQvzNvKHs+jqRMQAuMqJ9KwDICcUJZLEchHF2TghU+ksEPI2tsdBTXdy/Ciu\n/2CpozpbAA45RVWw7IkxfOBNcyJOecIz38A++iAbkbz/UqHEqssxmIbc3piHr3V8\nn/MnBFkSg/HizD5KL3Sf0YPPLWBZijN1iio08d3dAoGBAOBujtcfB6nspjuJUUEO\nIJ91HeqtyZQmHG0brWJlKGfiS4XA02CfJZYAVRwvm4/k9l3Izrz2awBJkOqlVaMC\nyeAFJxHiL4erMUm/AbMWOonMgZdIZM3eLCfLuK5pd+iTewrXGVYLEkYQB+69O8OO\no5zw9N5Dk1POgLZCGLgYCFjl\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@accelerate-trials.iam.gserviceaccount.com",
  "client_id": "104828753468107148582",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40accelerate-trials.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://accelerate-trials-default-rtdb.firebaseio.com"
});

// Get Firestore and Auth instances
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

export default app;