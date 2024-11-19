// Types for Firestore documents
interface User {
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'customer';
}

interface Store {
  name: string;
  description: string;
  vendorId: string; // Reference to user doc
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: number;
  storeId: string;
  storeName?: string;
  category: string;
  cost: number;
  imageUrl: string;
}

interface TimeSlot {
  start: string; // ISO string format: "HH:mm"
  end: string;   // ISO string format: "HH:mm"
}

interface EventSchedule {
  timeSlots: TimeSlot[];
  breakTimes?: TimeSlot[]; // Optional break times during the event
  setupTime?: TimeSlot;    // Optional setup time before event
  cleanupTime?: TimeSlot;  // Optional cleanup time after event
}

interface Event {
  name: string;
  description: string;
  date: string;           // ISO date string: "YYYY-MM-DD"
  schedule: EventSchedule;
  location: string;
  isMultiDay?: boolean;   // Flag for multi-day events
  endDate?: string;       // ISO date string for multi-day events
  maxCapacity?: number;   // Optional maximum attendee capacity
  currentRegistrations?: number; // Current number of registrations
}

interface EventProduct {
  eventId: string;        // Reference to event doc
  productId: string;      // Reference to product doc
  quantity: number;
  specialPrice?: number;  // Optional special price for the event
  availableTimeSlots?: TimeSlot[]; // Optional specific times when product is available
}

// Firestore collection names
const COLLECTIONS = {
  USERS: 'users',
  STORES: 'stores',
  PRODUCTS: 'products',
  EVENTS: 'events',
  EVENT_PRODUCTS: 'event_products'
} as const;

// Helper type for time validation
type TimeString = `${number}:${number}`
