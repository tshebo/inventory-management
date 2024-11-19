import { getDocs, where, query, increment, updateDoc, doc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { collection } from "firebase/firestore";


export async function getVendorProducts(vendorId: string) {
  const storesRef = collection(db, "stores");
  const storesQuery = query(
    storesRef,
    where("vendorIds", "array-contains", vendorId)
  );
  const storesSnapshot = await getDocs(storesQuery);
  
  const storeIds = storesSnapshot.docs.map((doc) => doc.id);
  
  const productsRef = collection(db, "products");
  const productsQuery = query(
    productsRef,
    where("storeId", "in", storeIds)
  );
  
  const productsSnapshot = await getDocs(productsQuery);
  return productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function createSale(saleData: {
  products: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  vendorId: string;
  storeId: string;
  paymentMethod: string;
}) {
  const salesRef = collection(db, "sales");
  const sale = await addDoc (salesRef, {
    ...saleData,
    createdAt: Timestamp.now(),
  });

  // Update product inventory
  for (const item of saleData.products) {
    const productRef = doc(db, "products", item.productId);
    await updateDoc(productRef, {
      inStock: increment(-item.quantity),
    });
  }

  return sale.id;
}

export async function getVendorSales(vendorId: string) {
  const salesRef = collection(db, "sales");
  const salesQuery = query(
    salesRef,
    where("vendorId", "==", vendorId)
  );
  
  const salesSnapshot = await getDocs(salesQuery);
  return salesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getVendorStores(vendorId: string) {
  const storesRef = collection(db, "stores");
  const storesQuery = query(
    storesRef,
    where("vendorIds", "array-contains", vendorId)
  );
  
  const storesSnapshot = await getDocs(storesQuery);
  return storesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}