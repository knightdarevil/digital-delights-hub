import { useState, useEffect } from "react";
import { contentService } from "@/services/contentService";
import { ContentItem } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AdminContent = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "windows" as ContentItem["category"],
    type: "free" as ContentItem["type"],
    downloadLink: "",
    imageUrl: "",
    size: "",
    quality: "" as ContentItem["quality"] | "",
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const data = await contentService.getAll();
      setContents(data);
    } catch (error) {
      console.error("Error fetching contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContent) {
        await contentService.update(editingContent.id, {
          ...formData,
          quality: formData.quality || undefined,
        });
        toast({ title: "Content Updated" });
      } else {
        await contentService.create({
          ...formData,
          quality: formData.quality || undefined,
        });
        toast({ title: "Content Created" });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchContents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description,
      category: content.category,
      type: content.type,
      downloadLink: content.downloadLink,
      imageUrl: content.imageUrl || "",
      size: content.size || "",
      quality: content.quality || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    
    try {
      await contentService.delete(id);
      toast({ title: "Content Deleted" });
      fetchContents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingContent(null);
    setFormData({
      title: "",
      description: "",
      category: "windows",
      type: "free",
      downloadLink: "",
      imageUrl: "",
      size: "",
      quality: "",
    });
  };

  const filteredContents = contents.filter(
    (content) =>
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.category.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? "Edit Content" : "Add New Content"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ContentItem["category"]) => 
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="courses">Courses</SelectItem>
                      <SelectItem value="movies">Movies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ContentItem["type"]) => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="vip">VIP Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downloadLink">Download Link (Google Drive)</Label>
                <Input
                  id="downloadLink"
                  value={formData.downloadLink}
                  onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">File Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 2.5 GB"
                  />
                </div>

                {formData.category === "movies" && (
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={formData.quality}
                      onValueChange={(value: ContentItem["quality"]) => 
                        setFormData({ ...formData, quality: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="4K">4K (VIP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero">
                  {editingContent ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contents Table */}
      <div className="content-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContents.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {content.title}
                </TableCell>
                <TableCell className="capitalize">{content.category}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    content.type === 'vip' 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {content.type.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {content.views.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {content.downloads.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  }).format(content.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(content)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(content.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
