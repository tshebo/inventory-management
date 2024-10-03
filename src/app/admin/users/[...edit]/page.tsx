'use client'
import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Event {
  id: string
  name: string
  description: string
  date: Date
  location: string
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const eventsRef = collection(db, 'events')
    const q = query(eventsRef, orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const eventList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        })) as Event[]
        
        setEvents(eventList)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching events:', error)
        setError('Failed to load events')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'events', eventId))
      return true
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  return { events, loading, error, deleteEvent }
}