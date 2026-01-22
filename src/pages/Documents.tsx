import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  Plus,
  File,
  ImageIcon,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useDocuments } from "@/integrations/supabase/hooks/useDocuments";
import { useDownload } from "@/integrations/supabase/hooks/useDownload";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format as formatBtn } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  updated_at: string;
  user_id: string;
  expiry_date?: string;
}

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Ration Card",
  "Driving Licence",
  "Voter ID",
  "Birth Certificate",
  "Bank Passbook",
  "School Certificates",
  "College Certificates",
  "Graduation Certificates",
  "Other custom documents"
];

const Documents = () => {
  const queryClient = useQueryClient();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useDocuments();
  const { downloadFile, downloading: fileDownloading } = useDownload();
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>({});

  const documents = data?.pages.flatMap(page => page.map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    file_path: doc.file_path,
    file_url: doc.file_path.startsWith('http') ? doc.file_path :
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`,
    file_type: doc.file_type,
    uploaded_at: doc.uploaded_at,
    updated_at: doc.updated_at,
    user_id: doc.user_id,
    expiry_date: doc.expiry_date,
  }))) || [];

  // Check offline status for all documents
  useEffect(() => {
    const checkOfflineStatus = async () => {
      const status: Record<string, boolean> = {};
      const { isFileCached } = await import("@/lib/offline-storage");

      for (const doc of documents) {
        status[doc.id] = await isFileCached('documents', doc.file_path);
      }
      setOfflineStatus(status);
    };

    if (documents.length > 0) {
      checkOfflineStatus();
    }
  }, [documents.length]);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    file: null as File | null,
    expiry_date: undefined as Date | undefined,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      const isImage = file.type.startsWith('image/');
      const isValidType = validTypes.includes(file.type) || isImage;

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Allowed formats: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX. Current: " + file.type,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, file, name: formData.name || file.name, expiry_date: formData.expiry_date });
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      file: null,
      expiry_date: doc.expiry_date ? new Date(doc.expiry_date) : undefined,
    });
    setEditDialogOpen(true);
  };

  const handleResetForm = () => {
    setFormData({ name: "", type: "", file: null, expiry_date: undefined });
    setEditingDocument(null);
  };

  const handleUpload = async () => {
    if (!formData.type || !formData.file) {
      toast({
        title: "Missing information",
        description: "Please select a document type and file.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "Other custom documents" && !formData.name) {
      toast({
        title: "Missing information",
        description: "Please enter a document name for custom documents.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        toast({
          title: "Upload Failed",
          description: `Storage error: ${uploadError.message}`,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: formData.name || formData.file.name,
          type: formData.type,
          file_path: filePath,
          file_type: formData.file.type,
          file_size: formData.file.size,
          expiry_date: formData.expiry_date ? formData.expiry_date.toISOString() : null,
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
        toast({
          title: "Database Error",
          description: "Failed to save document metadata.",
          variant: "destructive",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        toast({
          title: "Uploaded Successfully",
          description: "Your document has been stored securely.",
        });
        setFormData({ name: "", type: "", file: null, expiry_date: undefined });
        setUploadDialogOpen(false);
        setEditingDocument(null);
      }

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDocument || !formData.type) {
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (formData.file) {
        // Delete old file logic omitted for brevity, focusing on new upload
        if (editingDocument.file_url.includes('storage/v1/object/public')) {
          const urlParts = editingDocument.file_url.split('/storage/v1/object/public/documents/');
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            await supabase.storage.from('documents').remove([oldFilePath]);
          }
        }

        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('documents')
          .update({
            name: formData.name || formData.file.name,
            type: formData.type,
            file_path: filePath,
            file_type: formData.file.type,
            file_size: formData.file.size,
            expiry_date: formData.expiry_date ? formData.expiry_date.toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id)
          .eq('user_id', user.id);

        if (dbError) throw dbError;

      } else {
        const { error: dbError } = await supabase
          .from('documents')
          .update({
            name: formData.name,
            type: formData.type,
            expiry_date: formData.expiry_date ? formData.expiry_date.toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id)
          .eq('user_id', user.id);

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Document Updated",
        description: "Your document details have been updated.",
      });

      setFormData({ name: "", type: "", file: null, expiry_date: undefined });
      setEditDialogOpen(false);
      setEditingDocument(null);

    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const docToDelete = documents.find(doc => doc.id === id);
      if (!docToDelete) return;

      if (docToDelete.file_url.includes('storage/v1/object/public')) {
        const urlParts = docToDelete.file_url.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          await supabase.storage.from('documents').remove([urlParts[1]]);
        }
      }

      await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: Document) => {
    // If it's a legacy external URL, fall back to old behavior
    if (doc.file_url.startsWith('http') && !doc.file_url.includes('storage/v1/object/public')) {
      window.open(doc.file_url, '_blank');
      return;
    }

    await downloadFile('documents', doc.file_path, doc.name);
  };

  const handleView = async (doc: Document) => {
    if (doc.file_url.startsWith('http') && !doc.file_url.includes('storage/v1/object/public')) {
      window.open(doc.file_url, '_blank');
      return;
    }

    await downloadFile('documents', doc.file_path, doc.name, true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5" />;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isRecent = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diff = Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 7;
  };

  const expiringSoonCount = documents.filter(doc =>
    doc.expiry_date && getDaysUntilExpiry(doc.expiry_date) <= 30 && getDaysUntilExpiry(doc.expiry_date) >= 0
  ).length;

  const recentUploadsCount = documents.filter(doc => isRecent(doc.uploaded_at)).length;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                📂 Document Management
              </h1>
              <p className="text-muted-foreground">
                Store and manage your important documents securely
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative group">
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] md:w-[300px] pl-9 h-10 bg-secondary/30 border-secondary focus:bg-card transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Search className="h-4 w-4" />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px] h-10 bg-secondary/30 border-secondary">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 h-10 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload your document. Supported formats: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-type">Document Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.type === "Other custom documents" && (
                      <div className="space-y-2">
                        <Label htmlFor="doc-name">Document Name *</Label>
                        <Input
                          id="doc-name"
                          placeholder="Enter document name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                      />
                      {formData.file && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expiry_date ? format(formData.expiry_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.expiry_date}
                            onSelect={(date) => setFormData({ ...formData, expiry_date: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={
                        uploading ||
                        !formData.type ||
                        !formData.file ||
                        (formData.type === "Other custom documents" && !formData.name)
                      }
                      className="w-full"
                    >
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{expiringSoonCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{recentUploadsCount}</div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            handleResetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update document details or upload a new file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doc-type">Document Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doc-name">Document Name</Label>
                <Input
                  id="edit-doc-name"
                  placeholder="Enter document name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-file">Upload New File (Optional)</Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiry-date">Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(formData.expiry_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.expiry_date}
                      onSelect={(date) => setFormData({ ...formData, expiry_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={handleUpdate}
                disabled={uploading || !formData.type}
                className="w-full"
              >
                {uploading ? "Updating..." : "Update Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supported Documents</CardTitle>
            <CardDescription>All document types you can store - Click any type to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFormData({
                      name: "",
                      type: type,
                      file: null,
                      expiry_date: undefined,
                    });
                    setUploadDialogOpen(true);
                  }}
                  className="py-2 px-4 rounded-md border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/30 transition-colors text-sm font-medium text-center cursor-pointer"
                >
                  {type}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load documents</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">
                There was an error fetching your documents. Please try refreshing the page.
              </p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card className="bg-secondary/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-6">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No documents matches found</h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Try adjusting your search query or filters to find what you're looking for.
              </p>
              <Button onClick={() => { setSearchQuery(""); setSelectedType("All"); }} variant="outline">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredDocuments.map((doc, index) => {
                const daysUntilExpiry = doc.expiry_date ? getDaysUntilExpiry(doc.expiry_date) : null;
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getFileIcon(doc.file_type)}
                              <CardTitle className="text-lg">{doc.type}</CardTitle>
                              {offlineStatus[doc.id] && (
                                <div className="text-green-500" title="Available offline">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              )}
                              {doc.expiry_date && (
                                <Badge
                                  className={`text-xs ${daysUntilExpiry! < 0
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : daysUntilExpiry! <= 30
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    }`}
                                  variant="outline"
                                >
                                  {daysUntilExpiry! < 0 ? "Expired" : `Expires in ${daysUntilExpiry} days`}
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              {doc.name}
                            </CardDescription>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            Uploaded {formatDate(doc.uploaded_at)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(doc)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={fileDownloading === doc.file_path}
                          >
                            {fileDownloading === doc.file_path ? (
                              <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1" />
                            ) : (
                              <Download className="h-3 w-3 mr-1" />
                            )}
                            {fileDownloading === doc.file_path ? "..." : "Download"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(doc)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive hover:text-destructive ml-auto"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {hasNextPage && documents.length > 0 && (
          <div className="flex justify-center pt-8 pb-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              className="min-w-[150px]"
            >
              {isFetchingNextPage ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Load More Documents"
              )}
            </Button>
          </div>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
            {selectedDocument && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedDocument.type}</DialogTitle>
                  <DialogDescription>
                    {selectedDocument.name} • Uploaded on {formatDate(selectedDocument.uploaded_at)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-secondary/50 flex items-center justify-center min-h-[400px]">
                    {selectedDocument.file_type.includes('image') ? (
                      <img
                        src={selectedDocument.file_url}
                        alt={selectedDocument.name}
                        className="max-w-full h-auto max-h-[600px] rounded shadow-sm"
                      />
                    ) : (
                      <iframe
                        src={selectedDocument.file_url}
                        className="w-full h-[600px] rounded border shadow-sm"
                        title={selectedDocument.name}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(selectedDocument)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Documents;
