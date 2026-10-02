import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
const DIRECT_PARENT_SESSION_KEY = 'brainboss_direct_parent_session';

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
 * Direct Local Parent Session (100% In-Page, zero popups or external blockers)
 */
export const getDirectParentSession = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(DIRECT_PARENT_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentProfile = parsed;
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

export const setDirectParentSession = (profile: UserProfile | null) => {
  if (!profile) {
    localStorage.removeItem(DIRECT_PARENT_SESSION_KEY);
    if (currentProfile?.uid.startsWith('local_parent_')) {
      currentProfile = null;
    }
  } else {
    localStorage.setItem(DIRECT_PARENT_SESSION_KEY, JSON.stringify(profile));
    currentProfile = profile;
  }
};

export const loginAsDirectParent = async (
  email: string = 'mbrandstaetter48@gmail.com',
  name?: string
): Promise<UserProfile> => {
  setSavedChildSession(null);
  const cleanEmail = (email || 'parent@brainboss.app').toLowerCase().trim();
  const isSuperAdmin = Boolean(
    (SUPER_ADMIN_EMAIL && cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) ||
    cleanEmail === 'mbrandstaetter48@gmail.com'
  );

  const uid = 'local_parent_' + cleanEmail.replace(/[^a-z0-9]/gi, '_');
  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    displayName: name || cleanEmail.split('@')[0] || (isSuperAdmin ? 'Super Administrator' : 'Elternteil'),
    role: isSuperAdmin ? 'super_admin' : 'parent',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  setDirectParentSession(profile);

  // Try to sync to Firestore if permitted
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, profile, { merge: true });
    if (cleanEmail) {
      await setDoc(doc(db, 'authorized_users', cleanEmail), {
        email: cleanEmail,
        role: profile.role,
        displayName: profile.displayName,
        addedBy: isSuperAdmin ? 'system_root' : 'self_registered',
        createdAt: profile.createdAt,
        lastLoginAt: profile.lastLoginAt,
      }, { merge: true });
    }
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firebase] Local parent Firestore sync notice:', err);
    }
  }

  return profile;
};

/**
 * Ensures user profile exists in Firestore and assigns proper role.
 * Designated administrator email or existing super_admin status grants root privileges.
 */
export const syncUserProfile = async (user: User | { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<UserProfile> => {
  const email = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = Boolean(
    (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL.toLowerCase()) ||
    email === 'mbrandstaetter48@gmail.com'
  );

  const userDocRef = doc(db, 'users', user.uid);
  let existingData: Partial<UserProfile> = {};
  let role: UserRole = isSuperAdmin ? 'super_admin' : 'parent';
  let status: 'active' | 'pending' | 'disabled' = 'active';

  try {
    const snap = await getDoc(userDocRef);
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
  } catch (err) {
    console.warn('[Firebase] User profile fetch notice:', err);
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
  setDirectParentSession(profile);
  return profile;
};

/**
 * Sign In with Email & Password (Zero popups, direct in-page)
 */
export const signInWithEmail = async (email: string, pass: string): Promise<{ user: User; profile: UserProfile }> => {
  setSavedChildSession(null);
  const cleanEmail = email.trim();
  const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  currentUser = result.user;
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

/**
 * Register with Email & Password (Zero popups, direct in-page)
 */
export const registerWithEmail = async (
  email: string,
  pass: string,
  displayName?: string
): Promise<{ user: User; profile: UserProfile }> => {
  setSavedChildSession(null);
  const cleanEmail = email.trim();
  const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  if (displayName && result.user) {
    try {
      await updateProfile(result.user, { displayName });
    } catch {
      // ignore
    }
  }
  currentUser = result.user;
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

/**
 * Sign In with Google Popup
 */
export const signInWithGoogle = async (): Promise<{ user: User; profile: UserProfile }> => {
  setSavedChildSession(null);
  const result = await signInWithPopup(auth, googleProvider);
  currentUser = result.user;
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

/**
 * Sign In with Google Redirect (Alternative when popup is blocked)
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  setSavedChildSession(null);
  await signInWithRedirect(auth, googleProvider);
};

/**
 * Check for pending redirect result on app initialization
 */
export const handleRedirectAuthResult = async (): Promise<{ user: User; profile: UserProfile } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      currentUser = result.user;
      const profile = await syncUserProfile(result.user);
      return { user: result.user, profile };
    }
  } catch (err) {
    console.warn('Redirect auth result check notice:', err);
  }
  return null;
};

/**
 * Sign out completely
 */
export const logOut = async (): Promise<void> => {
  setSavedChildSession(null);
  setDirectParentSession(null);
  currentUser = null;
  currentProfile = null;
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Sign out notice:', e);
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const initFirebaseAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    // Also check redirect result first
    handleRedirectAuthResult().catch(() => {});

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
  if (currentProfile?.uid) {
    return `user_${currentProfile.uid}`;
  }
  const directSession = getDirectParentSession();
  if (directSession?.uid) {
    return `user_${directSession.uid}`;
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

