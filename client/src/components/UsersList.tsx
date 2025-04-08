import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";

// Extended User type to include new fields
interface ExtendedUser extends User {
  status: 'active' | 'suspended' | 'banned';
  notes: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Edit, 
  Ban, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowUpDown,
  Eye,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function UsersList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof User>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  
  // Current user being edited
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Edit form fields
  const [balanceAdjustment, setBalanceAdjustment] = useState<number>(0);
  const [userStatus, setUserStatus] = useState<"active" | "suspended" | "banned">("active");
  const [adminNotes, setAdminNotes] = useState<string>("");
  
  // Show game history dialog
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<ExtendedUser[]>({
    queryKey: ["/api/users"],
  });

  // Dialog control
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: {
      userId: number;
      balanceAdjustment?: number;
      status?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/users/${userData.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle user selection for editing
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserStatus(user.status || "active");
    setBalanceAdjustment(0);
    setAdminNotes(user.notes || "");
    setDialogOpen(true);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      userId: selectedUser.id,
      balanceAdjustment: balanceAdjustment !== 0 ? balanceAdjustment : undefined,
      status: userStatus !== selectedUser.status ? userStatus : undefined,
      notes: adminNotes !== selectedUser.notes ? adminNotes : undefined,
    });
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    if (sortField === "balance") {
      return sortDirection === "asc" 
        ? a[sortField] - b[sortField] 
        : b[sortField] - a[sortField];
    }
    
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Filter users
  const filteredUsers = sortedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle sort
  const toggleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suspended":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      case "banned":
        return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Banned</Badge>;
      case "active":
      default:
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Active</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive py-4">
        Error loading users: {(error as Error).message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          {searchQuery ? "No users match your search" : "No users found"}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("id")}
                >
                  ID {sortField === "id" && <ArrowUpDown className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("username")}
                >
                  Username {sortField === "username" && <ArrowUpDown className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("balance")}
                >
                  Balance {sortField === "balance" && <ArrowUpDown className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.balance} coins</TableCell>
                  <TableCell>
                    {getStatusBadge(user.status || "active")}
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="destructive">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" /> Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" /> View Activity
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={user.isAdmin} 
                          onClick={() => {
                            setSelectedUser(user);
                            setUserStatus("active");
                            setAdminNotes(user.notes || "");
                            updateUserMutation.mutate({
                              userId: user.id,
                              status: "active"
                            });
                          }}>
                          <Check className="h-4 w-4 mr-2 text-green-500" /> Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={user.isAdmin}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserStatus("suspended");
                            setAdminNotes(user.notes || "");
                            updateUserMutation.mutate({
                              userId: user.id,
                              status: "suspended"
                            });
                          }}>
                          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" /> Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={user.isAdmin}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserStatus("banned");
                            setAdminNotes(user.notes || "");
                            updateUserMutation.mutate({
                              userId: user.id,
                              status: "banned"
                            });
                          }}>
                          <Ban className="h-4 w-4 mr-2 text-red-500" /> Ban
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Make changes to the user's account. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Account Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as any)}
                disabled={selectedUser?.isAdmin}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="balance-adjustment">Balance Adjustment</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="balance-adjustment"
                  type="number"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Current: {selectedUser?.balance || 0} coins
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a positive number to add coins, or a negative number to remove coins.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this user..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}