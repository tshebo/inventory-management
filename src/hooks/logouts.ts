import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      await signOut(auth);
      
      // Clear all auth-related cookies
      Cookies.remove('authStatus');
      Cookies.remove('userRole');
      
      // Optional: Clear any local storage items you might have set
      localStorage.removeItem('user');
      
      // Redirect to login page
      router.push('/sign-in');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };

  return logout;
};