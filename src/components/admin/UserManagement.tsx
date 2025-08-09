'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Search, UserCheck, UserX, Shield, ChefHat, User } from 'lucide-react'
import { type UserRole } from '@/lib/auth/rbac'

interface UserWithRole {
  uid: string
  email: string
  role: UserRole
  emailVerified: boolean
}

interface UserManagementProps {
  className?: string
}

export default function UserManagement({ className }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update user role
  const updateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(uid))
      
      const response = await fetch(`/api/admin/users/${uid}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user role')
      }
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      ))
      
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive'
      })
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(uid)
        return newSet
      })
    }
  }

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'kitchen':
        return 'default'
      case 'customer':
      default:
        return 'secondary'
    }
  }

  // Get role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'kitchen':
        return <ChefHat className="h-4 w-4" />
      case 'customer':
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card className={`${className} bg-gradient-to-br from-black to-gray-900 border-[#B7985A]/30`}>
        <CardHeader>
          <CardTitle className="text-white">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} bg-gradient-to-br from-black to-gray-900 border-[#B7985A]/30`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-[#FFD700]" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B7985A]" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-[#B7985A]/30 text-white placeholder:text-gray-500 focus:border-[#FFD700]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-[#B7985A]/30">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Roles</SelectItem>
              <SelectItem value="customer" className="text-white hover:bg-gray-700">Customers</SelectItem>
              <SelectItem value="kitchen" className="text-white hover:bg-gray-700">Kitchen Staff</SelectItem>
              <SelectItem value="admin" className="text-white hover:bg-gray-700">Administrators</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchUsers} 
            variant="outline"
            className="border-[#B7985A] text-[#FFD700] hover:bg-[#B7985A]/20 hover:text-[#FFD700]"
          >
            Refresh
          </Button>
        </div>

        {/* Users Table */}
        <div className="rounded-md border border-[#B7985A]/30 bg-gray-800/50">
          <Table>
            <TableHeader>
              <TableRow className="border-[#B7985A]/30 hover:bg-gray-800/50">
                <TableHead className="text-[#FFD700] font-semibold">Email</TableHead>
                <TableHead className="text-[#FFD700] font-semibold">Role</TableHead>
                <TableHead className="text-[#FFD700] font-semibold">Email Verified</TableHead>
                <TableHead className="text-[#FFD700] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow className="border-[#B7985A]/30">
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                    {searchTerm || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.uid} className="border-[#B7985A]/30 hover:bg-gray-800/30">
                    <TableCell className="font-medium text-white">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)}
                        className="flex items-center gap-1 w-fit bg-gradient-to-r from-[#B7985A] to-[#FFD700] text-black font-semibold"
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <UserCheck className="h-4 w-4 text-[#FFD700]" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: UserRole) => updateUserRole(user.uid, newRole)}
                        disabled={updatingUsers.has(user.uid)}
                      >
                        <SelectTrigger className="w-32 bg-gray-800 border-[#B7985A]/30 text-white focus:border-[#FFD700]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-[#B7985A]/30">
                          <SelectItem value="customer" className="text-white hover:bg-gray-700">Customer</SelectItem>
                          <SelectItem value="kitchen" className="text-white hover:bg-gray-700">Kitchen</SelectItem>
                          <SelectItem value="admin" className="text-white hover:bg-gray-700">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300">
          <span className="text-[#FFD700] font-semibold">Total Users: <span className="text-white">{users.length}</span></span>
          <span className="text-[#FFD700] font-semibold">Customers: <span className="text-white">{users.filter(u => u.role === 'customer').length}</span></span>
          <span className="text-[#FFD700] font-semibold">Kitchen Staff: <span className="text-white">{users.filter(u => u.role === 'kitchen').length}</span></span>
          <span className="text-[#FFD700] font-semibold">Administrators: <span className="text-white">{users.filter(u => u.role === 'admin').length}</span></span>
        </div>
      </CardContent>
    </Card>
  )
}