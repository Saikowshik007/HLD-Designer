import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ChatMessage {
  id: string;
  designId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const chatService = {
  /**
   * Save a chat message to Firestore
   */
  async saveMessage(
    userId: string,
    designId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage> {
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: ChatMessage = {
      id: messageId,
      designId,
      userId,
      role,
      content,
      timestamp: Date.now(),
    };

    await setDoc(doc(db, 'chats', messageId), {
      ...message,
      createdAt: Timestamp.now(),
    });

    return message;
  },

  /**
   * Get all chat messages for a specific design
   */
  async getMessagesForDesign(userId: string, designId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      where('designId', '==', designId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        designId: data.designId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp,
      });
    });

    return messages;
  },

  /**
   * Delete all chat messages for a specific design
   */
  async deleteMessagesForDesign(userId: string, designId: string): Promise<void> {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      where('designId', '==', designId)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, 'chats', messageId));
  },
};
