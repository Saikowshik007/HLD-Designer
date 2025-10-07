import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types';

export const authService = {
  async register(email: string, password: string, displayName: string, llmApiKey: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    const userData: Omit<User, 'uid'> = {
      email: userCredential.user.email,
      displayName,
      llmApiKey,
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    return {
      uid: userCredential.user.uid,
      ...userData,
    };
  },

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.data();

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      llmApiKey: userData?.llmApiKey,
      llmModel: userData?.llmModel || 'gpt-4o',
      voiceLanguage: userData?.voiceLanguage || 'en-US',
      voiceAutoSpeak: userData?.voiceAutoSpeak || false,
      voiceRate: userData?.voiceRate || 0.95,
      voicePitch: userData?.voicePitch || 1.1,
      theme: userData?.theme || 'light',
    };
  },

  async updateUserSettings(
    userId: string,
    settings: {
      llmApiKey?: string;
      llmModel?: string;
      voiceLanguage?: string;
      voiceAutoSpeak?: boolean;
      voiceRate?: number;
      voicePitch?: number;
      theme?: 'light' | 'dark';
    }
  ): Promise<void> {
    await setDoc(doc(db, 'users', userId), settings, { merge: true });
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          llmApiKey: userData?.llmApiKey,
          llmModel: userData?.llmModel || 'gpt-4o',
          voiceLanguage: userData?.voiceLanguage || 'en-US',
          voiceAutoSpeak: userData?.voiceAutoSpeak || false,
          voiceRate: userData?.voiceRate || 0.95,
          voicePitch: userData?.voicePitch || 1.1,
          theme: userData?.theme || 'light',
        });
      } else {
        callback(null);
      }
    });
  },

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        llmApiKey: userData?.llmApiKey,
        llmModel: userData?.llmModel || 'gpt-4o',
        voiceLanguage: userData?.voiceLanguage || 'en-US',
        voiceAutoSpeak: userData?.voiceAutoSpeak || false,
        voiceRate: userData?.voiceRate || 0.95,
        voicePitch: userData?.voicePitch || 1.1,
        theme: userData?.theme || 'light',
      };
    }
    return null;
  },
};
