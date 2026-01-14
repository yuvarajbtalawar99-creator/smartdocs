import { useState, useEffect } from "react";
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
  Image as ImageIcon,
  FileSpreadsheet,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  updated_at: string;
  user_id: string;
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load from Supabase database first
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error("Error loading from Supabase:", error);
        // Fallback to localStorage if table doesn't exist yet
        const stored = localStorage.getItem(`documents_${user.id}`);
        if (stored) {
          setDocuments(JSON.parse(stored));
        }
      } else if (data) {
        // Map Supabase data to Document interface
        setDocuments(data.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          file_url: doc.file_path.startsWith('http') ? doc.file_path : 
            `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`,
          file_type: doc.file_type,
          uploaded_at: doc.uploaded_at,
          updated_at: doc.updated_at,
          user_id: doc.user_id,
        })));
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      // Fallback to localStorage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const stored = localStorage.getItem(`documents_${user.id}`);
        if (stored) {
          setDocuments(JSON.parse(stored));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate MIME types - Allowed: PDF, PNG, JPG, Word, Excel
      // Using proper MIME types with wildcards for future-proof validation
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
      
      // Also allow wildcards for image types
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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, file, name: formData.name || file.name });
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      file: null, // User can optionally upload new file
    });
    setEditDialogOpen(true);
  };

  const handleResetForm = () => {
    setFormData({ name: "", type: "", file: null });
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

      // Generate unique file path: user_id/filename_timestamp.ext
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Uploading to Supabase Storage...", { 
        bucket: 'documents',
        filePath, 
        fileName: formData.file.name, 
        fileSize: formData.file.size,
        userId: user.id
      });

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Show the actual error to help debug
        console.error("Storage upload error:", uploadError);
        toast({
          title: "Upload Failed",
          description: `Storage error: ${uploadError.message}. Check browser console (F12) for details. Common issues: Storage policies not set up, bucket permissions, or file size limits.`,
          variant: "destructive",
          duration: 10000,
        });
        setUploading(false);
        return;
      }

      console.log("File uploaded successfully:", uploadData);

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log("Public URL:", urlData?.publicUrl);

      // Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: formData.name || formData.file.name,
          type: formData.type,
          file_path: filePath,
          file_type: formData.file.type,
          file_size: formData.file.size,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError);
        // File is uploaded but metadata failed - still show success but warn
        toast({
          title: "File Uploaded, Metadata Failed",
          description: `File uploaded to storage but couldn't save metadata: ${dbError.message}. Check if 'documents' table exists and RLS policies are set.`,
          variant: "destructive",
          duration: 10000,
        });
      } else {
        console.log("Database record created:", dbData);
      }

      // Reload documents
      await loadDocuments();

      toast({
        title: "Uploaded Successfully",
        description: "Your document has been stored securely in Supabase Storage.",
      });

      setFormData({ name: "", type: "", file: null });
      setUploadDialogOpen(false);
      setEditingDocument(null);
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
      toast({
        title: "Missing information",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If a new file is uploaded, replace the old one
      if (formData.file) {
        // Delete old file if it's in Supabase Storage
        if (editingDocument.file_url.includes('storage/v1/object/public')) {
          const urlParts = editingDocument.file_url.split('/storage/v1/object/public/documents/');
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            
            // Delete old file from Storage
            await supabase.storage
              .from('documents')
              .remove([oldFilePath]);
          }
        }

        // Upload new file
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log("Uploading new file to replace old one...", { filePath });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, formData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Fallback to localStorage if storage fails
          const reader = new FileReader();
          reader.onloadend = async () => {
            const fileUrl = reader.result as string;
            await updateDocumentMetadata(fileUrl, formData.file!.type);
          };
          reader.readAsDataURL(formData.file);
          return;
        }

        // Get public URL for new file
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Update database with new file path
        const { error: dbError } = await supabase
          .from('documents')
          .update({
            name: formData.name || formData.file.name,
            type: formData.type,
            file_path: filePath,
            file_type: formData.file.type,
            file_size: formData.file.size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id)
          .eq('user_id', user.id);

        if (dbError) {
          console.error("Database update error:", dbError);
          // Update localStorage as fallback
          await updateDocumentMetadata(urlData?.publicUrl || '', formData.file.type);
          return;
        }

        await loadDocuments();
        toast({
          title: "Document Updated",
          description: "Your document has been updated with the new file.",
        });

        setFormData({ name: "", type: "", file: null });
        setEditDialogOpen(false);
        setEditingDocument(null);
      } else {
        // Only update metadata (no new file)
        const { error: dbError } = await supabase
          .from('documents')
          .update({
            name: formData.name,
            type: formData.type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id)
          .eq('user_id', user.id);

        if (dbError) {
          console.error("Database update error:", dbError);
          // Update localStorage as fallback
          await updateDocumentMetadata(null, null);
        } else {
          await loadDocuments();
          toast({
            title: "Document Updated",
            description: "Your document details have been updated.",
          });
        }

        setFormData({ name: "", type: "", file: null });
        setEditDialogOpen(false);
        setEditingDocument(null);
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDocumentMetadata = async (newFileUrl: string | null, newFileType: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !editingDocument) return;

      // Update localStorage as fallback
      const updated = documents.map(doc => {
        if (doc.id === editingDocument.id) {
          return {
            ...doc,
            name: formData.name || doc.name,
            type: formData.type,
            file_url: newFileUrl || doc.file_url,
            file_type: newFileType || doc.file_type,
            updated_at: new Date().toISOString(),
          };
        }
        return doc;
      });

      setDocuments(updated);
      localStorage.setItem(`documents_${user.id}`, JSON.stringify(updated));

      toast({
        title: "Document Updated",
        description: "Your document has been updated (local storage).",
      });
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const docToDelete = documents.find(doc => doc.id === id);
      if (!docToDelete) return;

      // Try to delete from Supabase Storage and Database
      if (docToDelete.file_url.includes('storage/v1/object/public')) {
        // Extract file path from URL
        const urlParts = docToDelete.file_url.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          // Delete from Storage
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);

          if (storageError) {
            console.error("Storage delete error:", storageError);
          }

          // Delete from Database
          const { error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (dbError) {
            console.error("Database delete error:", dbError);
          }
        }
      } else {
        // Fallback: delete from localStorage
        const updated = documents.filter(doc => doc.id !== id);
        setDocuments(updated);
        localStorage.setItem(`documents_${user.id}`, JSON.stringify(updated));
      }

      // Reload documents
      await loadDocuments();

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

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
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

        {/* Edit Dialog */}
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
                Update document details or upload a new file to replace the existing one
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
                <Label htmlFor="edit-file">Upload New File (Optional - replaces existing file)</Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                />
                {formData.file && (
                  <p className="text-sm text-muted-foreground">
                    New file selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {editingDocument && !formData.file && (
                  <p className="text-sm text-muted-foreground">
                    Current file: {editingDocument.name}
                  </p>
                )}
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

        {/* Supported Documents Info */}
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

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first document to get started
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {getFileIcon(doc.file_type)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold mb-2">{doc.type}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground truncate">
                        {doc.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Updated: {formatDate(doc.updated_at)}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Document Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
            {selectedDocument && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedDocument.name}</DialogTitle>
                  <DialogDescription>
                    {selectedDocument.type} • Uploaded {formatDate(selectedDocument.uploaded_at)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Document Type</p>
                      <p className="font-medium">{selectedDocument.type}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">File Type</p>
                      <p className="font-medium">{selectedDocument.file_type}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-secondary/50">
                    {selectedDocument.file_type.includes('image') ? (
                      <img 
                        src={selectedDocument.file_url} 
                        alt={selectedDocument.name}
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <iframe
                        src={selectedDocument.file_url}
                        className="w-full h-96 rounded border"
                        title={selectedDocument.name}
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(selectedDocument)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleDelete(selectedDocument.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
