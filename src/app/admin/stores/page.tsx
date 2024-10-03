'use client'
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface Store {
  id: string;
  name: string;
  eventId: string;
  vendorId: string;
}

interface Event {
  id: string;
  name: string;
}

interface AuthUser extends User {
  role?: 'admin' | 'vendor' ;
}

const StoresManagementPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newStore, setNewStore] = useState({ name: '', eventId: '', vendorId: '' });

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user as AuthUser);
        fetchStores();
        fetchEvents();
      } else {
        setCurrentUser(null);
        setStores([]);
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchStores = async () => {
    try {
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const storesData: Store[] = [];
      for (const eventDoc of querySnapshot.docs) {
        const storesQuery = query(collection(db, `events/${eventDoc.id}/stores`));
        const storesSnapshot = await getDocs(storesQuery);
        storesData.push(...storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventId: eventDoc.id
        } as Store)));
      }
      setStores(storesData);
    } catch (err) {
      setError(`Error fetching stores: ${(err as Error).message}`);
    }
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      } as Event));
      setEvents(eventsData);
    } catch (err) {
      setError(`Error fetching events: ${(err as Error).message}`);
    }
  };

  const addStore = async () => {
    if (currentUser?.role !== 'admin') {
      setError('Only admins can add stores.');
      return;
    }

    try {
      await addDoc(collection(db, `events/${newStore.eventId}/stores`), {
        name: newStore.name,
        vendorId: newStore.vendorId
      });
      setNewStore({ name: '', eventId: '', vendorId: '' });
      fetchStores();
    } catch (err) {
      setError(`Error adding store: ${(err as Error).message}`);
    }
  };

  const deleteStore = async (eventId: string, storeId: string) => {
    if (currentUser?.role !== 'admin') {
      setError('Only admins can delete stores.');
      return;
    }

    try {
      await deleteDoc(doc(db, `events/${eventId}/stores`, storeId));
      fetchStores();
    } catch (err) {
      setError(`Error deleting store: ${(err as Error).message}`);
    }
  };

  if (!currentUser) {
    return <Alert><AlertDescription>Please sign in to access this page.</AlertDescription></Alert>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stores Management</h1>
      {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}
      
      {currentUser.role === 'admin' && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Store Name"
            value={newStore.name}
            onChange={(e) => setNewStore({...newStore, name: e.target.value})}
            className="mr-2"
          />
          <Select
            value={newStore.eventId}
            onChange={(e) => setNewStore({...newStore, eventId: e.target.value})}
            className="mr-2"
          >
            <option value="">Select Event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </Select>
          <Input
            type="text"
            placeholder="Vendor ID"
            value={newStore.vendorId}
            onChange={(e) => setNewStore({...newStore, vendorId: e.target.value})}
            className="mr-2"
          />
          <Button onClick={addStore}>Add Store</Button>
        </div>
      )}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Event</th>
            <th className="py-2 px-4 border-b">Vendor ID</th>
            {currentUser.role === 'admin' && <th className="py-2 px-4 border-b">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {stores.map(store => (
            <tr key={store.id}>
              <td className="py-2 px-4 border-b">{store.name}</td>
              <td className="py-2 px-4 border-b">{events.find(e => e.id === store.eventId)?.name}</td>
              <td className="py-2 px-4 border-b">{store.vendorId}</td>
              {currentUser.role === 'admin' && (
                <td className="py-2 px-4 border-b">
                  <Button onClick={() => deleteStore(store.eventId, store.id)} variant="destructive">Delete</Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StoresManagementPage;