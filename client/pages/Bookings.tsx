import React, { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { validateStatusTransition } from "../lib/validation";
import { useNetworkErrorHandler } from "../components/NetworkErrorBoundary";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Plane,
  MapPin,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
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
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { apiClient } from "../services/api";
import { Booking } from "@shared/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  locked: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusIcons = {
  pending: <Clock className="h-3 w-3" />,
  confirmed: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  locked: <AlertCircle className="h-3 w-3" />,
};

const paymentColors = {
  full: "bg-green-100 text-green-800 border-green-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function Bookings() {
  const { user, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { networkError, clearNetworkError, retryWithErrorHandler } =
    useNetworkErrorHandler();

  // Set initial filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (
      statusParam &&
      ["pending", "confirmed", "cancelled", "locked"].includes(statusParam)
    ) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      clearNetworkError();

      const data = await retryWithErrorHandler(
        () => apiClient.getBookings(),
        2, // Max 2 retries
      );

      // Ensure data is always an array
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load bookings";
      setError(errorMessage);
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Find the booking to validate
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        throw new Error("বুকিং খুঁজে পাওয়া যায়নি / Booking not found");
      }

      // 1st Check: Status transition validation
      const currentStatus = booking.status;
      const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["cancelled"], // Can only cancel confirmed bookings
        cancelled: [], // Cannot change cancelled bookings
        expired: [], // Cannot change expired bookings
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(
          `অবৈধ স্ট্যাটাস পরিবর্তন: ${currentStatus} থেকে ${newStatus} এ পরিবর্তন করা যাবে না / Invalid status transition: Cannot change from ${currentStatus} to ${newStatus}`,
        );
      }

      // 2nd Check: Permission validation
      if (newStatus === "confirmed" && !hasPermission("confirm_sales")) {
        throw new Error(
          "বুকিং নিশ্চিত করার অনুমতি নেই / No permission to confirm bookings",
        );
      }

      // 3rd Check: Business logic validation
      if (newStatus === "confirmed") {
        // Check if flight date is in the future
        const flightDate = new Date(booking.ticketInfo?.flightDate || "");
        const today = new Date();
        if (flightDate <= today) {
          throw new Error(
            "অতীতের ���্লাইটের জন্য বুকিং নিশ্চিত করা যাবে না / Cannot confirm booking for past flights",
          );
        }

        // Confirm large amount bookings
        const totalAmount =
          booking.sellingPrice * booking.passengerInfo.paxCount;
        if (totalAmount > 500000) {
          // 5 lakh
          const confirmed = window.confirm(
            `বড় পরিমাণের বুকিং নিশ্চিতকরণ: ৳${totalAmount.toLocaleString()}\n\nআপনি কি ���িশ্চিত?\n\nLarge booking confirmation: ৳${totalAmount.toLocaleString()}\n\nAre you sure?`,
          );
          if (!confirmed) return;
        }
      }

      // 4th Check: Final confirmation for critical actions
      if (newStatus === "cancelled") {
        const confirmed = window.confirm(
          `বুকিং বাতিল করা হবে: ${booking.passengerInfo?.name}\n\nআপনি কি নিশ্চিত?\n\nCancel booking for: ${booking.passengerInfo?.name}\n\nAre you sure?`,
        );
        if (!confirmed) return;
      }

      // Log the action for audit
      console.log(
        "=== বুকিং স্ট্যাটাস আ���ডেট অডিট লগ / BOOKING STATUS UPDATE AUDIT LOG ===",
      );
      console.log("বুকিং আইডি / Booking ID:", bookingId);
      console.log("যাত্রীর নাম / Passenger Name:", booking.passengerInfo?.name);
      console.log("পূর্বের স্ট্য���টাস / Previous Status:", currentStatus);
      console.log("নতুন স্ট্যাটাস / New Status:", newStatus);
      console.log("ব্যবহারকারী / User:", user?.name);
      console.log("সময় / Time:", new Date().toLocaleString());
      console.log("=== লগ শেষ / END LOG ===");

      // Perform the update
      await apiClient.updateBookingStatus(bookingId, newStatus);
      await loadBookings(); // Refresh the list

      // Success toast notification
      toast({
        title: "সফল / Success!",
        description: `বুকিং স্ট্যাটাস আপডেট হয়েছে: ${currentStatus} → ${newStatus} / Booking status updated: ${currentStatus} → ${newStatus}`,
      });
    } catch (err: any) {
      console.error("Failed to update booking status:", err);
      toast({
        title: "ত্রুটি / Error",
        description:
          err.message ||
          "বুকিং স্ট্���াটাস আপডেট করতে ব্যর্থ / Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter(
    (booking) => {
      const matchesSearch =
        booking.passengerInfo?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.agentInfo?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    },
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error || networkError) {
    const displayError = networkError || error;
    const isNetworkError =
      displayError?.includes("Failed to fetch") ||
      displayError?.includes("Network error") ||
      displayError?.includes("Unable to connect");

    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
          {isNetworkError ? (
            <AlertCircle className="h-8 w-8 text-red-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
        </div>
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          {isNetworkError ? "Connection Problem" : "Error Loading Bookings"}
        </h3>
        <p className="text-foreground/70 font-body mb-4">{displayError}</p>

        {isNetworkError && (
          <div className="text-sm text-muted-foreground mb-6 p-4 bg-muted rounded-lg max-w-md mx-auto">
            <p className="font-medium mb-2">Troubleshooting tips:</p>
            <ul className="text-left space-y-1">
              <li>• Check your internet connection</li>
              <li>• Refresh the page</li>
              <li>• Try again in a few moments</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => {
              clearNetworkError();
              setError(null);
              loadBookings();
            }}
            className="velvet-button text-primary-foreground font-body"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          {isNetworkError && (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="font-body"
            >
              Refresh Page
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Booking Management
              </h1>
              <p className="text-foreground/70 font-body">
                Process customer bookings and requests
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={loadBookings}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              title: "Total Bookings",
              value: Array.isArray(bookings) ? bookings.length : 0,
              icon: <Package className="h-4 w-4 text-white" />,
              color: "bg-blue-500",
            },
            {
              title: "Pending",
              value: Array.isArray(bookings)
                ? bookings.filter((b) => b.status === "pending").length
                : 0,
              icon: <Clock className="h-4 w-4 text-white" />,
              color: "bg-yellow-500",
            },
            {
              title: "Confirmed",
              value: Array.isArray(bookings)
                ? bookings.filter((b) => b.status === "confirmed").length
                : 0,
              icon: <CheckCircle className="h-4 w-4 text-white" />,
              color: "bg-green-500",
            },
            {
              title: "Cancelled",
              value: Array.isArray(bookings)
                ? bookings.filter((b) => b.status === "cancelled").length
                : 0,
              icon: <XCircle className="h-4 w-4 text-white" />,
              color: "bg-red-500",
            },
          ].map((stat, index) => (
            <Card key={stat.title} className="luxury-card border-0">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-foreground/70 font-body">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold font-heading velvet-text">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 h-4 w-4" />
                  <Input
                    placeholder="Search by passenger name, agent, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-body"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 font-body">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text">
              Booking Requests ({filteredBookings.length})
            </CardTitle>
            <CardDescription className="font-body">
              Manage and process customer booking requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-heading">Booking ID</TableHead>
                    <TableHead className="font-heading">Passenger</TableHead>
                    <TableHead className="font-heading">Agent</TableHead>
                    <TableHead className="font-heading">Status</TableHead>
                    <TableHead className="font-heading">Payment</TableHead>
                    <TableHead className="font-heading">Created</TableHead>
                    <TableHead className="font-heading">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-cream-50/50">
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-foreground/50" />
                          <div>
                            <div className="font-medium font-body">
                              {booking.passengerInfo.name}
                            </div>
                            <div className="text-xs text-foreground/50 font-body">
                              {booking.passengerInfo.passportNo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-body">
                          {booking.agentInfo.name}
                        </div>
                        <div className="text-xs text-foreground/50 font-body">
                          {booking.agentInfo.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            statusColors[
                              booking.status as keyof typeof statusColors
                            ]
                          } flex items-center space-x-1 font-body`}
                        >
                          {
                            statusIcons[
                              booking.status as keyof typeof statusIcons
                            ]
                          }
                          <span className="capitalize">{booking.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            paymentColors[
                              booking.paymentType as keyof typeof paymentColors
                            ]
                          } font-body`}
                        >
                          {booking.paymentType === "full"
                            ? "Full Payment"
                            : "Partial Payment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground/70 font-body">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBooking(booking)}
                                className="font-body"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="font-heading">
                                  Booking Details
                                </DialogTitle>
                                <DialogDescription className="font-body">
                                  Complete booking information and actions
                                </DialogDescription>
                              </DialogHeader>
                              {selectedBooking && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-heading font-semibold">
                                        Passenger Information
                                      </h4>
                                      <div className="text-sm space-y-1 font-body">
                                        <p>
                                          <strong>Name:</strong>{" "}
                                          {selectedBooking.passengerInfo.name}
                                        </p>
                                        <p>
                                          <strong>Passport:</strong>{" "}
                                          {
                                            selectedBooking.passengerInfo
                                              .passportNo
                                          }
                                        </p>
                                        <p>
                                          <strong>Phone:</strong>{" "}
                                          {selectedBooking.passengerInfo.phone}
                                        </p>
                                        <p>
                                          <strong>Email:</strong>{" "}
                                          {selectedBooking.passengerInfo.email}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-heading font-semibold">
                                        Agent Information
                                      </h4>
                                      <div className="text-sm space-y-1 font-body">
                                        <p>
                                          <strong>Name:</strong>{" "}
                                          {selectedBooking.agentInfo.name}
                                        </p>
                                        <p>
                                          <strong>Phone:</strong>{" "}
                                          {selectedBooking.agentInfo.phone}
                                        </p>
                                        <p>
                                          <strong>Email:</strong>{" "}
                                          {selectedBooking.agentInfo.email}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex space-x-2">
                                    {hasPermission("confirm_bookings") &&
                                      selectedBooking.status === "pending" && (
                                        <Button
                                          onClick={() =>
                                            handleStatusUpdate(
                                              selectedBooking.id,
                                              "confirmed",
                                            )
                                          }
                                          className="velvet-button bg-green-600 hover:bg-green-700 font-body"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Confirm Booking
                                        </Button>
                                      )}
                                    {selectedBooking.status !== "cancelled" && (
                                      <Button
                                        onClick={() =>
                                          handleStatusUpdate(
                                            selectedBooking.id,
                                            "cancelled",
                                          )
                                        }
                                        variant="destructive"
                                        className="font-body"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Booking
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-heading font-bold text-green-600 mb-2">
                    Database Clean - Ready for Real Bookings!
                  </h3>
                  <p className="text-foreground/70 font-body">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "All demo bookings have been removed. New bookings will appear here once tickets are added and booked."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
