"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from "@/lib/firebase"
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "vendor" | "user"
  createdAt: string
  createdBy: string
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 20
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"))
      const fetchedUsers: User[] = []
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User)
      })
      setUsers(fetchedUsers)
      setTotalPages(Math.ceil(fetchedUsers.length / usersPerPage))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
      setLoading(false)
    }
  }

  const getCurrentUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage
    const endIndex = startIndex + usersPerPage
    return users.slice(startIndex, endIndex)
  }

  const getRoleDotColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "bg-green-500"
      case "vendor":
        return "bg-yellow-500"
      case "user":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        role: newRole
      })
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      toast.success(`User role updated successfully`)
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId))
        setUsers(users.filter(user => user.id !== userId))
        toast.success("User deleted successfully")
      } catch (error) {
        console.error("Error deleting user:", error)
        toast.error("Failed to delete user")
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link href="/admin/users/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getCurrentUsers().map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getRoleDotColor(user.role)}`} />
                  <Select 
                    defaultValue={user.role} 
                    onValueChange={(value: User["role"]) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/admin/users/edit/${user.id}`}>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <span className="mx-4">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}