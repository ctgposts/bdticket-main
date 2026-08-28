import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plane,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  Phone,
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calculator,
  AlertCircle,
  CheckCircle,
  Save,
  X,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  Package,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserCheck,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { apiClient } from "../services/api";

// Types
interface UmrahGroupTicket {
  id?: string;
  group_name: string;
  package_type: "with-transport" | "without-transport";
  departure_date: string;
  return_date: string;
  ticket_count: number;
  total_cost: number;
  average_cost_per_ticket: number;
  agent_name: string;
  agent_contact?: string;
  purchase_notes?: string;
  // Flight Details
  departure_airline?: string;
  departure_flight_number?: string;
  departure_time?: string;
  departure_route?: string;
  return_airline?: string;
  return_flight_number?: string;
  return_time?: string;
  return_route?: string;
  // System fields
  remaining_tickets?: number;
  created_at?: string;
  updated_at?: string;
}

interface DateGroupedTickets {
  departure_date: string;
  return_date: string;
  group_count: number;
  total_tickets: number;
  total_cost: number;
  groups: UmrahGroupTicket[];
}

export default function UmrahGroupTickets() {
  const { toast } = useToast();
  // Removed activeTab state since we only handle with-transport now
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state - Always with-transport since without-transport is removed
  const [formData, setFormData] = useState<UmrahGroupTicket>({
    group_name: "",
    package_type: "with-transport", // Fixed to with-transport only
    departure_date: "",
    return_date: "",
    ticket_count: 0,
    total_cost: 0,
    average_cost_per_ticket: 0,
    agent_name: "",
    agent_contact: "",
    purchase_notes: "",
    // Flight Details
    departure_airline: "",
    departure_flight_number: "",
    departure_time: "",
    departure_route: "",
    return_airline: "",
    return_flight_number: "",
    return_time: "",
    return_route: "",
  });

  // Data states
  const [dateGroupedTickets, setDateGroupedTickets] = useState<
    DateGroupedTickets[]
  >([]);
  const [allGroupTickets, setAllGroupTickets] = useState<UmrahGroupTicket[]>(
    [],
  );
  const [editingTicket, setEditingTicket] = useState<UmrahGroupTicket | null>(
    null,
  );

  // Load data
  useEffect(() => {
    loadGroupTickets();
  }, []); // Removed activeTab dependency since we only have with-transport

  // Auto-calculate average cost
  useEffect(() => {
    if (formData.ticket_count > 0 && formData.total_cost > 0) {
      const averageCost = Math.round(
        formData.total_cost / formData.ticket_count,
      );
      setFormData((prev) => ({
        ...prev,
        average_cost_per_ticket: averageCost,
      }));
    }
  }, [formData.ticket_count, formData.total_cost]);

  const loadGroupTickets = async () => {
    try {
      setLoading(true);
      const [groupedData, allTickets] = await Promise.all([
        apiClient.getUmrahGroupTicketsByDates("with-transport"),
        apiClient.getUmrahGroupTickets("with-transport", searchTerm),
      ]);

      setDateGroupedTickets(groupedData || []);
      setAllGroupTickets(allTickets || []);
    } catch (error) {
      console.error("Error loading group tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load group tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      if (editingTicket) {
        await apiClient.updateUmrahGroupTicket(editingTicket.id!, formData);
        toast({
          title: "Success",
          description: "Group ticket updated successfully",
        });
      } else {
        await apiClient.createUmrahGroupTicket({
          ...formData,
          package_type: "with-transport", // Always with-transport
        });
        toast({
          title: "Success",
          description: "Group ticket created successfully",
        });
      }

      resetForm();
      setIsFormDialogOpen(false);
      loadGroupTickets();
    } catch (error) {
      console.error("Error saving group ticket:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save group ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.group_name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.departure_date || !formData.return_date) {
      toast({
        title: "Error",
        description: "Both departure and return dates are required",
        variant: "destructive",
      });
      return false;
    }
    if (new Date(formData.return_date) <= new Date(formData.departure_date)) {
      toast({
        title: "Error",
        description: "Return date must be after departure date",
        variant: "destructive",
      });
      return false;
    }
    if (formData.ticket_count <= 0) {
      toast({
        title: "Error",
        description: "Ticket count must be greater than 0",
        variant: "destructive",
      });
      return false;
    }
    if (formData.total_cost <= 0) {
      toast({
        title: "Error",
        description: "Total cost must be greater than 0",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.agent_name.trim()) {
      toast({
        title: "Error",
        description: "Agent name is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      group_name: "",
      package_type: "with-transport", // Always with-transport
      departure_date: "",
      return_date: "",
      ticket_count: 0,
      total_cost: 0,
      average_cost_per_ticket: 0,
      agent_name: "",
      agent_contact: "",
      purchase_notes: "",
      // Flight Details
      departure_airline: "",
      departure_flight_number: "",
      departure_time: "",
      departure_route: "",
      return_airline: "",
      return_flight_number: "",
      return_time: "",
      return_route: "",
    });
    setEditingTicket(null);
  };

  const handleEdit = (ticket: UmrahGroupTicket) => {
    setFormData(ticket);
    setEditingTicket(ticket);
    setIsFormDialogOpen(true);
  };

  const handleDelete = async (
    ticketId: string,
    forceDelete: boolean = false,
  ) => {
    // Find the group ticket to check assigned passengers
    const groupTicket = groupTickets.find((g) => g.id === ticketId);
    const assignedCount = groupTicket
      ? groupTicket.ticket_count - groupTicket.remaining_tickets
      : 0;

    let confirmMessage = "আপনি কি নিশ্চিত যে এই গ্রুপ টিকেট ডিলিট ���রতে চান?";

    if (assignedCount > 0 && !forceDelete) {
      confirmMessage = `⚠️ সতর্কত���!\n\nএই গ্রুপ টিকেটে ${assignedCount}জন যাত্রী নিযুক্ত আছে।\n\nএটি ডিলিট করলে সকল যাত্রীর assignment মুছে যাবে।\n\nতবুও ডিলিট করতে চান?`;
    } else if (forceDelete) {
      confirmMessage = `🔴 জোরপূর্বক ডিলিট!\n\nআপনি ${assignedCount}জন যাত্রী সহ এই গ্রুপ টিকেট মুছে ফেলতে চাচ্ছেন।\n\n⚠️ এই কাজটি পূর��বাবস্থায় ফেরানো যাবে না!\n\nনিশ্চিত করুন?`;
    }

    if (!confirm(confirmMessage)) return;

    try {
      await apiClient.deleteUmrahGroupTicket(ticketId, forceDelete);
      toast({
        title: "সফল হয��েছে",
        description: "গ্রুপ টিকেট সফলভাবে ডিল��ট করা হয়েছে",
      });
      loadGroupTickets();
    } catch (error: any) {
      console.error("Error deleting group ticket:", error);

      // Check if this error supports force delete
      if (error.canForceDelete && !forceDelete) {
        const passengerList =
          error.details?.passengers
            ?.map(
              (p: any) =>
                `• ${p.name} (${p.type === "with-transport" ? "PNR: " + p.pnr : "Passport: " + p.passport})`,
            )
            .join("\n") || "";

        const forceConfirm = confirm(
          `⚠️ এই গ্রুপ টিকেটে ${error.details?.assignedCount || 0}টি যাত্রী নিযুক্ত আছে:\n\n${passengerList}\n\n🔴 জোরপূর্বক ডিলিট করতে চান?\n\n(এতে সকল যাত্রীর assignment মুছে যাবে)`,
        );

        if (forceConfirm) {
          return handleDelete(ticketId, true); // Retry with force
        }
      } else {
        toast({
          title: "ত্রুট��",
          description:
            error instanceof Error
              ? error.message
              : "গ্রুপ টিকেট ডিলিট করতে ব্যর্থ",
          variant: "destructive",
        });
      }
    }
  };

  const viewAssignedPassengers = async (
    ticketId: string,
    groupName: string,
  ) => {
    try {
      // This would need an API endpoint to get assigned passengers
      // For now, show a simple info dialog
      const confirmed = confirm(
        `গ্রুপ টিকেট: ${groupName}\n\nনিযুক্ত যাত্রীদের তালিকা দেখতে চান?\n\n(নোট: এই গ্রুপ টিকেটে যাত্রী নিযুক্ত থাকার কারণে এটি ডিলিট করা যাবে না। প্রথমে যাত্রীদের অন্য গ্রুপে সরান বা unassign করুন।)`,
      );

      if (confirmed) {
        toast({
          title: "তথ্য",
          description:
            "যাত্রীদের বিস্তারিত তথ্যের জন্য Umrah Management সেকশনে যান।",
        });
      }
    } catch (error) {
      console.error("Error viewing passengers:", error);
      toast({
        title: "ত্রুটি",
        description: "যাত্রীদের তথ��য লোড করতে ব্যর্থ",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async (groupId?: string) => {
    try {
      const element = document.getElementById(
        groupId ? `group-${groupId}` : "umrah-groups-container",
      );
      if (!element) return;

      // Create a simple PDF export (basic implementation)
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Umrah Group Tickets - With Transport</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .group { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; }
            .group-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .stats { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .stat { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Umrah Group Tickets</h1>
            <h2>With Transport</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          ${element.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full animate-glow animate-float">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="responsive-heading font-heading font-bold velvet-text">
                Umrah Group Ticket Management
              </h1>
              <p className="text-foreground/70 font-body">
                পৃথক ওমরা গ্রুপের জন্য টিকেট ক্রয় ও ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => exportToPDF()}
              variant="outline"
              size="sm"
              className="touch-target"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="velvet-button text-primary-foreground touch-target"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Group Purchase
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Package Type Header - Only With Transport */}
      <div className="luxury-card border-0 p-4 bg-primary/5">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 text-primary">
            <Plane className="h-5 w-5" />
            <h2 className="text-lg font-heading font-bold">
              ওমরাহ গ্রুপ টিকেট (পরিবহন সহ)
            </h2>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2 font-body">
          গ্রুপ টিকেট ক্রয় শুধুমাত্র "পরিবহন সহ" ওমরাহ প্যাকেজের জন্য প্রযোজ্য
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by group name or agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-body"
          />
        </div>
        <Button
          onClick={loadGroupTickets}
          variant="outline"
          disabled={loading}
          className="touch-target"
        >
          <Filter className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Date Grouped Cards */}
      <div id="umrah-groups-container" className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 animate-spin text-primary" />
              <span className="font-body">Loading group tickets...</span>
            </div>
          </div>
        ) : dateGroupedTickets.length > 0 ? (
          dateGroupedTickets.map((dateGroup, index) => (
            <motion.div
              key={`${dateGroup.departure_date}_${dateGroup.return_date}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              id={`group-${index}`}
              className="space-y-4"
            >
              <Card className="luxury-card border-0">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="font-heading velvet-text flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {new Date(
                          dateGroup.departure_date,
                        ).toLocaleDateString()}
                        <ArrowRight className="h-4 w-4" />
                        {new Date(dateGroup.return_date).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription className="font-body">
                        Transport সহ ওমরা প্যাকেজ
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => exportToPDF(index.toString())}
                      variant="outline"
                      size="sm"
                      className="touch-target"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Group
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Stats */}
                  <div className="responsive-grid gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-heading font-bold text-blue-700">
                        {dateGroup.group_count}
                      </div>
                      <p className="text-sm text-blue-600 font-body">Groups</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-heading font-bold text-green-700">
                        {dateGroup.total_tickets}
                      </div>
                      <p className="text-sm text-green-600 font-body">
                        Total Tickets
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-heading font-bold text-purple-700">
                        ৳{dateGroup.total_cost.toLocaleString()}
                      </div>
                      <p className="text-sm text-purple-600 font-body">
                        Total Investment
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-heading font-bold text-orange-700">
                        ৳
                        {Math.round(
                          dateGroup.total_cost / dateGroup.total_tickets,
                        ).toLocaleString()}
                      </div>
                      <p className="text-sm text-orange-600 font-body">
                        Avg. per Ticket
                      </p>
                    </div>
                  </div>

                  {/* Groups Table */}
                  <div className="mobile-table-scroll">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Group Name</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Flight Details</TableHead>
                          <TableHead>Tickets</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Avg Cost</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateGroup.groups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">
                              {group.group_name}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {group.agent_name}
                                </div>
                                {group.agent_contact && (
                                  <div className="text-sm text-muted-foreground">
                                    {group.agent_contact}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {group.departure_airline && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <Plane className="h-3 w-3" />
                                    {group.departure_airline}{" "}
                                    {group.departure_flight_number}
                                  </div>
                                )}
                                {group.return_airline && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Plane className="h-3 w-3 rotate-180" />
                                    {group.return_airline}{" "}
                                    {group.return_flight_number}
                                  </div>
                                )}
                                {!group.departure_airline &&
                                  !group.return_airline && (
                                    <span className="text-muted-foreground">
                                      No flight details
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {group.ticket_count} tickets
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                ৳{group.total_cost.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              ৳{group.average_cost_per_ticket.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={() => handleEdit(group)}
                                  variant="outline"
                                  size="sm"
                                  className="touch-target"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                {/* Show passengers button if there are assigned passengers */}
                                {group.ticket_count - group.remaining_tickets >
                                  0 && (
                                  <Button
                                    onClick={() =>
                                      viewAssignedPassengers(
                                        group.id!,
                                        group.group_name,
                                      )
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="touch-target text-blue-600 hover:text-blue-700"
                                    title={`${group.ticket_count - group.remaining_tickets} জন যাত্রী নিযুক্ত`}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}

                                <Button
                                  onClick={() => handleDelete(group.id!)}
                                  variant="outline"
                                  size="sm"
                                  className="touch-target text-red-600 hover:text-red-700"
                                  disabled={
                                    group.ticket_count -
                                      group.remaining_tickets >
                                    0
                                  }
                                  title={
                                    group.ticket_count -
                                      group.remaining_tickets >
                                    0
                                      ? "যাত্রী নিযুক্�� থাকায় ডিলিট করা যাবে না"
                                      : "গ্রুপ টিকেট ডিলিট করুন"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-heading font-bold text-foreground mb-2">
              No Group Tickets Found
            </h3>
            <p className="text-foreground/70 font-body mb-4">
              Start by creating your first group ticket purchase for{" "}
              transport সহ
              Umrah packages.
            </p>
            <Button
              onClick={() => setIsFormDialogOpen(true)}
              className="velvet-button text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Group Purchase
            </Button>
          </motion.div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingTicket
                ? "Edit Group Ticket"
                : "New Group Ticket Purchase"}
            </DialogTitle>
            <DialogDescription>
              Transport সহ
              ওমরা গ্রুপের জন্য টিকেট ক্রয়
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Group Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={formData.group_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        group_name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Ramadan Group 2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="agentName">Agent Name *</Label>
                  <Input
                    id="agentName"
                    value={formData.agent_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        agent_name: e.target.value,
                      }))
                    }
                    placeholder="Agent or agency name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="departureDate">Departure Date *</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        departure_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="returnDate">Return Date *</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        return_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Flight Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Flight Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departure Flight Details */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Departure Flight (যাওয়ার ফ্লাইট)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="departureAirline">Airline Name</Label>
                      <Input
                        id="departureAirline"
                        value={formData.departure_airline || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            departure_airline: e.target.value,
                          }))
                        }
                        placeholder="e.g., Biman Bangladesh"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departureFlightNumber">
                        Flight Number
                      </Label>
                      <Input
                        id="departureFlightNumber"
                        value={formData.departure_flight_number || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            departure_flight_number: e.target.value,
                          }))
                        }
                        placeholder="e.g., BG147"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departureTime">Departure Time</Label>
                      <Input
                        id="departureTime"
                        type="time"
                        value={formData.departure_time || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            departure_time: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="departureRoute">Route</Label>
                      <Input
                        id="departureRoute"
                        value={formData.departure_route || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            departure_route: e.target.value,
                          }))
                        }
                        placeholder="e.g., DAC → JED"
                      />
                    </div>
                  </div>
                </div>

                {/* Return Flight Details */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    <Plane className="h-4 w-4 rotate-180" />
                    Return Flight (ফিরতি ফ্লাইট)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="returnAirline">Airline Name</Label>
                      <Input
                        id="returnAirline"
                        value={formData.return_airline || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            return_airline: e.target.value,
                          }))
                        }
                        placeholder="e.g., Biman Bangladesh"
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnFlightNumber">Flight Number</Label>
                      <Input
                        id="returnFlightNumber"
                        value={formData.return_flight_number || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            return_flight_number: e.target.value,
                          }))
                        }
                        placeholder="e.g., BG148"
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnTime">Return Time</Label>
                      <Input
                        id="returnTime"
                        type="time"
                        value={formData.return_time || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            return_time: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnRoute">Route</Label>
                      <Input
                        id="returnRoute"
                        value={formData.return_route || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            return_route: e.target.value,
                          }))
                        }
                        placeholder="e.g., JED → DAC"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ticketCount">Number of Tickets *</Label>
                  <Input
                    id="ticketCount"
                    type="number"
                    min="1"
                    value={formData.ticket_count}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ticket_count: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g., 20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalCost">Total Cost (৳) *</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    min="0"
                    value={formData.total_cost}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        total_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g., 500000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="avgCost">Average Cost per Ticket (৳)</Label>
                  <Input
                    id="avgCost"
                    type="number"
                    value={formData.average_cost_per_ticket}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentContact">Agent Contact</Label>
                  <Input
                    id="agentContact"
                    value={formData.agent_contact || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        agent_contact: e.target.value,
                      }))
                    }
                    placeholder="Phone or email"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="purchaseNotes">Purchase Notes</Label>
                  <Textarea
                    id="purchaseNotes"
                    value={formData.purchase_notes || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        purchase_notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes about this purchase..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="velvet-button text-primary-foreground"
              >
                {loading
                  ? "Saving..."
                  : editingTicket
                    ? "Update Group"
                    : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
