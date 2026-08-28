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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { apiClient } from "../services/api";
import {
  validateBangladeshiPhone,
  validateEmailAddress,
} from "../lib/validation";
import UmrahGroupTickets from "./UmrahGroupTickets";

// Types for Umrah packages
interface UmrahWithTransport {
  id?: string;
  passengerName: string;
  pnr: string;
  passportNumber: string;
  flightAirlineName: string;
  departureDate: string;
  returnDate: string;
  approvedBy: string;
  referenceAgency: string;
  emergencyFlightContact: string;
  passengerMobile: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UmrahWithoutTransport {
  id?: string;
  flightDepartureDate: string;
  returnDate: string;
  passengerName: string;
  passportNumber: string;
  entryRecordedBy: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  lastPaymentDate: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

type PackageType = "with-transport" | "without-transport" | "group-tickets";

export default function UmrahManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PackageType>("with-transport");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [withTransportForm, setWithTransportForm] =
    useState<UmrahWithTransport>({
      passengerName: "",
      pnr: "",
      passportNumber: "",
      flightAirlineName: "",
      departureDate: "",
      returnDate: "",
      approvedBy: "",
      referenceAgency: "",
      emergencyFlightContact: "",
      passengerMobile: "",
    });

  const [withoutTransportForm, setWithoutTransportForm] =
    useState<UmrahWithoutTransport>({
      flightDepartureDate: "",
      returnDate: "",
      passengerName: "",
      passportNumber: "",
      entryRecordedBy: "",
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      lastPaymentDate: "",
      remarks: "",
    });

  const [withTransportRecords, setWithTransportRecords] = useState<
    UmrahWithTransport[]
  >([]);
  const [withoutTransportRecords, setWithoutTransportRecords] = useState<
    UmrahWithoutTransport[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-population states
  const [availableGroupTickets, setAvailableGroupTickets] = useState<any[]>([]);
  const [showGroupSuggestion, setShowGroupSuggestion] = useState(false);
  const [selectedGroupTicket, setSelectedGroupTicket] = useState<any>(null);

  // Editing states
  const [isEditingWithTransport, setIsEditingWithTransport] = useState(false);
  const [isEditingWithoutTransport, setIsEditingWithoutTransport] =
    useState(false);
  const [editingWithTransportRecord, setEditingWithTransportRecord] =
    useState<UmrahWithTransport | null>(null);
  const [editingWithoutTransportRecord, setEditingWithoutTransportRecord] =
    useState<UmrahWithoutTransport | null>(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");

  // Bulk operations states
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadRecords();
  }, []);

  // Auto-calculate remaining amount for without transport
  useEffect(() => {
    const remaining =
      withoutTransportForm.totalAmount - withoutTransportForm.amountPaid;
    setWithoutTransportForm((prev) => ({
      ...prev,
      remainingAmount: remaining >= 0 ? remaining : 0,
    }));
  }, [withoutTransportForm.totalAmount, withoutTransportForm.amountPaid]);

  // Check for available group tickets when dates change
  const checkAvailableGroupTickets = async (
    packageType: "with-transport" | "without-transport",
    departureDate: string,
    returnDate: string,
  ) => {
    if (!departureDate || !returnDate) return;

    try {
      const availableTickets = await apiClient.getAvailableGroupTickets(
        packageType,
        departureDate,
        returnDate,
      );

      setAvailableGroupTickets(availableTickets);
      setShowGroupSuggestion(availableTickets.length > 0);
    } catch (error) {
      console.error("Error checking available group tickets:", error);
      setAvailableGroupTickets([]);
      setShowGroupSuggestion(false);
    }
  };

  // Auto-populate form with group ticket data
  const populateFromGroupTicket = (groupTicket: any) => {
    setSelectedGroupTicket(groupTicket);

    if (activeTab === "with-transport") {
      // Generate PNR based on group ticket flight details
      const generatedPnr = generatePNR(groupTicket);

      setWithTransportForm((prev) => ({
        ...prev,
        // Flight and airline details from group ticket
        flightAirlineName:
          groupTicket.departure_airline || prev.flightAirlineName,
        departureDate: groupTicket.departure_date,
        returnDate: groupTicket.return_date,
        // Auto-generated PNR
        pnr: generatedPnr,
        // Reference agency from group ticket
        referenceAgency: groupTicket.agent_name || prev.referenceAgency,
      }));
    } else {
      setWithoutTransportForm((prev) => ({
        ...prev,
        flightDepartureDate: groupTicket.departure_date,
        returnDate: groupTicket.return_date,
      }));
    }

    setShowGroupSuggestion(false);

    toast({
      title: "Auto-populated from Group Ticket",
      description: `ফ্লাইট তথ্য অটো ফিল হয়েছে: ${groupTicket.group_name} (${groupTicket.remaining_tickets} টিকেট বাকি)`,
    });
  };

  // Generate PNR based on group ticket details
  const generatePNR = (groupTicket: any): string => {
    const flightNumber = groupTicket.departure_flight_number || "GRP";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${flightNumber}${timestamp}${random}`;
  };

  // Check for available group tickets when with-transport dates change
  useEffect(() => {
    if (
      activeTab === "with-transport" &&
      withTransportForm.departureDate &&
      withTransportForm.returnDate
    ) {
      checkAvailableGroupTickets(
        "with-transport",
        withTransportForm.departureDate,
        withTransportForm.returnDate,
      );
    }
  }, [
    withTransportForm.departureDate,
    withTransportForm.returnDate,
    activeTab,
  ]);

  // Group tickets are only available for with-transport packages
  // Removed without-transport group ticket checking

  const loadRecords = async () => {
    try {
      setLoading(true);
      const [withTransport, withoutTransport] = await Promise.all([
        apiClient.getUmrahWithTransport(),
        apiClient.getUmrahWithoutTransport(),
      ]);
      setWithTransportRecords(withTransport || []);
      setWithoutTransportRecords(withoutTransport || []);
    } catch (error) {
      console.error("Error loading records:", error);
      toast({
        title: "Error",
        description: "Failed to load records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateWithTransportForm = (
    form: UmrahWithTransport,
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Enhanced passenger name validation
    if (!form.passengerName?.trim()) {
      errors.passengerName = "Passenger name is required";
    } else if (form.passengerName.trim().length < 2) {
      errors.passengerName = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(form.passengerName)) {
      errors.passengerName = "Name contains invalid characters";
    }

    // Enhanced PNR validation
    if (!form.pnr?.trim()) {
      errors.pnr = "PNR is required";
    } else if (form.pnr.trim().length < 5) {
      errors.pnr = "PNR must be at least 5 characters";
    }

    // Enhanced passport validation
    if (!form.passportNumber?.trim()) {
      errors.passportNumber = "Passport number is required";
    } else if (
      !/^[A-Z0-9]{6,9}$/.test(form.passportNumber.replace(/\s/g, ""))
    ) {
      errors.passportNumber = "Invalid passport format";
    }

    if (!form.flightAirlineName?.trim()) {
      errors.flightAirlineName = "Flight/Airline name is required";
    }

    // Enhanced date validation
    if (!form.departureDate) {
      errors.departureDate = "Departure date is required";
    } else {
      const departure = new Date(form.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (departure < today) {
        errors.departureDate = "Cannot be in the past";
      }
    }

    if (!form.returnDate) {
      errors.returnDate = "Return date is required";
    }

    if (!form.approvedBy?.trim()) {
      errors.approvedBy = "Approved by is required";
    }

    if (!form.referenceAgency?.trim()) {
      errors.referenceAgency = "Reference agency is required";
    }

    // Enhanced phone validation
    if (!form.emergencyFlightContact?.trim()) {
      errors.emergencyFlightContact = "Emergency contact is required";
    } else if (!validateBangladeshiPhone(form.emergencyFlightContact)) {
      errors.emergencyFlightContact = "Invalid phone format (+880XXXXXXXXX)";
    }

    if (!form.passengerMobile?.trim()) {
      errors.passengerMobile = "Passenger mobile is required";
    } else if (!validateBangladeshiPhone(form.passengerMobile)) {
      errors.passengerMobile = "Invalid phone format (+880XXXXXXXXX)";
    }

    // Enhanced date logic validation
    if (form.departureDate && form.returnDate) {
      const departure = new Date(form.departureDate);
      const returnDate = new Date(form.returnDate);
      if (returnDate <= departure) {
        errors.returnDate = "Must be after departure date";
      } else {
        const daysDiff =
          (returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) {
          errors.returnDate = "Minimum 7 days required";
        } else if (daysDiff > 90) {
          errors.returnDate = "Maximum 90 days allowed";
        }
      }
    }

    return errors;
  };

  const validateWithoutTransportForm = (
    form: UmrahWithoutTransport,
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!form.flightDepartureDate)
      errors.flightDepartureDate = "Departure date is required";
    if (!form.returnDate) errors.returnDate = "Return date is required";
    if (!form.passengerName.trim())
      errors.passengerName = "Passenger name is required";
    if (!form.passportNumber.trim())
      errors.passportNumber = "Passport number is required";
    if (!form.entryRecordedBy.trim())
      errors.entryRecordedBy = "Entry recorded by is required";
    if (form.totalAmount <= 0)
      errors.totalAmount = "Total amount must be greater than 0";
    if (form.amountPaid < 0)
      errors.amountPaid = "Amount paid cannot be negative";
    if (form.amountPaid > form.totalAmount)
      errors.amountPaid = "Amount paid cannot exceed total amount";

    // Date validation
    if (form.flightDepartureDate && form.returnDate) {
      const departure = new Date(form.flightDepartureDate);
      const returnDate = new Date(form.returnDate);
      if (returnDate <= departure) {
        errors.returnDate = "Return date must be after departure date";
      }
    }

    return errors;
  };

  const handleSubmitWithTransport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditingWithTransport) {
      await handleUpdateWithTransport(e);
      return;
    }

    const formErrors = validateWithTransportForm(withTransportForm);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Transform camelCase to snake_case for API
      const apiData = {
        passenger_name: withTransportForm.passengerName,
        pnr: withTransportForm.pnr,
        passport_number: withTransportForm.passportNumber,
        flight_airline_name: withTransportForm.flightAirlineName,
        departure_date: withTransportForm.departureDate,
        return_date: withTransportForm.returnDate,
        approved_by: withTransportForm.approvedBy,
        reference_agency: withTransportForm.referenceAgency,
        emergency_flight_contact: withTransportForm.emergencyFlightContact,
        passenger_mobile: withTransportForm.passengerMobile,
        // Include group ticket reference for auto-deduction
        group_ticket_id: selectedGroupTicket?.id,
      };

      const newRecord = await apiClient.createUmrahWithTransport(apiData);
      setWithTransportRecords((prev) => [newRecord, ...prev]);

      // Show success with ticket deduction info
      const deductionMessage = selectedGroupTicket
        ? ` (১টি টিকেট কাটা হয়েছে ${selectedGroupTicket.group_name} থেকে)`
        : "";

      toast({
        title: "সফল হয়েছে",
        description: `উমরাহ যাত্রী সফলভাবে যোগ করা হয়েছে${deductionMessage}`,
      });

      setIsFormDialogOpen(false);
      resetWithTransportForm();

      // Reload data to reflect ticket deduction
      if (selectedGroupTicket) {
        loadRecords();
      }
    } catch (error) {
      console.error("Umrah with transport creation error:", error);
      console.log("Form data sent:", apiData);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithoutTransport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditingWithoutTransport) {
      await handleUpdateWithoutTransport(e);
      return;
    }

    const formErrors = validateWithoutTransportForm(withoutTransportForm);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Transform camelCase to snake_case for API
      const apiData = {
        flight_departure_date: withoutTransportForm.flightDepartureDate,
        return_date: withoutTransportForm.returnDate,
        passenger_name: withoutTransportForm.passengerName,
        passport_number: withoutTransportForm.passportNumber,
        entry_recorded_by: withoutTransportForm.entryRecordedBy,
        total_amount: withoutTransportForm.totalAmount,
        amount_paid: withoutTransportForm.amountPaid,
        last_payment_date: withoutTransportForm.lastPaymentDate || undefined,
        remarks: withoutTransportForm.remarks || undefined,
        // Include group ticket reference for auto-deduction
        group_ticket_id: selectedGroupTicket?.id,
      };
      const newRecord = await apiClient.createUmrahWithoutTransport(apiData);
      setWithoutTransportRecords((prev) => [newRecord, ...prev]);

      // Show success with ticket deduction info
      const deductionMessage = selectedGroupTicket
        ? ` (১টি টিকেট কাটা হয়েছে ${selectedGroupTicket.group_name} থ��কে)`
        : "";

      toast({
        title: "সফল হয়েছে",
        description: `উমরাহ যাত্রী সফলভাবে যোগ করা হয়েছে${deductionMessage}`,
      });

      setIsFormDialogOpen(false);
      resetWithoutTransportForm();

      // Reload data to reflect ticket deduction
      if (selectedGroupTicket) {
        loadRecords();
      }
    } catch (error) {
      console.error("Umrah without transport creation error:", error);
      console.log("Form data sent:", apiData);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetWithTransportForm = () => {
    setWithTransportForm({
      passengerName: "",
      pnr: "",
      passportNumber: "",
      flightAirlineName: "",
      departureDate: "",
      returnDate: "",
      approvedBy: "",
      referenceAgency: "",
      emergencyFlightContact: "",
      passengerMobile: "",
    });
    setErrors({});
    setIsEditingWithTransport(false);
    setEditingWithTransportRecord(null);
    setSelectedGroupTicket(null);
    setShowGroupSuggestion(false);
    setAvailableGroupTickets([]);
  };

  const resetWithoutTransportForm = () => {
    setWithoutTransportForm({
      flightDepartureDate: "",
      returnDate: "",
      passengerName: "",
      passportNumber: "",
      entryRecordedBy: "",
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      lastPaymentDate: "",
      remarks: "",
    });
    setErrors({});
    setIsEditingWithoutTransport(false);
    setEditingWithoutTransportRecord(null);
    setSelectedGroupTicket(null);
    setShowGroupSuggestion(false);
    setAvailableGroupTickets([]);
  };

  // Edit handlers for with-transport
  const handleEditWithTransport = (record: UmrahWithTransport) => {
    setEditingWithTransportRecord(record);
    setWithTransportForm({
      passengerName: record.passengerName || record.passenger_name || "",
      pnr: record.pnr || "",
      passportNumber: record.passportNumber || record.passport_number || "",
      flightAirlineName:
        record.flightAirlineName || record.flight_airline_name || "",
      departureDate: record.departureDate || record.departure_date || "",
      returnDate: record.returnDate || record.return_date || "",
      approvedBy: record.approvedBy || record.approved_by || "",
      referenceAgency: record.referenceAgency || record.reference_agency || "",
      emergencyFlightContact:
        record.emergencyFlightContact || record.emergency_flight_contact || "",
      passengerMobile: record.passengerMobile || record.passenger_mobile || "",
    });
    setIsEditingWithTransport(true);
    setIsFormDialogOpen(true);
  };

  const handleUpdateWithTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateWithTransportForm(withTransportForm);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!editingWithTransportRecord?.id) return;

    try {
      setLoading(true);
      const apiData = {
        passenger_name: withTransportForm.passengerName,
        pnr: withTransportForm.pnr,
        passport_number: withTransportForm.passportNumber,
        flight_airline_name: withTransportForm.flightAirlineName,
        departure_date: withTransportForm.departureDate,
        return_date: withTransportForm.returnDate,
        approved_by: withTransportForm.approvedBy,
        reference_agency: withTransportForm.referenceAgency,
        emergency_flight_contact: withTransportForm.emergencyFlightContact,
        passenger_mobile: withTransportForm.passengerMobile,
      };

      await apiClient.updateUmrahWithTransport(
        editingWithTransportRecord.id,
        apiData,
      );

      toast({
        title: "Success",
        description: "Umrah with transport record updated successfully",
      });

      setIsFormDialogOpen(false);
      setIsEditingWithTransport(false);
      setEditingWithTransportRecord(null);
      resetWithTransportForm();
      loadRecords();
    } catch (error) {
      console.error("Umrah with transport update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWithTransport = async (recordId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this Umrah with transport record? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteUmrahWithTransport(recordId);

      toast({
        title: "Success",
        description: "Umrah with transport record deleted successfully",
      });

      loadRecords();
    } catch (error) {
      console.error("Umrah with transport delete error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers for without-transport
  const handleEditWithoutTransport = (record: UmrahWithoutTransport) => {
    setEditingWithoutTransportRecord(record);
    setWithoutTransportForm({
      flightDepartureDate:
        record.flightDepartureDate || record.flight_departure_date || "",
      returnDate: record.returnDate || record.return_date || "",
      passengerName: record.passengerName || record.passenger_name || "",
      passportNumber: record.passportNumber || record.passport_number || "",
      entryRecordedBy: record.entryRecordedBy || record.entry_recorded_by || "",
      totalAmount: record.totalAmount || record.total_amount || 0,
      amountPaid: record.amountPaid || record.amount_paid || 0,
      remainingAmount: record.remainingAmount || record.remaining_amount || 0,
      lastPaymentDate: record.lastPaymentDate || record.last_payment_date || "",
      remarks: record.remarks || "",
    });
    setIsEditingWithoutTransport(true);
    setIsFormDialogOpen(true);
  };

  const handleUpdateWithoutTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateWithoutTransportForm(withoutTransportForm);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!editingWithoutTransportRecord?.id) return;

    try {
      setLoading(true);
      const apiData = {
        flight_departure_date: withoutTransportForm.flightDepartureDate,
        return_date: withoutTransportForm.returnDate,
        passenger_name: withoutTransportForm.passengerName,
        passport_number: withoutTransportForm.passportNumber,
        entry_recorded_by: withoutTransportForm.entryRecordedBy,
        total_amount: withoutTransportForm.totalAmount,
        amount_paid: withoutTransportForm.amountPaid,
        last_payment_date: withoutTransportForm.lastPaymentDate || undefined,
        remarks: withoutTransportForm.remarks || undefined,
      };

      await apiClient.updateUmrahWithoutTransport(
        editingWithoutTransportRecord.id,
        apiData,
      );

      toast({
        title: "Success",
        description: "Umrah without transport record updated successfully",
      });

      setIsFormDialogOpen(false);
      setIsEditingWithoutTransport(false);
      setEditingWithoutTransportRecord(null);
      resetWithoutTransportForm();
      loadRecords();
    } catch (error) {
      console.error("Umrah without transport update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWithoutTransport = async (recordId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this Umrah without transport record? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteUmrahWithoutTransport(recordId);

      toast({
        title: "Success",
        description: "Umrah without transport record deleted successfully",
      });

      loadRecords();
    } catch (error) {
      console.error("Umrah without transport delete error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Bulk operations handlers
  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set([
        ...filteredWithTransportRecords.map((r) => r.id!),
        ...filteredWithoutTransportRecords.map((r) => r.id!),
      ]);
      setSelectedRecords(allIds);
      setShowBulkActions(allIds.size > 0);
    } else {
      setSelectedRecords(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "Warning",
        description: "No records selected for deletion",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedRecords.size} selected records? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const promises: Promise<any>[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Delete with-transport records
      filteredWithTransportRecords.forEach((record) => {
        if (selectedRecords.has(record.id!)) {
          promises.push(
            apiClient
              .deleteUmrahWithTransport(record.id!)
              .then(() => successCount++)
              .catch((error) => {
                console.error(
                  `Failed to delete with-transport record ${record.id}:`,
                  error,
                );
                errorCount++;
              }),
          );
        }
      });

      // Delete without-transport records
      filteredWithoutTransportRecords.forEach((record) => {
        if (selectedRecords.has(record.id!)) {
          promises.push(
            apiClient
              .deleteUmrahWithoutTransport(record.id!)
              .then(() => successCount++)
              .catch((error) => {
                console.error(
                  `Failed to delete without-transport record ${record.id}:`,
                  error,
                );
                errorCount++;
              }),
          );
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `${successCount} records deleted successfully`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successCount} records deleted, ${errorCount} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete any records",
          variant: "destructive",
        });
      }

      setSelectedRecords(new Set());
      setShowBulkActions(false);
      loadRecords();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk deletion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const exportToCSV = (records: any[], filename: string) => {
    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "No records to export",
        variant: "destructive",
      });
      return;
    }

    // Create headers with proper formatting
    const headers =
      activeTab === "with-transport"
        ? [
            "Passenger Name",
            "PNR",
            "Passport Number",
            "Flight/Airline",
            "Departure Date",
            "Return Date",
            "Approved By",
            "Reference Agency",
            "Emergency Contact",
            "Passenger Mobile",
            "Created Date",
          ]
        : [
            "Passenger Name",
            "Passport Number",
            "Departure Date",
            "Return Date",
            "Entry Recorded By",
            "Total Amount (BDT)",
            "Amount Paid (BDT)",
            "Remaining Amount (BDT)",
            "Last Payment Date",
            "Remarks",
            "Created Date",
          ];

    // Format data based on package type
    const csvData = records.map((record) => {
      if (activeTab === "with-transport") {
        return [
          record.passenger_name || record.passengerName,
          record.pnr,
          record.passport_number || record.passportNumber,
          record.flight_airline_name || record.flightAirlineName,
          record.departure_date || record.departureDate,
          record.return_date || record.returnDate,
          record.approved_by || record.approvedBy,
          record.reference_agency || record.referenceAgency,
          record.emergency_flight_contact || record.emergencyFlightContact,
          record.passenger_mobile || record.passengerMobile,
          record.created_at ||
            record.createdAt ||
            new Date().toISOString().split("T")[0],
        ];
      } else {
        return [
          record.passenger_name || record.passengerName,
          record.passport_number || record.passportNumber,
          record.flight_departure_date || record.flightDepartureDate,
          record.return_date || record.returnDate,
          record.entry_recorded_by || record.entryRecordedBy,
          record.total_amount || record.totalAmount || 0,
          record.amount_paid || record.amountPaid || 0,
          record.remaining_amount || record.remainingAmount || 0,
          record.last_payment_date || record.lastPaymentDate || "",
          record.remarks || "",
          record.created_at ||
            record.createdAt ||
            new Date().toISOString().split("T")[0],
        ];
      }
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row
          .map((value) => {
            const stringValue = String(value || "");
            // Escape quotes and wrap in quotes if contains comma or quotes
            return stringValue.includes(",") || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(","),
      ),
    ].join("\n");

    // Add BOM for better Excel compatibility
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filename} exported successfully as CSV (Excel compatible)`,
    });
  };

  const printRecords = () => {
    const records =
      activeTab === "with-transport"
        ? filteredWithTransportRecords
        : filteredWithoutTransportRecords;

    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "No records to print",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title =
      activeTab === "with-transport"
        ? "Umrah With Transport Packages"
        : "Umrah Without Transport Packages";

    let tableHeaders = "";
    let tableRows = "";

    if (activeTab === "with-transport") {
      tableHeaders = `
        <tr>
          <th>Passenger Name</th>
          <th>PNR</th>
          <th>Passport</th>
          <th>Flight/Airline</th>
          <th>Departure</th>
          <th>Return</th>
          <th>Mobile</th>
        </tr>
      `;

      tableRows = records
        .map(
          (record) => `
        <tr>
          <td>${record.passenger_name || record.passengerName}</td>
          <td>${record.pnr}</td>
          <td>${record.passport_number || record.passportNumber}</td>
          <td>${record.flight_airline_name || record.flightAirlineName}</td>
          <td>${new Date(record.departure_date || record.departureDate).toLocaleDateString()}</td>
          <td>${new Date(record.return_date || record.returnDate).toLocaleDateString()}</td>
          <td>${record.passenger_mobile || record.passengerMobile}</td>
        </tr>
      `,
        )
        .join("");
    } else {
      tableHeaders = `
        <tr>
          <th>Passenger Name</th>
          <th>Passport</th>
          <th>Departure</th>
          <th>Total Amount</th>
          <th>Amount Paid</th>
          <th>Remaining</th>
          <th>Status</th>
        </tr>
      `;

      tableRows = records
        .map(
          (record) => `
        <tr>
          <td>${record.passenger_name || record.passengerName}</td>
          <td>${record.passport_number || record.passportNumber}</td>
          <td>${new Date(record.flight_departure_date || record.flightDepartureDate).toLocaleDateString()}</td>
          <td>${formatCurrency(record.total_amount || record.totalAmount || 0)}</td>
          <td>${formatCurrency(record.amount_paid || record.amountPaid || 0)}</td>
          <td>${formatCurrency(record.remaining_amount || record.remainingAmount || 0)}</td>
          <td>${(record.remaining_amount || record.remainingAmount || 0) > 0 ? "Pending" : "Paid"}</td>
        </tr>
      `,
        )
        .join("");
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-date { text-align: center; margin-top: 20px; color: #666; }
            @media print {
              body { margin: 0; }
              .print-date { position: fixed; bottom: 10px; width: 100%; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            ${tableHeaders}
            ${tableRows}
          </table>
          <div class="print-date">
            Generated on: ${new Date().toLocaleString()} | Total Records: ${records.length}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredWithTransportRecords = withTransportRecords.filter((record) => {
    // Text search
    const matchesSearch =
      searchTerm === "" ||
      (record.passengerName || record.passenger_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (record.pnr || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.passportNumber || record.passport_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Date filter
    const matchesDate =
      dateFilter === "" ||
      (record.departureDate || record.departure_date) === dateFilter;

    return matchesSearch && matchesDate;
  });

  const filteredWithoutTransportRecords = withoutTransportRecords.filter(
    (record) => {
      // Text search
      const matchesSearch =
        searchTerm === "" ||
        (record.passengerName || record.passenger_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.passportNumber || record.passport_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Date filter
      const matchesDate =
        dateFilter === "" ||
        (record.flightDepartureDate || record.flight_departure_date) ===
          dateFilter;

      // Status filter
      const remainingAmount =
        record.remainingAmount || record.remaining_amount || 0;
      const matchesStatus =
        statusFilter === "" ||
        statusFilter === "all" ||
        (statusFilter === "paid" && remainingAmount === 0) ||
        (statusFilter === "pending" && remainingAmount > 0);

      // Amount filter
      const totalAmount = record.totalAmount || record.total_amount || 0;
      const matchesAmount =
        amountFilter === "" ||
        amountFilter === "all" ||
        (amountFilter === "low" && totalAmount <= 50000) ||
        (amountFilter === "medium" &&
          totalAmount > 50000 &&
          totalAmount <= 100000) ||
        (amountFilter === "high" && totalAmount > 100000);

      return matchesSearch && matchesDate && matchesStatus && matchesAmount;
    },
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full animate-glow">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Umrah Ticket Management
              </h1>
              <p className="text-foreground/70 font-body">
                Manage Umrah packages with and without transport
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="font-body">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    exportToCSV(
                      activeTab === "with-transport"
                        ? filteredWithTransportRecords
                        : filteredWithoutTransportRecords,
                      `umrah-${activeTab}`,
                    )
                  }
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV/Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={printRecords}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Records
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="velvet-button text-primary-foreground font-body"
                  onClick={() => {
                    resetWithTransportForm();
                    resetWithoutTransportForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {isEditingWithTransport || isEditingWithoutTransport
                      ? "Edit Umrah Package"
                      : "Add New Umrah Package"}
                  </DialogTitle>
                  <DialogDescription className="font-body">
                    {isEditingWithTransport || isEditingWithoutTransport
                      ? "Update package details"
                      : "Choose package type and fill in the details"}
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as PackageType)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="with-transport" className="font-body">
                      <Plane className="h-4 w-4 mr-2" />
                      With Transport
                    </TabsTrigger>
                    <TabsTrigger
                      value="without-transport"
                      className="font-body"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Without Transport
                    </TabsTrigger>
                    <TabsTrigger value="group-tickets" className="font-body">
                      <Package className="h-4 w-4 mr-2" />
                      Group Tickets
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="with-transport">
                    <form
                      onSubmit={handleSubmitWithTransport}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passengerName">
                            Passenger Name *
                          </Label>
                          <Input
                            id="passengerName"
                            value={withTransportForm.passengerName}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                passengerName: e.target.value,
                              }))
                            }
                            className={
                              errors.passengerName ? "border-red-500" : ""
                            }
                          />
                          {errors.passengerName && (
                            <p className="text-red-500 text-sm">
                              {errors.passengerName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pnr">PNR *</Label>
                          <Input
                            id="pnr"
                            value={withTransportForm.pnr}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                pnr: e.target.value,
                              }))
                            }
                            className={errors.pnr ? "border-red-500" : ""}
                          />
                          {errors.pnr && (
                            <p className="text-red-500 text-sm">{errors.pnr}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passportNumber">
                            Passport Number *
                          </Label>
                          <Input
                            id="passportNumber"
                            value={withTransportForm.passportNumber}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                passportNumber: e.target.value,
                              }))
                            }
                            className={
                              errors.passportNumber ? "border-red-500" : ""
                            }
                          />
                          {errors.passportNumber && (
                            <p className="text-red-500 text-sm">
                              {errors.passportNumber}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="flightAirlineName">
                            Flight / Airline Name *
                          </Label>
                          <Input
                            id="flightAirlineName"
                            value={withTransportForm.flightAirlineName}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                flightAirlineName: e.target.value,
                              }))
                            }
                            className={
                              errors.flightAirlineName ? "border-red-500" : ""
                            }
                          />
                          {errors.flightAirlineName && (
                            <p className="text-red-500 text-sm">
                              {errors.flightAirlineName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="departureDate">
                            Departure Date *
                          </Label>
                          <Input
                            id="departureDate"
                            type="date"
                            value={withTransportForm.departureDate}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                departureDate: e.target.value,
                              }))
                            }
                            className={
                              errors.departureDate ? "border-red-500" : ""
                            }
                          />
                          {errors.departureDate && (
                            <p className="text-red-500 text-sm">
                              {errors.departureDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="returnDate">Return Date *</Label>
                          <Input
                            id="returnDate"
                            type="date"
                            value={withTransportForm.returnDate}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                returnDate: e.target.value,
                              }))
                            }
                            className={
                              errors.returnDate ? "border-red-500" : ""
                            }
                          />
                          {errors.returnDate && (
                            <p className="text-red-500 text-sm">
                              {errors.returnDate}
                            </p>
                          )}
                        </div>

                        {/* Group Ticket Suggestion */}
                        {showGroupSuggestion &&
                          availableGroupTickets.length > 0 && (
                            <div className="md:col-span-2">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                                    <div>
                                      <h4 className="font-semibold text-blue-900">
                                        উপলব্ধ গ্রুপ টিকেট
                                      </h4>
                                      <p className="text-sm text-blue-700">
                                        আপনার নির্বাচিত তারিখের জন্য{" "}
                                        {availableGroupTickets.length}টি গ্রুপ
                                        টিকেট পাওয়া গেছে
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setShowGroupSuggestion(false)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {availableGroupTickets.map((ticket) => (
                                    <div
                                      key={ticket.id}
                                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                        selectedGroupTicket?.id === ticket.id
                                          ? "border-blue-500 bg-blue-100"
                                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                      }`}
                                      onClick={() =>
                                        populateFromGroupTicket(ticket)
                                      }
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h5 className="font-medium text-gray-900">
                                            {ticket.group_name}
                                          </h5>
                                          <p className="text-sm text-gray-600">
                                            {ticket.departure_airline} • ফ্লাইট:{" "}
                                            {ticket.departure_flight_number}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            এজেন্ট: {ticket.agent_name}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {ticket.remaining_tickets} টিকেট
                                            বাকি
                                          </span>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {ticket.departure_date} -{" "}
                                            {ticket.return_date}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {selectedGroupTicket && (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-sm text-blue-700">
                                      ✓ নির্বাচিত:{" "}
                                      <strong>
                                        {selectedGroupTicket.group_name}
                                      </strong>
                                      (এই যাত্রী যোগের পর{" "}
                                      {selectedGroupTicket.remaining_tickets -
                                        1}{" "}
                                      টিকেট বাকি থাকবে)
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        <div className="space-y-2">
                          <Label htmlFor="approvedBy">Approved By *</Label>
                          <Input
                            id="approvedBy"
                            value={withTransportForm.approvedBy}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                approvedBy: e.target.value,
                              }))
                            }
                            className={
                              errors.approvedBy ? "border-red-500" : ""
                            }
                          />
                          {errors.approvedBy && (
                            <p className="text-red-500 text-sm">
                              {errors.approvedBy}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="referenceAgency">
                            Reference Agency *
                          </Label>
                          <Input
                            id="referenceAgency"
                            value={withTransportForm.referenceAgency}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                referenceAgency: e.target.value,
                              }))
                            }
                            className={
                              errors.referenceAgency ? "border-red-500" : ""
                            }
                          />
                          {errors.referenceAgency && (
                            <p className="text-red-500 text-sm">
                              {errors.referenceAgency}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergencyFlightContact">
                            Emergency Flight Contact *
                          </Label>
                          <Input
                            id="emergencyFlightContact"
                            value={withTransportForm.emergencyFlightContact}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                emergencyFlightContact: e.target.value,
                              }))
                            }
                            placeholder="+880XXXXXXXXX"
                            className={
                              errors.emergencyFlightContact
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {errors.emergencyFlightContact && (
                            <p className="text-red-500 text-sm">
                              {errors.emergencyFlightContact}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passengerMobile">
                            Passenger Mobile *
                          </Label>
                          <Input
                            id="passengerMobile"
                            value={withTransportForm.passengerMobile}
                            onChange={(e) =>
                              setWithTransportForm((prev) => ({
                                ...prev,
                                passengerMobile: e.target.value,
                              }))
                            }
                            placeholder="+880XXXXXXXXX"
                            className={
                              errors.passengerMobile ? "border-red-500" : ""
                            }
                          />
                          {errors.passengerMobile && (
                            <p className="text-red-500 text-sm">
                              {errors.passengerMobile}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
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
                          className="velvet-button"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading
                            ? isEditingWithTransport
                              ? "Updating..."
                              : "Saving..."
                            : isEditingWithTransport
                              ? "Update Package"
                              : "Save Package"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="without-transport">
                    <form
                      onSubmit={handleSubmitWithoutTransport}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="flightDepartureDate">
                            Flight Departure Date *
                          </Label>
                          <Input
                            id="flightDepartureDate"
                            type="date"
                            value={withoutTransportForm.flightDepartureDate}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                flightDepartureDate: e.target.value,
                              }))
                            }
                            className={
                              errors.flightDepartureDate ? "border-red-500" : ""
                            }
                          />
                          {withoutTransportForm.flightDepartureDate && (
                            <p className="text-sm text-muted-foreground">
                              Day:{" "}
                              {getDayOfWeek(
                                withoutTransportForm.flightDepartureDate,
                              )}
                            </p>
                          )}
                          {errors.flightDepartureDate && (
                            <p className="text-red-500 text-sm">
                              {errors.flightDepartureDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="returnDateWT">Return Date *</Label>
                          <Input
                            id="returnDateWT"
                            type="date"
                            value={withoutTransportForm.returnDate}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                returnDate: e.target.value,
                              }))
                            }
                            className={
                              errors.returnDate ? "border-red-500" : ""
                            }
                          />
                          {errors.returnDate && (
                            <p className="text-red-500 text-sm">
                              {errors.returnDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passengerNameWT">
                            Passenger Name *
                          </Label>
                          <Input
                            id="passengerNameWT"
                            value={withoutTransportForm.passengerName}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                passengerName: e.target.value,
                              }))
                            }
                            className={
                              errors.passengerName ? "border-red-500" : ""
                            }
                          />
                          {errors.passengerName && (
                            <p className="text-red-500 text-sm">
                              {errors.passengerName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passportNumberWT">
                            Passport Number *
                          </Label>
                          <Input
                            id="passportNumberWT"
                            value={withoutTransportForm.passportNumber}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                passportNumber: e.target.value,
                              }))
                            }
                            className={
                              errors.passportNumber ? "border-red-500" : ""
                            }
                          />
                          {errors.passportNumber && (
                            <p className="text-red-500 text-sm">
                              {errors.passportNumber}
                            </p>
                          )}
                        </div>

                        {/* Group ticket functionality removed for without transport */}

                        <div className="space-y-2">
                          <Label htmlFor="entryRecordedBy">
                            Entry Recorded By *
                          </Label>
                          <Input
                            id="entryRecordedBy"
                            value={withoutTransportForm.entryRecordedBy}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                entryRecordedBy: e.target.value,
                              }))
                            }
                            className={
                              errors.entryRecordedBy ? "border-red-500" : ""
                            }
                          />
                          {errors.entryRecordedBy && (
                            <p className="text-red-500 text-sm">
                              {errors.entryRecordedBy}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="totalAmount">
                            Total Amount (৳) *
                          </Label>
                          <Input
                            id="totalAmount"
                            type="number"
                            min="0"
                            value={withoutTransportForm.totalAmount}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                totalAmount: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className={
                              errors.totalAmount ? "border-red-500" : ""
                            }
                          />
                          {errors.totalAmount && (
                            <p className="text-red-500 text-sm">
                              {errors.totalAmount}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amountPaid">Amount Paid (৳) *</Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            min="0"
                            value={withoutTransportForm.amountPaid}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                amountPaid: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className={
                              errors.amountPaid ? "border-red-500" : ""
                            }
                          />
                          {errors.amountPaid && (
                            <p className="text-red-500 text-sm">
                              {errors.amountPaid}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Remaining Amount (৳)</Label>
                          <div className="flex items-center space-x-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(
                                withoutTransportForm.remainingAmount,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastPaymentDate">
                            Last Payment Date
                          </Label>
                          <Input
                            id="lastPaymentDate"
                            type="date"
                            value={withoutTransportForm.lastPaymentDate}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                lastPaymentDate: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="remarks">Remarks / Notes</Label>
                          <Textarea
                            id="remarks"
                            value={withoutTransportForm.remarks}
                            onChange={(e) =>
                              setWithoutTransportForm((prev) => ({
                                ...prev,
                                remarks: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Any additional notes or remarks..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
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
                          className="velvet-button"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading
                            ? isEditingWithoutTransport
                              ? "Updating..."
                              : "Saving..."
                            : isEditingWithoutTransport
                              ? "Update Package"
                              : "Save Package"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="group-tickets">
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-heading font-bold mb-2">
                        Group Ticket Management
                      </h3>
                      <p className="text-muted-foreground font-body mb-4">
                        গ্রুপ ���িকেট ম্যান��জ��েন্ট নিচের মেইন সেকশনে পাবেন।
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Main Search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by passenger name, PNR, or passport..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter("");
                    setStatusFilter("all");
                    setAmountFilter("all");
                  }}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Departure Date
                  </Label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>

                {activeTab === "without-transport" && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Payment Status
                      </Label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="paid">Fully Paid</SelectItem>
                          <SelectItem value="pending">
                            Pending Payment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Amount Range
                      </Label>
                      <Select
                        value={amountFilter}
                        onValueChange={setAmountFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Amounts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Amounts</SelectItem>
                          <SelectItem value="low">৳0 - ৳50,000</SelectItem>
                          <SelectItem value="medium">
                            ৳50,001 - ৳100,000
                          </SelectItem>
                          <SelectItem value="high">৳100,001+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadRecords}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedRecords.size} record
                {selectedRecords.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRecords(new Set());
                  setShowBulkActions(false);
                }}
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as PackageType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="with-transport" className="font-body">
              <Plane className="h-4 w-4 mr-2" />
              With Transport ({filteredWithTransportRecords.length})
            </TabsTrigger>
            <TabsTrigger value="without-transport" className="font-body">
              <Users className="h-4 w-4 mr-2" />
              Without Transport ({filteredWithoutTransportRecords.length})
            </TabsTrigger>
            <TabsTrigger value="group-tickets" className="font-body">
              <Package className="h-4 w-4 mr-2" />
              Group Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="with-transport">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading">
                  Umrah With Transport
                </CardTitle>
                <CardDescription className="font-body">
                  Complete travel packages including flight arrangements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredWithTransportRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Passenger Name</TableHead>
                          <TableHead>PNR</TableHead>
                          <TableHead>Passport</TableHead>
                          <TableHead>Flight/Airline</TableHead>
                          <TableHead>Departure</TableHead>
                          <TableHead>Return</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWithTransportRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.passengerName || record.passenger_name}
                            </TableCell>
                            <TableCell>{record.pnr}</TableCell>
                            <TableCell>
                              {record.passportNumber || record.passport_number}
                            </TableCell>
                            <TableCell>
                              {record.flightAirlineName ||
                                record.flight_airline_name}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                record.departureDate || record.departure_date,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                record.returnDate || record.return_date,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {record.passengerMobile ||
                                record.passenger_mobile}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setIsViewDialogOpen(true);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditWithTransport(record)
                                  }
                                  title="Edit Record"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteWithTransport(record.id!)
                                  }
                                  title="Delete Record"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                      No records found
                    </h3>
                    <p className="text-foreground/70 font-body mb-4">
                      {searchTerm
                        ? "No packages match your search criteria"
                        : "No Umrah with transport packages have been added yet"}
                    </p>
                    <Button
                      onClick={() => setIsFormDialogOpen(true)}
                      className="velvet-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Package
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="without-transport">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading">
                  Umrah Without Transport
                </CardTitle>
                <CardDescription className="font-body">
                  Packages without flight arrangements - payment tracking
                  enabled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredWithoutTransportRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Passenger Name</TableHead>
                          <TableHead>Passport</TableHead>
                          <TableHead>Departure</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Amount Paid</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWithoutTransportRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.passengerName || record.passenger_name}
                            </TableCell>
                            <TableCell>
                              {record.passportNumber || record.passport_number}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                record.flightDepartureDate ||
                                  record.flight_departure_date,
                              ).toLocaleDateString()}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {getDayOfWeek(
                                  record.flightDepartureDate ||
                                    record.flight_departure_date,
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                record.totalAmount || record.total_amount || 0,
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                record.amountPaid || record.amount_paid || 0,
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  (record.remainingAmount ||
                                    record.remaining_amount ||
                                    0) > 0
                                    ? "text-orange-600 font-bold"
                                    : "text-green-600 font-bold"
                                }
                              >
                                {formatCurrency(
                                  record.remainingAmount ||
                                    record.remaining_amount ||
                                    0,
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (record.remainingAmount ||
                                    record.remaining_amount ||
                                    0) > 0
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {(record.remainingAmount ||
                                  record.remaining_amount ||
                                  0) > 0
                                  ? "Pending"
                                  : "Paid"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setIsViewDialogOpen(true);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditWithoutTransport(record)
                                  }
                                  title="Edit Record"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteWithoutTransport(record.id!)
                                  }
                                  title="Delete Record"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                      No records found
                    </h3>
                    <p className="text-foreground/70 font-body mb-4">
                      {searchTerm
                        ? "No packages match your search criteria"
                        : "No Umrah without transport packages have been added yet"}
                    </p>
                    <Button
                      onClick={() => setIsFormDialogOpen(true)}
                      className="velvet-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Package
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group-tickets">
            <UmrahGroupTickets />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* View Record Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Package Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Package Header */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="p-2 bg-blue-500 rounded-full">
                  {selectedRecord.pnr ? (
                    <Plane className="h-5 w-5 text-white" />
                  ) : (
                    <Users className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">
                    {selectedRecord.passengerName ||
                      selectedRecord.passenger_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.pnr
                      ? "With Transport Package"
                      : "Without Transport Package"}
                  </p>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Passenger Name
                      </Label>
                      <p className="text-base font-medium">
                        {selectedRecord.passengerName ||
                          selectedRecord.passenger_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Passport Number
                      </Label>
                      <p className="text-base">
                        {selectedRecord.passportNumber ||
                          selectedRecord.passport_number}
                      </p>
                    </div>
                    {selectedRecord.pnr && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          PNR
                        </Label>
                        <p className="text-base font-mono">
                          {selectedRecord.pnr}
                        </p>
                      </div>
                    )}
                    {selectedRecord.passengerMobile ||
                    selectedRecord.passenger_mobile ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Mobile
                        </Label>
                        <p className="text-base">
                          {selectedRecord.passengerMobile ||
                            selectedRecord.passenger_mobile}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Travel Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Travel Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Departure Date
                      </Label>
                      <p className="text-base">
                        {new Date(
                          selectedRecord.departureDate ||
                            selectedRecord.departure_date ||
                            selectedRecord.flightDepartureDate ||
                            selectedRecord.flight_departure_date,
                        ).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Return Date
                      </Label>
                      <p className="text-base">
                        {new Date(
                          selectedRecord.returnDate ||
                            selectedRecord.return_date,
                        ).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {selectedRecord.flightAirlineName ||
                    selectedRecord.flight_airline_name ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Flight/Airline
                        </Label>
                        <p className="text-base">
                          {selectedRecord.flightAirlineName ||
                            selectedRecord.flight_airline_name}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Financial Information (for without transport) */}
                {(selectedRecord.totalAmount ||
                  selectedRecord.total_amount) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Financial Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Total Amount
                        </Label>
                        <p className="text-base font-bold text-green-600">
                          {formatCurrency(
                            selectedRecord.totalAmount ||
                              selectedRecord.total_amount,
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Amount Paid
                        </Label>
                        <p className="text-base font-medium">
                          {formatCurrency(
                            selectedRecord.amountPaid ||
                              selectedRecord.amount_paid ||
                              0,
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Remaining Amount
                        </Label>
                        <p
                          className={`text-base font-bold ${
                            (selectedRecord.remainingAmount ||
                              selectedRecord.remaining_amount ||
                              0) > 0
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(
                            selectedRecord.remainingAmount ||
                              selectedRecord.remaining_amount ||
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Additional Information
                  </h4>
                  <div className="space-y-3">
                    {selectedRecord.approvedBy || selectedRecord.approved_by ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Approved By
                        </Label>
                        <p className="text-base">
                          {selectedRecord.approvedBy ||
                            selectedRecord.approved_by}
                        </p>
                      </div>
                    ) : null}
                    {selectedRecord.referenceAgency ||
                    selectedRecord.reference_agency ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Reference Agency
                        </Label>
                        <p className="text-base">
                          {selectedRecord.referenceAgency ||
                            selectedRecord.reference_agency}
                        </p>
                      </div>
                    ) : null}
                    {selectedRecord.entryRecordedBy ||
                    selectedRecord.entry_recorded_by ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Entry Recorded By
                        </Label>
                        <p className="text-base">
                          {selectedRecord.entryRecordedBy ||
                            selectedRecord.entry_recorded_by}
                        </p>
                      </div>
                    ) : null}
                    {selectedRecord.emergencyFlightContact ||
                    selectedRecord.emergency_flight_contact ? (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Emergency Contact
                        </Label>
                        <p className="text-base">
                          {selectedRecord.emergencyFlightContact ||
                            selectedRecord.emergency_flight_contact}
                        </p>
                      </div>
                    ) : null}
                    {selectedRecord.remarks && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Remarks
                        </Label>
                        <p className="text-sm bg-gray-50 p-3 rounded-md">
                          {selectedRecord.remarks}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Created Date
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          selectedRecord.createdAt || selectedRecord.created_at,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
