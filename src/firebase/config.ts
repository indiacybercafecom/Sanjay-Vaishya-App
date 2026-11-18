import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAZ3sz4X5m7TGPdTwpbZEnqC5wMahYDmdc',
  authDomain: 'sanjay-vaishya-app.firebaseapp.com',
  databaseURL: 'https://sanjay-vaishya-app-default-rtdb.firebaseio.com',
  projectId: 'sanjay-vaishya-app',
  storageBucket: 'sanjay-vaishya-app.firebasestorage.app',
  messagingSenderId: '899151507181',
  appId: '1:899151507181:web:bc34a5a8b2f2e5b949e6e4',
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getDatabase(firebaseApp);

setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
  // Ignore persistence configuration errors in restricted private browsing modes
});
