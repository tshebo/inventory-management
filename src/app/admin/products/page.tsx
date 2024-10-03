'use client'
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, getDocs, addDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';


interface Product {
  id: string;
  name: string;
  price: number;
  eventId: string;
  storeId: string;
  vendorId: string;
}

interface Store {
  id: string;
  name: string;
  eventId: string;
}

interface Event {
  id: string;
  name: string;
}

interface AuthUser extends User {
  role?: 'admin' | 'vendor';
}

const ProductsManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', eventId: '', storeId: '' });

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user as AuthUser);
        fetchEvents();
        fetchStores();
        fetchProducts();
      } else {
        setCurrentUser(null);
        setProducts([]);
        setStores([]);
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
        name: doc.data().name
      } as Event));
      setEvents(eventsData);
    } catch (err) {
      setError(`Error fetching events: ${(err as Error).message}`);
    }
  };

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
          name: doc.data().name,
          eventId: eventDoc.id
        } as Store)));
      }
      setStores(storesData);
    } catch (err) {
      setError(`Error fetching stores: ${(err as Error).message}`);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData: Product[] = [];
      for (const event of events) {
        for (const store of stores.filter(s => s.eventId === event.id)) {
          const productsQuery = query(collection(db, `events/${event.id}/stores/${store.id}/products`));
          const productsSnapshot = await getDocs(productsQuery);
          productsData.push(...productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            eventId: event.id,
            storeId: store.id
          } as Product)));
        }
      }
      setProducts(productsData);
    } catch (err) {
      setError(`Error fetching products: ${(err as Error).message}`);
    }
  };

  const addProduct = async () => {
    if (currentUser?.role !== 'admin') {
      setError('Only admins can add products.');
      return;
    }

    try {
      const { eventId, storeId, name, price } = newProduct;
      await addDoc(collection(db, `events/${eventId}/stores/${storeId}/products`), {
        name,
        price: parseFloat(price),
        vendorId: stores.find(s => s.id === storeId)?.vendorId
      });
      setNewProduct({ name: '', price: '', eventId: '', storeId: '' });
      fetchProducts();
    } catch (err) {
      setError(`Error adding product: ${(err as Error).message}`);
    }
  };

  const deleteProduct = async (eventId: string, storeId: string, productId: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.uid !== products.find(p => p.id === productId)?.vendorId) {
      setError('You do not have permission to delete this product.');
      return;
    }

    try {
      await deleteDoc(doc(db, `events/${eventId}/stores/${storeId}/products`, productId));
      fetchProducts();
    } catch (err) {
      setError(`Error deleting product: ${(err as Error).message}`);
    }
  };

  if (!currentUser) {
    return <Alert><AlertDescription>Please sign in to access this page.</AlertDescription></Alert>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products Management</h1>
      {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}
      
      {currentUser.role === 'admin' && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            className="mr-2"
          />
          <Input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            className="mr-2"
          />
          <Select
            value={newProduct.eventId}
            onChange={(e) => setNewProduct({...newProduct, eventId: e.target.value, storeId: ''})}
            className="mr-2"
          >
            <option value="">Select Event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </Select>
          <Select
            value={newProduct.storeId}
            onChange={(e) => setNewProduct({...newProduct, storeId: e.target.value})}
            className="mr-2"
            disabled={!newProduct.eventId}
          >
            <option value="">Select Store</option>
            {stores
              .filter(store => store.eventId === newProduct.eventId)
              .map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))
            }
          </Select>
          <Button onClick={addProduct}>Add Product</Button>
        </div>
      )}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Price</th>
            <th className="py-2 px-4 border-b">Event</th>
            <th className="py-2 px-4 border-b">Store</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td className="py-2 px-4 border-b">{product.name}</td>
              <td className="py-2 px-4 border-b">${product.price.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">{events.find(e => e.id === product.eventId)?.name}</td>
              <td className="py-2 px-4 border-b">{stores.find(s => s.id === product.storeId)?.name}</td>
              <td className="py-2 px-4 border-b">
                {(currentUser.role === 'admin' || currentUser.uid === product.vendorId) && (
                  <Button onClick={() => deleteProduct(product.eventId, product.storeId, product.id)} variant="destructive">Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsManagementPage;