import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { UserProfile, VIPType, VIP_LABELS } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVIPChange = async (uid: string, vipType: VIPType) => {
    try {
      await userService.updateVIPStatus(uid, vipType);
      toast({
        title: "VIP Status Updated",
        description: `User VIP status changed to ${VIP_LABELS[vipType]}`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update VIP status",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (uid: string, role: 'user' | 'admin') => {
    try {
      await userService.updateRole(uid, role);
      toast({
        title: "Role Updated",
        description: `User role changed to ${role}`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="content-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>VIP Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.displayName}</span>
                    {user.vipType !== 'free' && <Crown className="w-4 h-4 text-yellow-500" />}
                    {user.role === 'admin' && <Shield className="w-4 h-4 text-blue-500" />}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.vipType}
                    onValueChange={(value: VIPType) => handleVIPChange(user.uid, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="vip_7">VIP 7 Days</SelectItem>
                      <SelectItem value="vip_30">VIP 30 Days</SelectItem>
                      <SelectItem value="vip_lifetime">VIP Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.uid, value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{user.totalDownloads}</TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }).format(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
