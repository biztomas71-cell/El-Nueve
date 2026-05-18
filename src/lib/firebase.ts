import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider as RealGoogleAuthProvider, 
  signInWithPopup as realSignInWithPopup, 
  signOut as realSignOut,
  onAuthStateChanged as realOnAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc as realDoc, 
  getDocFromServer, 
  getDoc as realGetDoc, 
  setDoc as realSetDoc, 
  updateDoc as realUpdateDoc, 
  collection as realCollection, 
  query as realQuery, 
  where as realWhere, 
  onSnapshot as realOnSnapshot, 
  addDoc as realAddDoc, 
  deleteDoc as realDeleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { OperationType } from '../types';
import { mockAuth, mockDb, MockGoogleAuthProvider } from './firebaseMock';

// Use environment variables if available, otherwise fallback to the config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const shouldUseMocks = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'MY_API_KEY' || import.meta.env.VITE_USE_MOCKS === 'true';

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

// Initialize Real Firebase if not using mocks
let realApp: any = null;
let realDb: any = null;
let realAuth: any = null;

if (!shouldUseMocks) {
  try {
    realApp = initializeApp(firebaseConfig);
    realDb = getFirestore(realApp, firestoreDatabaseId);
    realAuth = getAuth(realApp);
  } catch (e) {
    console.error("Failed to initialize Firebase:", e);
  }
}

// Exported instances
export const db = shouldUseMocks ? mockDb : realDb;
export const auth = shouldUseMocks ? mockAuth : realAuth;
export const googleProvider = shouldUseMocks ? new MockGoogleAuthProvider() : new RealGoogleAuthProvider();

// Exported functions
export const signInWithPopup = shouldUseMocks ? (mockAuth.signInWithPopup.bind(mockAuth) as any) : realSignInWithPopup;
export const signOut = shouldUseMocks ? (mockAuth.signOut.bind(mockAuth) as any) : realSignOut;
export const onAuthStateChanged = shouldUseMocks ? (mockAuth.onAuthStateChanged.bind(mockAuth) as any) : realOnAuthStateChanged;

export const doc = shouldUseMocks ? (mockDb.doc.bind(mockDb) as any) : realDoc;
export const getDoc = shouldUseMocks ? (mockDb.getDoc.bind(mockDb) as any) : realGetDoc;
export const setDoc = shouldUseMocks ? (mockDb.setDoc.bind(mockDb) as any) : realSetDoc;
export const updateDoc = shouldUseMocks ? (mockDb.updateDoc.bind(mockDb) as any) : realUpdateDoc;
export const collection = shouldUseMocks ? (mockDb.collection.bind(mockDb) as any) : realCollection;
export const query = shouldUseMocks ? (mockDb.query.bind(mockDb) as any) : realQuery;
export const where = shouldUseMocks ? (mockDb.where.bind(mockDb) as any) : realWhere;
export const onSnapshot = shouldUseMocks ? (mockDb.onSnapshot.bind(mockDb) as any) : realOnSnapshot;
export const addDoc = shouldUseMocks ? (mockDb.addDoc.bind(mockDb) as any) : realAddDoc;
export const deleteDoc = shouldUseMocks ? (mockDb.deleteDoc.bind(mockDb) as any) : realDeleteDoc;

export { Timestamp };

// Validation test
async function testConnection() {
  if (shouldUseMocks) {
    console.log("🚀 Running in Mock Firebase mode (Local Storage)");
    return;
  }
  try {
    if (realDb) {
      await getDocFromServer(realDoc(realDb, 'test', 'connection'));
    }
  } catch (error: any) {
    console.warn("Firebase connection warning:", error.message);
  }
}
testConnection();

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  if (shouldUseMocks) return; // Silent in mock mode
  console.error(`Firestore Error [${operationType}] at [${path}]:`, error);
}
