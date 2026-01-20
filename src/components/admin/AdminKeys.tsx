import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Search, Ban, Eye, Monitor, Smartphone, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { keyService } from "@/services/keyService";
import { LicenseKey, KeyType, KEY_TYPE_LABELS, KEY_STATUS_LABELS, DeviceInfo } from "@/types/licenseKey";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AdminKeys = () => {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createCount, setCreateCount] = useState(1);
  const [createKeyType, setCreateKeyType] = useState<KeyType>("vip_7");
  const [createNote, setCreateNote] = useState("");
  const [createMaxDevices, setCreateMaxDevices] = useState(1);
  const [creating, setCreating] = useState(false);
  
  // Detail dialog state
  const [selectedKey, setSelectedKey] = useState<LicenseKey | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Edit max devices dialog
  const [isEditDevicesDialogOpen, setIsEditDevicesDialogOpen] = useState(false);
  const [editMaxDevices, setEditMaxDevices] = useState(1);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await keyService.getAllKeys();
      setKeys(data);
    } catch (error) {
      console.error("Error fetching keys:", error);
      toast({
        title: "Error",
        description: "Failed to load keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeys = async () => {
    setCreating(true);
    try {
      await keyService.createMultipleKeys(createKeyType, createCount, createNote || undefined, createMaxDevices);
      toast({
        title: "Success",
        description: `Created ${createCount} key(s) successfully`,
      });
      setIsCreateDialogOpen(false);
      setCreateCount(1);
      setCreateNote("");
      setCreateMaxDevices(1);
      fetchKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create keys",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    toast({
      title: "Copied",
      description: "Key copied to clipboard",
    });
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await keyService.revokeKey(id);
      toast({
        title: "Revoked",
        description: "Key has been revoked",
      });
      fetchKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke key",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await keyService.deleteKey(id);
      toast({
        title: "Deleted",
        description: "Key has been deleted",
      });
      fetchKeys();
      setIsDetailDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete key",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (key: LicenseKey) => {
    setSelectedKey(key);
    setIsDetailDialogOpen(true);
  };

  const handleEditMaxDevices = (key: LicenseKey) => {
    setSelectedKey(key);
    setEditMaxDevices(key.maxDevices);
    setIsEditDevicesDialogOpen(true);
  };

  const handleSaveMaxDevices = async () => {
    if (!selectedKey) return;
    try {
      await keyService.updateMaxDevices(selectedKey.id, editMaxDevices);
      toast({
        title: "Updated",
        description: "Device limit updated successfully",
      });
      setIsEditDevicesDialogOpen(false);
      fetchKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update device limit",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDevice = async (keyId: string, deviceId: string) => {
    try {
      await keyService.removeDevice(keyId, deviceId);
      toast({
        title: "Removed",
        description: "Device removed successfully",
      });
      // Refresh key details
      const updatedKey = await keyService.getKeyById(keyId);
      if (updatedKey) setSelectedKey(updatedKey);
      fetchKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      used: "secondary",
      expired: "outline",
      revoked: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{KEY_STATUS_LABELS[status as keyof typeof KEY_STATUS_LABELS]}</Badge>;
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'windows':
      case 'mac':
      case 'linux':
        return <Monitor className="w-4 h-4" />;
      case 'android':
      case 'ios':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const filteredKeys = keys.filter((key) => {
    const matchesSearch = 
      key.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.usedByEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.note?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || key.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.status === 'active').length,
    used: keys.filter(k => k.status === 'used').length,
    revoked: keys.filter(k => k.status === 'revoked').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="content-card p-4">
          <p className="text-muted-foreground text-sm">Total Keys</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="content-card p-4">
          <p className="text-muted-foreground text-sm">Active</p>
          <p className="text-2xl font-bold text-green-500">{stats.active}</p>
        </div>
        <div className="content-card p-4">
          <p className="text-muted-foreground text-sm">Used</p>
          <p className="text-2xl font-bold text-blue-500">{stats.used}</p>
        </div>
        <div className="content-card p-4">
          <p className="text-muted-foreground text-sm">Revoked</p>
          <p className="text-2xl font-bold text-red-500">{stats.revoked}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search keys..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Keys
        </Button>
      </div>

      {/* Keys Table */}
      <div className="content-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No keys found
                </TableCell>
              </TableRow>
            ) : (
              filteredKeys.map((key) => (
                <TableRow key={key.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(key)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {key.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyKey(key.key);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{KEY_TYPE_LABELS[key.keyType]}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(key.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className={key.devices.length >= key.maxDevices ? "text-orange-500" : ""}>
                        {key.devices.length}/{key.maxDevices}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                      {key.note || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {key.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(key)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditMaxDevices(key)}
                        title="Edit Device Limit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {key.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-500 hover:text-orange-600"
                          onClick={() => handleRevokeKey(key.id)}
                          title="Revoke"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteKey(key.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Keys Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create License Keys</DialogTitle>
            <DialogDescription>
              Generate new license keys for VIP access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key Type</Label>
              <Select value={createKeyType} onValueChange={(v) => setCreateKeyType(v as KeyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip_7">VIP 7 Days</SelectItem>
                  <SelectItem value="vip_30">VIP 30 Days</SelectItem>
                  <SelectItem value="vip_lifetime">VIP Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Devices (Số thiết bị tối đa)</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={createMaxDevices}
                onChange={(e) => setCreateMaxDevices(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Số lượng thiết bị có thể sử dụng key này cùng lúc (tối đa 1000)</p>
            </div>
            <div className="space-y-2">
              <Label>Number of Keys</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={createCount}
                onChange={(e) => setCreateCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Add a note for these keys..."
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKeys} disabled={creating}>
              {creating ? "Creating..." : `Create ${createCount} Key(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Key Details
            </DialogTitle>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-6">
              {/* Key Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Key Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-3 py-2 rounded font-mono text-lg">
                      {selectedKey.key}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyKey(selectedKey.key)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedKey.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{KEY_TYPE_LABELS[selectedKey.keyType]}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Device Limit</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={selectedKey.devices.length >= selectedKey.maxDevices ? "text-orange-500 font-medium" : ""}>
                      {selectedKey.devices.length} / {selectedKey.maxDevices}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleEditMaxDevices(selectedKey)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1">{selectedKey.createdAt.toLocaleString()}</p>
                </div>
                {selectedKey.usedAt && (
                  <div>
                    <Label className="text-muted-foreground">First Used</Label>
                    <p className="mt-1">{selectedKey.usedAt.toLocaleString()}</p>
                  </div>
                )}
                {selectedKey.note && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Note</Label>
                    <p className="mt-1 text-sm">{selectedKey.note}</p>
                  </div>
                )}
              </div>

              {/* Devices List */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Active Devices</Label>
                {selectedKey.devices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg">
                    No devices activated yet
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {selectedKey.devices.map((device, index) => (
                        <div
                          key={device.deviceId || index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getPlatformIcon(device.platform)}
                            <div>
                              <p className="font-medium">{device.deviceName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {device.softwareName}
                                </Badge>
                                <span>•</span>
                                <span>{device.platform || 'unknown'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Activated: {device.activatedAt.toLocaleString()} | 
                                Last seen: {device.lastSeenAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveDevice(selectedKey.id, device.deviceId)}
                            title="Remove Device"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Max Devices Dialog */}
      <Dialog open={isEditDevicesDialogOpen} onOpenChange={setIsEditDevicesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device Limit</DialogTitle>
            <DialogDescription>
              Change the maximum number of devices that can use this key simultaneously
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Max Devices</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={editMaxDevices}
              onChange={(e) => setEditMaxDevices(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Tối đa 1000 thiết bị</p>
            {selectedKey && selectedKey.devices.length > editMaxDevices && (
              <p className="text-sm text-orange-500 mt-2">
                Warning: Current device count ({selectedKey.devices.length}) exceeds new limit
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDevicesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMaxDevices}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
