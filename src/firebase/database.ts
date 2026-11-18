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
    await set(userRef, {
      profile: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        company: profile.company || '',
      },
      role: 'client',
      status: 'active',
      createdAt: new Date().toISOString(),
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
  if (profile.name !== undefined) profileUpdates['profile/name'] = profile.name;
  if (profile.phone !== undefined) profileUpdates['profile/phone'] = profile.phone;
  if (profile.company !== undefined) profileUpdates['profile/company'] = profile.company;
  profileUpdates['updatedAt'] = new Date().toISOString();

  await update(ref(firebaseDb, `users/${uid}`), profileUpdates);
}
