"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "vendor";
}

interface AuthUser extends User {
  role?: "admin" | "vendor" | "customer";
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Cast to AuthUser to include the role property
        setCurrentUser(user as AuthUser);
        fetchUsers();
      } else {
        setCurrentUser(null);
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as FirestoreUser)
      );
      setUsers(usersData);
    } catch (err) {
      setError(`Error fetching users: ${(err as Error).message}`);
    }
  };

  const changeUserRole = async (
    userId: string,
    newRole: "admin" | "vendor"
  ) => {
    if (currentUser?.role !== "admin") {
      setError("Only admins can change user roles.");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(`Error updating user role: ${(err as Error).message}`);
    }
  };

  if (!currentUser) {
    return (
      <Alert>
        <AlertDescription>Please sign in to access this page.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Role</th>
            {currentUser.role === "admin" && (
              <th className="py-2 px-4 border-b">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.name}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
              {currentUser.role === "admin" && (
                <td className="py-2 px-4 border-b">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      changeUserRole(
                        user.id,
                        e.target.value as "admin" | "vendor"
                      )
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="customer">customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPage;
