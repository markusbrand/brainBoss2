import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

let currentUser: User | null = null;
let authInitPromise: Promise<User | null> | null = null;

export const initFirebaseAuth = (): Promise<User | null> => {
  if (currentUser) return Promise.resolve(currentUser);
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          resolve(cred.user);
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign-in note:', err);
          resolve(null);
        }
      }
    });
  });

  return authInitPromise;
};

// Unique Family/Device ID for partitioning data across users/families
export const getFamilySyncKey = (): string => {
  if (typeof window === 'undefined') return 'default_family';
  let key = localStorage.getItem('brainboss_family_cloud_id');
  if (!key) {
    key = 'family_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('brainboss_family_cloud_id', key);
  }
  return key;
};
