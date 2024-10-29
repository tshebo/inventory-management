import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Cookies from 'js-cookie';

interface AuthUser extends User {
  uid: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user role from Firestore
          const userRef = doc(db, "users", firebaseUser.uid);
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
          
          setUser(firebaseUser as AuthUser);
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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, role, loading, signOut };
}
