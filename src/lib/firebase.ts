// import { firebaseui } from 'firebaseui';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuCdkzJKOPooS3rwLdpjpgOTzMWGzjV_A",
  authDomain: "buyukinventory.firebaseapp.com",
  projectId: "buyukinventory",
  storageBucket: "buyukinventory.appspot.com",
  messagingSenderId: "977364581610",
  appId: "1:977364581610:web:bfb11bbd8503aa5f5fab93",
  measurementId: "G-49HZ5EFSY6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const db = getFirestore(app);