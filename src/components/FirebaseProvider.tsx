import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, handleFirestoreError } from '../lib/firebase';
import { ClubUser, OperationType } from '../types';

interface FirebaseContextType {
  user: User | null;
  profile: ClubUser | null;
  loading: boolean;
  isAdmin: boolean;
  isCoach: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isCoach: false,
});

export const useFirebase = () => useContext(FirebaseContext);

const BYPASS_AUTH = false; // Set to false to re-enable real authentication

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as ClubUser);
          } else {
            const newProfile: ClubUser = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Unnamed Player',
              role: 'admin', // Default to admin per user request (club managers)
              photoURL: currentUser.photoURL || undefined,
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Profile sync error:", error);
          // Don't throw here to avoid white screen
        }
      } else if (BYPASS_AUTH) {
        // Fallback to Guest Admin if enabled and no real user
        const mockUser = {
          uid: 'guest-admin-uid',
          email: 'admin@hoopshub.com',
          displayName: 'Administrador Invitado',
          role: 'admin',
        } as ClubUser;
        setProfile(mockUser);
        setUser({ uid: 'guest-admin-uid', email: 'admin@hoopshub.com' } as any);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'biztomas71@gmail.com';
  const isCoach = profile?.role === 'coach' || isAdmin;

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, isAdmin, isCoach }}>
      {children}
    </FirebaseContext.Provider>
  );
};
