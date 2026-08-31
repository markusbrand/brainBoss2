import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser: User | null = null;
let currentProfile: UserProfile | null = null;

// Local Child Session key for kids logging in on device
const CHILD_SESSION_KEY = 'brainboss_active_child_session';

export interface ChildSession {
  kidId: string;
  kidName: string;
  parentUid: string;
  avatar: string;
  schoolGrade?: number;
  schoolClass?: string;
  loginCode?: string;
  token: string;
}

export const getSavedChildSession = (): ChildSession | null => {
  try {
    const raw = localStorage.getItem(CHILD_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse child session:', e);
  }
  return null;
};

export const setSavedChildSession = (session: ChildSession | null) => {
  if (!session) {
    localStorage.removeItem(CHILD_SESSION_KEY);
  } else {
    localStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(session));
  }
};

/**
 * Ensures user profile exists in Firestore and assigns proper role.
 * Designated administrator email or existing super_admin status grants root privileges.
 */
export const syncUserProfile = async (user: User): Promise<UserProfile> => {
  const email = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = Boolean(SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL.toLowerCase());

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  let role: UserRole = isSuperAdmin ? 'super_admin' : 'parent';
  let status: 'active' | 'pending' | 'disabled' = 'active';
  let existingData: Partial<UserProfile> = {};

  if (snap.exists()) {
    existingData = snap.data() as Partial<UserProfile>;
    if (isSuperAdmin) {
      role = 'super_admin';
    } else if (existingData.role) {
      role = existingData.role;
    }
  } else {
    // Check if email is listed in authorized_users whitelist
    try {
      const authSnap = await getDoc(doc(db, 'authorized_users', email));
      if (authSnap.exists()) {
        const authData = authSnap.data();
        if (authData.role) role = authData.role;
      }
    } catch {
      // Proceed with standard parent role
    }
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || undefined,
    role,
    status,
    createdAt: existingData.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    assignedKidIds: existingData.assignedKidIds || [],
    parentUid: existingData.parentUid,
  };

  try {
    await setDoc(userDocRef, profile, { merge: true });
    // Also save in authorized_users for super admin visibility
    if (user.email) {
      await setDoc(doc(db, 'authorized_users', email), {
        email,
        role: profile.role,
        displayName: profile.displayName,
        addedBy: isSuperAdmin ? 'system_root' : 'self_registered',
        createdAt: profile.createdAt,
        lastLoginAt: profile.lastLoginAt,
      }, { merge: true });
    }
  } catch (err) {
    console.warn('[Firebase] Could not persist user profile to cloud Firestore:', err);
  }

  currentProfile = profile;
  return profile;
};

/**
 * Sign In with Google Popup
 */
export const signInWithGoogle = async (): Promise<{ user: User; profile: UserProfile }> => {
  // Clear any existing child session
  setSavedChildSession(null);
  const result = await signInWithPopup(auth, googleProvider);
  currentUser = result.user;
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

/**
 * Sign out completely
 */
export const logOut = async (): Promise<void> => {
  setSavedChildSession(null);
  currentUser = null;
  currentProfile = null;
  await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const initFirebaseAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        try {
          await syncUserProfile(user);
        } catch (e) {
          console.warn('Sync profile on init warning:', e);
        }
        resolve(user);
      } else {
        resolve(null);
      }
      unsub();
    });
  });
};

// Unique Family/User ID for partitioning data across parents/admins
export const getFamilySyncKey = (): string => {
  if (currentUser) {
    return `user_${currentUser.uid}`;
  }
  const childSession = getSavedChildSession();
  if (childSession && childSession.parentUid) {
    return `user_${childSession.parentUid}`;
  }
  if (typeof window === 'undefined') return 'default_family';
  let key = localStorage.getItem('brainboss_family_cloud_id');
  if (!key) {
    key = 'family_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('brainboss_family_cloud_id', key);
  }
  return key;
};

