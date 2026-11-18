import { ref, get, set, update, onValue, type Unsubscribe } from 'firebase/database';
import { firebaseDb } from './config';
import type { UserRole } from '../types/platform';

export interface FirebaseUserProfile {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface FirebaseUserNode {
  profile: FirebaseUserProfile;
  role: UserRole;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt?: string;
}

export async function ensureInitialClientNode(uid: string, profile: FirebaseUserProfile): Promise<void> {
  const userRef = ref(firebaseDb, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    const cleanEmail = (profile.email || '').trim().toLowerCase().slice(0, 180);
    const fallbackName = cleanEmail.split('@')[0] || 'Client User';
    const cleanName = ((profile.name || '').trim() || fallbackName).slice(0, 120);
    const cleanPhone = (profile.phone || '').trim().slice(0, 40);
    const cleanCompany = (profile.company || '').trim().slice(0, 120);
    const now = new Date().toISOString();

    await set(userRef, {
      profile: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        company: cleanCompany,
      },
      role: 'client',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function subscribeToUserNode(
  uid: string,
  onData: (node: FirebaseUserNode | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const userRef = ref(firebaseDb, `users/${uid}`);
  return onValue(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.val() as FirebaseUserNode);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

// Updates ONLY profile metadata; role and status are immutable from client code
export async function updateProfileInRtdb(uid: string, profile: Partial<FirebaseUserProfile>): Promise<void> {
  const profileUpdates: Record<string, string> = {};
  if (profile.name !== undefined) {
    const cleanName = profile.name.trim().slice(0, 120);
    if (cleanName) profileUpdates['profile/name'] = cleanName;
  }
  if (profile.phone !== undefined) profileUpdates['profile/phone'] = profile.phone.trim().slice(0, 40);
  if (profile.company !== undefined) profileUpdates['profile/company'] = profile.company.trim().slice(0, 120);
  profileUpdates['updatedAt'] = new Date().toISOString();

  await update(ref(firebaseDb, `users/${uid}`), profileUpdates);
}
