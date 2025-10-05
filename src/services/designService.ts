import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Design, DesignElement } from '@/types';

const DESIGNS_COLLECTION = 'designs';

export const designService = {
  async createOrUpdateDesign(userId: string, designId: string | null, elements: DesignElement[], title: string): Promise<Design> {
    const now = Date.now();

    if (designId) {
      // Update existing design
      const designRef = doc(db, DESIGNS_COLLECTION, designId);

      await setDoc(designRef, {
        elements,
        title,
        updatedAt: Timestamp.fromMillis(now),
      }, { merge: true });

      const designDoc = await getDoc(designRef);
      const data = designDoc.data();

      return {
        ...data,
        id: designId,
        createdAt: data?.createdAt?.toMillis() || now,
        updatedAt: now,
      } as Design;
    } else {
      // Create new design
      const newDesignId = doc(collection(db, DESIGNS_COLLECTION)).id;
      const designData: Design = {
        id: newDesignId,
        userId,
        title,
        elements,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, DESIGNS_COLLECTION, newDesignId), {
        ...designData,
        createdAt: Timestamp.fromMillis(now),
        updatedAt: Timestamp.fromMillis(now),
      });

      return designData;
    }
  },

  async getLastDesign(userId: string): Promise<Design | null> {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
    } as Design;
  },

  async getDesign(designId: string): Promise<Design | null> {
    const designDoc = await getDoc(doc(db, DESIGNS_COLLECTION, designId));

    if (!designDoc.exists()) {
      return null;
    }

    const data = designDoc.data();
    return {
      ...data,
      id: designDoc.id,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
    } as Design;
  },

  async getUserDesigns(userId: string): Promise<Design[]> {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      } as Design;
    });
  },

  async deleteDesign(designId: string): Promise<void> {
    await deleteDoc(doc(db, DESIGNS_COLLECTION, designId));
  },

  async updateDesign(designId: string, updates: Partial<Design>): Promise<void> {
    const designRef = doc(db, DESIGNS_COLLECTION, designId);
    const now = Date.now();

    await setDoc(designRef, {
      ...updates,
      updatedAt: Timestamp.fromMillis(now),
    }, { merge: true });
  },
};
