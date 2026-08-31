import {
  ChildShareInvite,
  FamilyGroup,
  FamilyMember,
  KidProfile,
  ParentConfig,
  UserProfile,
} from '../types';
import { db, initFirebaseAuth, SUPER_ADMIN_EMAIL } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import { loadParentConfig, saveParentConfig } from './storage';

const FAMILY_CODE_PREFIX = 'FAM';
const CHILD_CODE_PREFIX = 'KID';

/**
 * Generate a clean, human-readable Family Join Code (e.g. FAM-84920)
 */
export const generateFamilyCode = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${FAMILY_CODE_PREFIX}-${num}`;
};

/**
 * Generate a clean Child Share Code (e.g. KID-FELIX-7821)
 */
export const generateChildCode = (kidName: string): string => {
  const sanitized = (kidName || 'LEARNER')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${CHILD_CODE_PREFIX}-${sanitized || 'BRAIN'}-${num}`;
};

/**
 * Ensures the parent config has a valid family ID, share code, and family name
 */
export const initializeFamilyConfig = (
  config: ParentConfig,
  userProfile?: UserProfile | null
): ParentConfig => {
  let updated = false;
  const next = { ...config };

  if (!next.familyId) {
    const seed = userProfile?.uid || Math.random().toString(36).substring(2, 10);
    next.familyId = `fam_${seed}`;
    updated = true;
  }

  if (!next.familyShareCode) {
    next.familyShareCode = generateFamilyCode();
    updated = true;
  }

  if (!next.familyName) {
    const parentName = userProfile?.displayName || userProfile?.email?.split('@')[0];
    next.familyName = parentName ? `Familie ${parentName}` : 'Familienkreis BrainBoss';
    updated = true;
  }

  if (!Array.isArray(next.familyMembers) || next.familyMembers.length === 0) {
    const ownerEmail = userProfile?.email || next.ownerEmail || (SUPER_ADMIN_EMAIL || 'eltern@brainboss.app');
    const ownerName = userProfile?.displayName || ownerEmail.split('@')[0] || 'Haupt-Elternteil';
    next.familyMembers = [
      {
        email: ownerEmail,
        displayName: ownerName,
        role: 'owner',
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    ];
    updated = true;
  }

  if (updated) {
    saveParentConfig(next);
  }

  return next;
};

/**
 * Publish / Synchronize active family state to Firebase Firestore
 */
export const publishFamilyToCloud = async (
  config: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; familyGroup?: FamilyGroup; error?: string }> => {
  try {
    await initFirebaseAuth();
    const familyConfig = initializeFamilyConfig(config, userProfile);

    const familyId = familyConfig.familyId!;
    const shareCode = familyConfig.familyShareCode!;
    const ownerEmail = userProfile?.email || familyConfig.ownerEmail || familyConfig.familyMembers?.[0]?.email || '';

    const familyGroup: FamilyGroup = {
      familyId,
      shareCode,
      name: familyConfig.familyName || 'Familienkreis',
      ownerUid: userProfile?.uid || familyConfig.ownerUid || 'local_owner',
      ownerEmail,
      members: familyConfig.familyMembers || [],
      kids: familyConfig.kids || [],
      tasks: familyConfig.tasks || [],
      tests: familyConfig.tests || [],
      testSubmissions: familyConfig.testSubmissions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save family document
    const familyDocRef = doc(db, 'family_shares', familyId);
    await setDoc(familyDocRef, familyGroup, { merge: true });

    // 2. Save invite lookup code
    const inviteDocRef = doc(db, 'family_invites', shareCode.toUpperCase().trim());
    await setDoc(inviteDocRef, {
      code: shareCode.toUpperCase().trim(),
      familyId,
      familyName: familyGroup.name,
      ownerEmail,
      ownerName: userProfile?.displayName || ownerEmail.split('@')[0] || 'Elternteil',
      createdAt: familyGroup.createdAt,
      updatedAt: familyGroup.updatedAt,
    }, { merge: true });

    return { success: true, familyGroup };
  } catch (err: any) {
    console.warn('[FamilySharing] Firestore push note:', err);
    return { success: false, error: err?.message || 'Konnte Familienkreis nicht synchronisieren.' };
  }
};

/**
 * Create a direct Share Code for an individual child (e.g. for grandparents or tutor)
 */
export const createChildShareCode = async (
  kid: KidProfile,
  config: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; code: string; invite?: ChildShareInvite; error?: string }> => {
  try {
    await initFirebaseAuth();
    const familyConfig = initializeFamilyConfig(config, userProfile);
    const code = generateChildCode(kid.name);
    const ownerEmail = userProfile?.email || familyConfig.ownerEmail || '';
    const ownerName = userProfile?.displayName || ownerEmail.split('@')[0] || 'Elternteil';

    const childInvite: ChildShareInvite = {
      code,
      kidId: kid.id,
      kidName: kid.name,
      kidAvatar: kid.avatar,
      schoolGrade: kid.schoolGrade,
      gradeLevel: kid.gradeLevel,
      familyId: familyConfig.familyId!,
      familyName: familyConfig.familyName || 'Familie',
      ownerEmail,
      ownerName,
      fullProfile: kid,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore /child_shares
    const childDocRef = doc(db, 'child_shares', code);
    await setDoc(childDocRef, childInvite, { merge: true });

    return { success: true, code, invite: childInvite };
  } catch (err: any) {
    console.warn('[FamilySharing] createChildShareCode error:', err);
    // Fallback: Return generated code even if offline
    const code = generateChildCode(kid.name);
    return { success: true, code };
  }
};

export type CodeLookupResult =
  | { type: 'family'; family: FamilyGroup; inviteCode: string }
  | { type: 'child'; childInvite: ChildShareInvite; shareCode: string }
  | { type: 'not_found'; message: string };

/**
 * Look up a code (Family Code or Child Share Code)
 */
export const lookupShareCode = async (rawCode: string): Promise<CodeLookupResult> => {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { type: 'not_found', message: 'Bitte gib einen gültigen Code ein.' };
  }

  await initFirebaseAuth();

  // 1. Check if it's a Child Share Code (KID-...)
  if (cleanCode.startsWith(CHILD_CODE_PREFIX)) {
    try {
      const childSnap = await getDoc(doc(db, 'child_shares', cleanCode));
      if (childSnap.exists()) {
        const invite = childSnap.data() as ChildShareInvite;
        return { type: 'child', childInvite: invite, shareCode: cleanCode };
      }
    } catch (e) {
      console.warn('[FamilySharing] Child code check:', e);
    }
  }

  // 2. Check if it's a Family Invite Code (FAM-...)
  try {
    const inviteSnap = await getDoc(doc(db, 'family_invites', cleanCode));
    if (inviteSnap.exists()) {
      const inviteData = inviteSnap.data();
      const familyId = inviteData.familyId;
      if (familyId) {
        const familySnap = await getDoc(doc(db, 'family_shares', familyId));
        if (familySnap.exists()) {
          const family = familySnap.data() as FamilyGroup;
          return { type: 'family', family, inviteCode: cleanCode };
        }
      }
    }

    // Direct match on familyId
    const directFamilySnap = await getDoc(doc(db, 'family_shares', cleanCode));
    if (directFamilySnap.exists()) {
      const family = directFamilySnap.data() as FamilyGroup;
      return { type: 'family', family, inviteCode: cleanCode };
    }
  } catch (e) {
    console.warn('[FamilySharing] Family code check:', e);
  }

  // Check fallback locally if offline / local mock
  const current = loadParentConfig();
  if (current.familyShareCode?.toUpperCase() === cleanCode) {
    const localFamily: FamilyGroup = {
      familyId: current.familyId || 'local_fam',
      shareCode: cleanCode,
      name: current.familyName || 'Lokale Familie',
      ownerUid: 'local',
      ownerEmail: current.ownerEmail || 'lokal@brainboss.app',
      members: current.familyMembers || [],
      kids: current.kids || [],
      tasks: current.tasks || [],
      tests: current.tests || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { type: 'family', family: localFamily, inviteCode: cleanCode };
  }

  return {
    type: 'not_found',
    message: `Kein Familienkreis oder Kind-Freigabecode unter "${cleanCode}" gefunden. Bitte überprüfe die Schreibweise (z. B. FAM-84920 oder KID-FELIX-1049).`,
  };
};

/**
 * Join an existing family: synchronizes all child profiles, tasks, tests, and links parents
 */
export const joinFamilyWithCode = async (
  code: string,
  currentConfig: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; updatedConfig?: ParentConfig; message: string }> => {
  const result = await lookupShareCode(code);

  if (result.type === 'not_found') {
    return { success: false, message: result.message };
  }

  if (result.type === 'child') {
    // Import single child into this parent's family
    return importSingleChildFromInvite(result.childInvite, currentConfig, userProfile);
  }

  const targetFamily = result.family;
  const currentUserEmail = userProfile?.email || currentConfig.ownerEmail || 'eltern_partner@brainboss.app';
  const currentUserName = userProfile?.displayName || currentUserEmail.split('@')[0] || 'Mit-Elternteil';

  // Merge Kids: combine target family's kids with any unique local kids
  const mergedKidsMap = new Map<string, KidProfile>();

  // 1. Add target family's kids
  (targetFamily.kids || []).forEach((k) => {
    mergedKidsMap.set(k.id, k);
  });

  // 2. Add local kids if they aren't duplicates
  (currentConfig.kids || []).forEach((localKid) => {
    if (!mergedKidsMap.has(localKid.id)) {
      // Check if matching name already exists
      const existingWithName = Array.from(mergedKidsMap.values()).find(
        (k) => k.name.toLowerCase() === localKid.name.toLowerCase()
      );
      if (!existingWithName) {
        mergedKidsMap.set(localKid.id, localKid);
      }
    }
  });

  const mergedKids = Array.from(mergedKidsMap.values());

  // Merge Members
  const membersMap = new Map<string, FamilyMember>();
  (targetFamily.members || []).forEach((m) => {
    membersMap.set(m.email.toLowerCase(), m);
  });

  // Add current user as coparent if not already present
  if (!membersMap.has(currentUserEmail.toLowerCase())) {
    membersMap.set(currentUserEmail.toLowerCase(), {
      email: currentUserEmail,
      displayName: currentUserName,
      role: 'coparent',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }

  const mergedMembers = Array.from(membersMap.values());

  // Merge tasks and tests
  const mergedTasks = [...(targetFamily.tasks || [])];
  (currentConfig.tasks || []).forEach((lt) => {
    if (!mergedTasks.some((t) => t.id === lt.id)) {
      mergedTasks.push(lt);
    }
  });

  const mergedTests = [...(targetFamily.tests || [])];
  (currentConfig.tests || []).forEach((lt) => {
    if (!mergedTests.some((t) => t.id === lt.id)) {
      mergedTests.push(lt);
    }
  });

  const updatedConfig: ParentConfig = {
    ...currentConfig,
    familyId: targetFamily.familyId,
    familyName: targetFamily.name || currentConfig.familyName,
    familyShareCode: targetFamily.shareCode || currentConfig.familyShareCode,
    familyMembers: mergedMembers,
    kids: mergedKids.length > 0 ? mergedKids : currentConfig.kids,
    activeKidId: mergedKids[0]?.id || currentConfig.activeKidId,
    tasks: mergedTasks,
    tests: mergedTests,
  };

  saveParentConfig(updatedConfig);
  await publishFamilyToCloud(updatedConfig, userProfile);

  return {
    success: true,
    updatedConfig,
    message: `Erfolgreich dem Familienkreis "${targetFamily.name}" beigetreten! Alle ${mergedKids.length} Kinderprofile wurden synchronisiert.`,
  };
};

/**
 * Import single child from invite
 */
export const importSingleChildFromInvite = async (
  invite: ChildShareInvite,
  currentConfig: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; updatedConfig?: ParentConfig; message: string }> => {
  const kidToAdd = invite.fullProfile || {
    id: invite.kidId,
    name: invite.kidName,
    avatar: invite.kidAvatar,
    schoolGrade: invite.schoolGrade || 2,
    gradeLevel: invite.gradeLevel || 'primary',
  };

  // Check if kid with same ID exists
  const existingIdx = currentConfig.kids.findIndex((k) => k.id === kidToAdd.id || k.name.toLowerCase() === kidToAdd.name.toLowerCase());
  let updatedKids: KidProfile[];

  if (existingIdx >= 0) {
    updatedKids = [...currentConfig.kids];
    updatedKids[existingIdx] = { ...updatedKids[existingIdx], ...kidToAdd };
  } else {
    updatedKids = [...currentConfig.kids, kidToAdd as KidProfile];
  }

  const updatedConfig: ParentConfig = {
    ...currentConfig,
    kids: updatedKids,
  };

  saveParentConfig(updatedConfig);
  await publishFamilyToCloud(updatedConfig, userProfile);

  return {
    success: true,
    updatedConfig,
    message: `Kind "${kidToAdd.name}" wurde erfolgreich als Profil importiert und mit deiner Zentrale verbunden!`,
  };
};

/**
 * Add a co-parent or tutor to this family circle by email
 */
export const inviteCoParent = async (
  email: string,
  displayName: string,
  role: 'coparent' | 'tutor',
  config: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; updatedConfig: ParentConfig; message: string }> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, updatedConfig: config, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
  }

  const familyConfig = initializeFamilyConfig(config, userProfile);
  const currentMembers = familyConfig.familyMembers || [];

  const existingIdx = currentMembers.findIndex((m) => m.email.toLowerCase() === cleanEmail);
  const newMember: FamilyMember = {
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    role,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  let updatedMembers: FamilyMember[];
  if (existingIdx >= 0) {
    updatedMembers = [...currentMembers];
    updatedMembers[existingIdx] = { ...updatedMembers[existingIdx], ...newMember };
  } else {
    updatedMembers = [...currentMembers, newMember];
  }

  const updatedConfig: ParentConfig = {
    ...familyConfig,
    familyMembers: updatedMembers,
  };

  saveParentConfig(updatedConfig);

  // Also whitelist in authorized_users so the invited co-parent gets approved parent login
  try {
    await setDoc(doc(db, 'authorized_users', cleanEmail), {
      email: cleanEmail,
      role: 'parent',
      displayName: newMember.displayName,
      addedBy: userProfile?.email || familyConfig.ownerEmail || 'family_owner',
      createdAt: new Date().toISOString(),
      notes: `Eingeladenes Familienmitglied (${role === 'coparent' ? 'Mit-Elternteil' : 'Lehrkraft'}) in "${familyConfig.familyName}"`,
    }, { merge: true });
  } catch (e) {
    console.warn('[FamilySharing] Whitelist authorized user note:', e);
  }

  await publishFamilyToCloud(updatedConfig, userProfile);

  return {
    success: true,
    updatedConfig,
    message: `${newMember.displayName} (${cleanEmail}) wurde als ${role === 'coparent' ? 'Mit-Elternteil' : 'Lehrkraft / Nachhilfe'} zum Familienkreis hinzugefügt!`,
  };
};

/**
 * Remove a co-parent from the family circle
 */
export const removeCoParentMember = async (
  email: string,
  config: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; updatedConfig: ParentConfig }> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const currentMembers = config.familyMembers || [];
  const updatedMembers = currentMembers.filter((m) => m.email.toLowerCase() !== cleanEmail);

  const updatedConfig: ParentConfig = {
    ...config,
    familyMembers: updatedMembers,
  };

  saveParentConfig(updatedConfig);
  await publishFamilyToCloud(updatedConfig, userProfile);

  return { success: true, updatedConfig };
};

/**
 * Update the display name of the family circle
 */
export const updateFamilyCircleName = async (
  newName: string,
  config: ParentConfig,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; updatedConfig: ParentConfig }> => {
  const name = (newName || '').trim() || 'Familienkreis';
  const updatedConfig: ParentConfig = {
    ...config,
    familyName: name,
  };

  saveParentConfig(updatedConfig);
  await publishFamilyToCloud(updatedConfig, userProfile);

  return { success: true, updatedConfig };
};
