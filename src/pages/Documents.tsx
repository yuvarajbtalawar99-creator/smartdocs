import { useState } from "react";
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
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDocuments } from "@/integrations/supabase/hooks/useDocuments";
import { useDownload } from "@/integrations/supabase/hooks/useDownload";

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
  }))) || [];

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

      setFormData({ ...formData, file, name: formData.name || file.name });
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      file: null,
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
        setFormData({ name: "", type: "", file: null });
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

      setFormData({ name: "", type: "", file: null });
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
        ) : documents.length === 0 ? (
          <Card className="bg-secondary/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-6">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Your secure vault is empty. Upload your first document to keep it safe and accessible.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)} size="lg" className="px-8 shadow-lg shadow-primary/20">
                <Upload className="h-5 w-5 mr-2" />
                Get Started
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
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <span>{formatDate(doc.uploaded_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(doc)}
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(doc)}
                      disabled={fileDownloading === doc.file_path}
                    >
                      {fileDownloading === doc.file_path ? (
                        <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      ) : (
                        <Download className="h-3 w-3 mr-2" />
                      )}
                      {fileDownloading === doc.file_path ? "..." : "Download"}
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(doc)}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
