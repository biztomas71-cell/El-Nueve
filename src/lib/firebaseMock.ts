import { ClubUser } from '../types';

// Simple types to match Firebase SDK roughly
export type Unsubscribe = () => void;
export type Callback = (snapshot: any) => void;

class MockAuth {
  currentUser: any = null;
  onAuthStateChanged(auth: any, callback: (user: any) => void) {
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      // Default auto-login for testing on GitHub
      this.currentUser = {
        uid: 'dev-user',
        email: 'dev@elnueve.com',
        displayName: 'Entrenador El Nueve',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      };
      localStorage.setItem('mock_user', JSON.stringify(this.currentUser));
    }
    
    if (typeof callback === 'function') {
      setTimeout(() => callback(this.currentUser), 100);
    }
    return () => {};
  }

  async signInWithPopup() {
    this.currentUser = {
      uid: 'dev-user',
      email: 'dev@elnueve.com',
      displayName: 'Entrenador El Nueve',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    };
    localStorage.setItem('mock_user', JSON.stringify(this.currentUser));
    window.location.reload();
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('mock_user');
    window.location.reload();
  }
}

class MockFirestore {
  private getData(path: string): any[] {
    const data = localStorage.getItem(`mock_db_${path}`);
    return data ? JSON.parse(data) : [];
  }

  private setData(path: string, data: any[]) {
    localStorage.setItem(`mock_db_${path}`, JSON.stringify(data));
    // Trigger listeners
    const event = new CustomEvent(`mock_db_update_${path}`, { detail: data });
    window.dispatchEvent(event);
  }

  collection(db: any, path: string) {
    return { path, type: 'collection' };
  }

  doc(db: any, path: string, id?: string) {
    if (!id && path.includes('/')) {
      const parts = path.split('/');
      return { path: parts[0], id: parts[1], type: 'doc' };
    }
    return { path, id, type: 'doc' };
  }

  async getDoc(docRef: any) {
    const items = this.getData(docRef.path);
    const item = items.find(i => (i.id === docRef.id || i.uid === docRef.id));
    return {
      exists: () => !!item,
      data: () => item
    };
  }

  async setDoc(docRef: any, data: any) {
    const items = this.getData(docRef.path);
    const index = items.findIndex(i => (i.id === docRef.id || i.uid === docRef.id));
    const newItem = { ...data, id: docRef.id || data.id || data.uid };
    if (index > -1) {
      items[index] = newItem;
    } else {
      items.push(newItem);
    }
    this.setData(docRef.path, items);
  }

  async updateDoc(docRef: any, data: any) {
    const items = this.getData(docRef.path);
    const index = items.findIndex(i => (i.id === docRef.id || i.uid === docRef.id));
    if (index > -1) {
      items[index] = { ...items[index], ...data };
      this.setData(docRef.path, items);
    }
  }

  async addDoc(colRef: any, data: any) {
    const items = this.getData(colRef.path);
    const id = Math.random().toString(36).substr(2, 9);
    const newItem = { ...data, id };
    items.push(newItem);
    this.setData(colRef.path, items);
    return { id };
  }

  async deleteDoc(docRef: any) {
    const items = this.getData(docRef.path);
    const filtered = items.filter(i => (i.id !== docRef.id && i.uid !== docRef.id));
    this.setData(docRef.path, filtered);
  }

  onSnapshot(ref: any, callback: Callback) {
    const handler = (e: any) => {
      const data = e.detail;
      callback({
        docs: data.map((d: any) => ({
          id: d.id || d.uid,
          data: () => d
        }))
      });
    };

    window.addEventListener(`mock_db_update_${ref.path}`, handler);
    
    // Initial call
    const initialData = this.getData(ref.path);
    setTimeout(() => {
      callback({
        docs: initialData.map((d: any) => ({
          id: d.id || d.uid,
          data: () => d
        }))
      });
    }, 0);

    return () => window.removeEventListener(`mock_db_update_${ref.path}`, handler);
  }

  query(ref: any, ...constraints: any[]) {
    return ref; // Simple mock doesn't handle constraints yet
  }

  where(field: string, op: string, value: any) {
    return { field, op, value };
  }
}

export const mockAuth = new MockAuth();
export const mockDb = new MockFirestore();
export class MockGoogleAuthProvider {}
