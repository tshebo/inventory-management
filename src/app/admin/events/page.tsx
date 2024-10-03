'use client'
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged,User } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface AuthUser extends User {
  role?: 'admin' | 'vendor';
}

const EventsManagementPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '' });

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user as AuthUser);
        fetchEvents();
      } else {
        setCurrentUser(null);
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
      setEvents(eventsData);
    } catch (err) {
      setError(`Error fetching events: ${(err as Error).message}`);
    }
  };

  const addEvent = async () => {
    if (currentUser?.role !== 'admin') {
      setError('Only admins can add events.');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), newEvent);
      setNewEvent({ name: '', date: '', location: '' });
      fetchEvents();
    } catch (err) {
      setError(`Error adding event: ${(err as Error).message}`);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (currentUser?.role !== 'admin') {
      setError('Only admins can delete events.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', eventId));
      fetchEvents();
    } catch (err) {
      setError(`Error deleting event: ${(err as Error).message}`);
    }
  };

  if (!currentUser) {
    return <Alert><AlertDescription>Please sign in to access this page.</AlertDescription></Alert>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Events Management</h1>
      {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}
      
      {currentUser.role === 'admin' && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Event Name"
            value={newEvent.name}
            onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
            className="mr-2"
          />
          <Input
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
            className="mr-2"
          />
          <Input
            type="text"
            placeholder="Location"
            value={newEvent.location}
            onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
            className="mr-2"
          />
          <Button onClick={addEvent}>Add Event</Button>
        </div>
      )}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Location</th>
            {currentUser.role === 'admin' && <th className="py-2 px-4 border-b">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td className="py-2 px-4 border-b">{event.name}</td>
              <td className="py-2 px-4 border-b">{event.date}</td>
              <td className="py-2 px-4 border-b">{event.location}</td>
              {currentUser.role === 'admin' && (
                <td className="py-2 px-4 border-b">
                  <Button onClick={() => deleteEvent(event.id)} variant="destructive">Delete</Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventsManagementPage;