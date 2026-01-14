import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { 
  Receipt, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Edit, 
  Plus,
  Calendar,
  DollarSign,
  Bell,
  AlertCircle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface Bill {
  id: string;
  bill_type: string;
  amount: number;
  due_date: string;
  frequency: string;
  file_url: string;
  uploaded_at: string;
  updated_at: string;
  user_id: string;
  paid: boolean;
  reminder_sent: boolean;
}

const BILL_TYPES = [
  "Electricity",
  "Water",
  "LPG",
  "PNG (Natural Gas)",
  "Internet",
  "Mobile / Telephone",
  "Cable TV",
  "Other custom bills"
];

const FREQUENCIES = ["Weekly", "Monthly", "Yearly"];

const Bills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    bill_type: "",
    amount: "",
    due_date: new Date(),
    frequency: "Monthly",
    file: null as File | null,
  });

  useEffect(() => {
    loadBills();
    checkUpcomingBills();
  }, []);

  const loadBills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, you'd fetch from Supabase table
      const stored = localStorage.getItem(`bills_${user.id}`);
      if (stored) {
        setBills(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUpcomingBills = () => {
    const today = new Date();
    const upcoming = bills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0 && !bill.paid;
    });

    if (upcoming.length > 0) {
      toast({
        title: "Upcoming Bills",
        description: `You have ${upcoming.length} bill(s) due within 7 days.`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload PDF or image files only.",
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

      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async () => {
    if (!formData.bill_type || !formData.amount || !formData.file) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string;
        
        const newBill: Bill = {
          id: Date.now().toString(),
          bill_type: formData.bill_type,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date.toISOString(),
          frequency: formData.frequency,
          file_url: fileUrl,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          paid: false,
          reminder_sent: false,
        };

        const updated = [...bills, newBill];
        setBills(updated);
        localStorage.setItem(`bills_${user.id}`, JSON.stringify(updated));

        toast({
          title: "Bill Added Successfully",
          description: "Your bill has been stored and tracked.",
        });

        setFormData({ 
          bill_type: "", 
          amount: "", 
          due_date: new Date(), 
          frequency: "Monthly",
          file: null 
        });
        setUploadDialogOpen(false);
      };
      reader.readAsDataURL(formData.file);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to add bill.",
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

      const updated = bills.filter(bill => bill.id !== id);
      setBills(updated);
      localStorage.setItem(`bills_${user.id}`, JSON.stringify(updated));

      toast({
        title: "Bill deleted",
        description: "The bill has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete bill.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (bill: Bill) => {
    const link = document.createElement('a');
    link.href = bill.file_url;
    link.download = `${bill.bill_type}_${format(new Date(bill.due_date), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (bill: Bill) => {
    setSelectedBill(bill);
    setViewDialogOpen(true);
  };

  const markAsPaid = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = bills.map(bill => 
        bill.id === id ? { ...bill, paid: true, updated_at: new Date().toISOString() } : bill
      );
      setBills(updated);
      localStorage.setItem(`bills_${user.id}`, JSON.stringify(updated));

      toast({
        title: "Bill marked as paid",
        description: "The bill has been marked as paid.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update bill.",
        variant: "destructive",
      });
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (bill: Bill) => {
    const daysUntilDue = getDaysUntilDue(bill.due_date);
    
    if (bill.paid) {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Paid</Badge>;
    } else if (daysUntilDue < 0) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Overdue</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Due Soon</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.paid ? 0 : bill.amount), 0);
  const upcomingBills = bills.filter(bill => {
    const days = getDaysUntilDue(bill.due_date);
    return days <= 7 && days >= 0 && !bill.paid;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                💡 Bill Management
              </h1>
              <p className="text-muted-foreground">
                Track your utility bills and never miss a payment
              </p>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Bill</DialogTitle>
                  <DialogDescription>
                    Add a bill to track payments and receive reminders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bill-type">Bill Type *</Label>
                    <Select 
                      value={formData.bill_type} 
                      onValueChange={(value) => setFormData({ ...formData, bill_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bill type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BILL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Bill Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.due_date}
                          onSelect={(date) => date && setFormData({ ...formData, due_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Bill File (PDF / Image) *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                    {formData.file && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {formData.file.name}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading || !formData.bill_type || !formData.amount || !formData.file}
                    className="w-full"
                  >
                    {uploading ? "Adding..." : "Add Bill"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bills.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">₹{totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Due Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{upcomingBills.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Supported Bills Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supported Bills</CardTitle>
            <CardDescription>All bill types you can track - Click any type to add a bill</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {BILL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      bill_type: type,
                      amount: "",
                      due_date: new Date(),
                      frequency: "Monthly",
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

        {/* Bills List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bills yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first bill to start tracking
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => {
              const daysUntilDue = getDaysUntilDue(bill.due_date);
              return (
                <Card key={bill.id} className="hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Receipt className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{bill.bill_type}</CardTitle>
                          {getStatusBadge(bill)}
                        </div>
                        <CardDescription>
                          {bill.frequency} • Due {formatDate(bill.due_date)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">₹{bill.amount.toFixed(2)}</div>
                        {!bill.paid && daysUntilDue >= 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {daysUntilDue === 0 ? "Due today" : `${daysUntilDue} days left`}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(bill)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(bill)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      {!bill.paid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(bill.id)}
                          className="text-green-500 hover:text-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bill.id)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View Bill Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
            {selectedBill && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedBill.bill_type}</DialogTitle>
                  <DialogDescription>
                    {selectedBill.frequency} bill • Due {formatDate(selectedBill.due_date)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-2xl font-bold">₹{selectedBill.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedBill)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(selectedBill.due_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{selectedBill.frequency}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-secondary/50">
                    {selectedBill.file_url.includes('data:image') ? (
                      <img 
                        src={selectedBill.file_url} 
                        alt={selectedBill.bill_type}
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <iframe
                        src={selectedBill.file_url}
                        className="w-full h-96 rounded border"
                        title={selectedBill.bill_type}
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(selectedBill)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {!selectedBill.paid && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          markAsPaid(selectedBill.id);
                          setViewDialogOpen(false);
                        }}
                        className="flex-1 text-green-500 hover:text-green-600"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Paid
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleDelete(selectedBill.id);
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

export default Bills;
