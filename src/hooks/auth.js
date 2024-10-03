import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Cookies from 'js-cookie';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user role from Firestore
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userRole = userDoc.data().role;
            setRole(userRole);
            
            // Set cookies for auth status and role
            Cookies.set('authStatus', 'true', { expires: 7 });
            Cookies.set('userRole', userRole, { expires: 7 });
          } else {
            console.warn("User document doesn't exist in Firestore");
            setRole(null);
          }
          
          setUser(user);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          Cookies.remove('authStatus');
          Cookies.remove('userRole');
        }
      } else {
        setUser(null);
        setRole(null);
        // Remove cookies when user is not authenticated
        Cookies.remove('authStatus');
        Cookies.remove('userRole');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      // Cookies will be removed by the auth state change listener
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, role, loading, signOut };
}