// Types for Firestore documents
interface User {
    email: string;
    name: string;
    role: 'admin' | 'vendor';
  }
  
  interface Store {
    name: string;
    description: string;
    vendorId: string; // Reference to user doc
  }
  
  interface Product {
    name: string;
    category: string;
    price: number;
    cost: number;
    inStock: number;
    storeId: string; // Reference to store doc
  }
  
  interface Event {
    name: string;
    description: string;
    date: Date;
    location: string;
  }
  
  interface EventProduct {
    eventId: string; // Reference to event doc
    productId: string; // Reference to product doc
    quantity: number;
    specialPrice?: number; // Optional special price for the event
  }
  
  // Firestore collection names
  const COLLECTIONS = {
    USERS: 'users',
    STORES: 'stores',
    PRODUCTS: 'products',
    EVENTS: 'events',
    EVENT_PRODUCTS: 'event_products'
  } as const;