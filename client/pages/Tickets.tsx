import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Eye,
  Calendar,
  Clock,
  Plane,
  DollarSign,
  Lock,
  CheckCircle,
  Search,
  Filter,
  ShoppingCart,
  RefreshCw,
  FileText,
  Download,
  Users,
  User,
  MapPin,
  AlertCircle,
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
import { Skeleton } from "../components/ui/skeleton";
import { BookingDialog } from "../components/BookingDialog";
import { apiClient } from "../services/api";
import { useToast } from "../hooks/use-toast";

interface Ticket {
  id: string;
  sl?: number;
  airline?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  selling_price: number;
  buying_price?: number;
  available_seats: number;
  total_seats: number;
  status: "available" | "booked" | "locked" | "sold";
  ticket_type?: string;
  route?: string;
  batch?: {
    id: string;
    airline: string;
    flight_date: string;
    departure_time: string;
    arrival_time: string;
    origin: string;
    destination: string;
    flight_number: string;
  };
  country?: {
    code: string;
    name: string;
    flag: string;
  };
}

interface TicketRowProps {
  ticket: Ticket;
  index: number;
  showBuyingPrice: boolean;
  onView: (ticket: Ticket) => void;
  onBook: (ticket: Ticket) => void;
}

function TicketRow({
  ticket,
  index,
  showBuyingPrice,
  onView,
  onBook,
}: TicketRowProps) {
  const getStatusBadge = (status: string, availableSeats: number) => {
    if (availableSeats === 0) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          No Seats
        </Badge>
      );
    }

    switch (status) {
      case "available":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Available
          </Badge>
        );
      case "booked":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Booked
          </Badge>
        );
      case "locked":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Locked
          </Badge>
        );
      case "sold":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Sold
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isDisabled = ticket.status === "sold" || ticket.available_seats === 0;
  const canBook = ticket.status === "available" && ticket.available_seats > 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`border-b border-border/20 hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent transition-all duration-300 ${
        isDisabled ? "opacity-60" : ""
      }`}
    >
      <td className="px-4 py-3 font-body text-sm text-foreground">
        {index + 1}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Plane className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body font-medium text-sm text-foreground">
              {(() => {
                const airline =
                  ticket.batch?.airline ||
                  ticket.airline_name ||
                  ticket.airline;
                return airline || "Airline not set";
              })()}
            </div>
            <div className="font-body text-xs text-foreground/50">
              {(() => {
                const flightNumber =
                  ticket.batch?.flight_number ||
                  ticket.flight_number ||
                  ticket.flight_code;
                return flightNumber || "Flight number not set";
              })()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body font-medium text-sm text-foreground">
              {(() => {
                const origin = ticket.batch?.origin || ticket.origin || "Dhaka";
                const destination =
                  ticket.batch?.destination ||
                  ticket.destination ||
                  ticket.country?.name ||
                  "Destination";
                return `${origin} → ${destination}`;
              })()}
            </div>
            <div className="font-body text-xs text-foreground/50 flex items-center">
              {ticket.country?.flag && (
                <span className="mr-1">{ticket.country.flag}</span>
              )}
              {ticket.country?.name || "Country not set"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body font-medium text-sm text-foreground">
              {(() => {
                // Try multiple sources for flight date
                const dateSource =
                  ticket.batch?.flight_date ||
                  ticket.flight_date ||
                  ticket.departure_date;

                if (dateSource) {
                  try {
                    return new Date(dateSource).toLocaleDateString();
                  } catch (e) {
                    console.warn("Invalid date format:", dateSource);
                    return dateSource;
                  }
                }
                return "Date not set";
              })()}
            </div>
            <div className="font-body text-xs text-foreground/50">
              {(() => {
                const dateSource =
                  ticket.batch?.flight_date ||
                  ticket.flight_date ||
                  ticket.departure_date;

                if (dateSource) {
                  try {
                    return new Date(dateSource).toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                  } catch (e) {
                    return "Invalid date";
                  }
                }
                return "No date";
              })()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body text-sm text-foreground">
              {(() => {
                // Try multiple sources for departure time
                const timeSource =
                  ticket.batch?.departure_time ||
                  ticket.flight_time ||
                  ticket.departure_time;

                return timeSource || "Time not set";
              })()}
            </div>
            {(() => {
              const arrivalTime =
                ticket.batch?.arrival_time || ticket.arrival_time;
              if (arrivalTime) {
                return (
                  <div className="font-body text-xs text-foreground/50">
                    Arr: {arrivalTime}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-body font-semibold text-sm text-green-600">
            ৳{ticket.selling_price.toLocaleString()}
          </span>
        </div>
      </td>
      {showBuyingPrice && (
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-red-600" />
            <span className="font-body font-semibold text-sm text-red-600">
              ৳{ticket.buying_price?.toLocaleString() || "N/A"}
            </span>
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body font-medium text-sm text-foreground">
              {ticket.available_seats} / {ticket.total_seats}
            </div>
            <div className="font-body text-xs text-foreground/50">
              Available
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {getStatusBadge(ticket.status, ticket.available_seats)}
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(ticket)}
            className="font-body text-xs hover:scale-105 transform transition-all duration-200"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {canBook && (
            <Button
              size="sm"
              onClick={() => onBook(ticket)}
              className="font-body text-xs velvet-button text-primary-foreground hover:scale-105 transform transition-all duration-200"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Book
            </Button>
          )}
          {isDisabled && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 text-xs"
            >
              {ticket.available_seats === 0 ? "NO SEATS" : "SOLD OUT"}
            </Badge>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function Tickets() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const showBuyingPrice = hasPermission("view_buying_price");

  // Load all tickets
  const loadTickets = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Get all tickets from all countries with high limit
      const data = await apiClient.getAllTickets({ limit: 1000 });
      console.log("🎫 Raw ticket data:", data);
      console.log(`📊 Loaded ${data.length} tickets`);

      if (Array.isArray(data)) {
        // Log a sample ticket to see the data structure
        if (data.length > 0) {
          console.log("Sample ticket structure:", data[0]);
          console.log("Sample ticket batch:", data[0].batch);
          console.log("Available date fields:", {
            batch_flight_date: data[0].batch?.flight_date,
            flight_date: data[0].flight_date,
            departure_date: data[0].departure_date,
            batch_departure_time: data[0].batch?.departure_time,
            flight_time: data[0].flight_time,
            departure_time: data[0].departure_time,
          });
        }

        // Validate and clean ticket data
        const cleanedTickets = data.map((ticket) => ({
          ...ticket,
          // Ensure all required fields have fallback values
          selling_price: ticket.selling_price || 0,
          available_seats: ticket.available_seats || 0,
          total_seats: ticket.total_seats || 1,
          status: ticket.status || "available",
          // Ensure country object exists
          country: ticket.country || {
            code: "N/A",
            name: "Unknown",
            flag: "🏳️",
          },
        }));

        setTickets(cleanedTickets);
      } else {
        console.warn("Invalid ticket data received:", data);
        setTickets([]);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Get unique values for filters
  const countries = tickets
    .filter((t) => t.country)
    .map((t) => ({
      code: t.country!.code,
      name: t.country!.name,
      flag: t.country!.flag,
    }))
    .filter(
      (country, index, self) =>
        index === self.findIndex((c) => c.code === country.code),
    );

  const airlines = tickets
    .map((t) => t.batch?.airline || t.airline_name || t.airline)
    .filter(
      (airline, index, self) => airline && self.indexOf(airline) === index,
    )
    .filter(Boolean) as string[];

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Get airline name from various possible sources
    const airlineName =
      ticket.batch?.airline || ticket.airline_name || ticket.airline || "";
    const countryName = ticket.country?.name || "";
    const flightNumber =
      ticket.batch?.flight_number || ticket.flight_number || "";

    const matchesSearch =
      !searchTerm ||
      airlineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flightNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    const matchesCountry =
      countryFilter === "all" || ticket.country?.code === countryFilter;

    const matchesAirline =
      airlineFilter === "all" || airlineName === airlineFilter;

    return matchesSearch && matchesStatus && matchesCountry && matchesAirline;
  });

  // Calculate statistics
  const stats = {
    total: filteredTickets.length,
    available: filteredTickets.filter(
      (t) => t.status === "available" && t.available_seats > 0,
    ).length,
    booked: filteredTickets.filter((t) => t.status === "booked").length,
    locked: filteredTickets.filter((t) => t.status === "locked").length,
    sold: filteredTickets.filter(
      (t) => t.status === "sold" || t.available_seats === 0,
    ).length,
  };

  const handleView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const airlineName =
      ticket.batch?.airline ||
      ticket.airline_name ||
      ticket.airline ||
      "Unknown Airline";
    const flightNumber =
      ticket.batch?.flight_number || ticket.flight_number || "";

    // Could open a detailed view dialog here
    toast({
      title: "Ticket Details",
      description: `Viewing ${airlineName} ${flightNumber ? `(${flightNumber})` : ""} details`,
    });
  };

  const handleBook = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setBookingOpen(true);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      const response = await apiClient.createBooking(bookingData);
      toast({
        title: "Booking Created Successfully! 🎉",
        description: `Booking ID: ${response.bookingId} | Passenger: ${bookingData.passengerInfo.name}`,
      });

      // Reload tickets to update availability
      await loadTickets(false);
      setBookingOpen(false);
      setSelectedTicket(null);
    } catch (err: any) {
      console.error("Booking submission failed:", err);
      let errorMessage = "Failed to create booking. Please try again.";

      if (err.message) {
        if (err.message.includes("not available")) {
          errorMessage =
            "This ticket is no longer available. Please select another ticket.";
        } else if (err.message.includes("validation")) {
          errorMessage = "Please check all required fields and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // If ticket not available, reload to update availability
      if (errorMessage.includes("not available")) {
        await loadTickets(false);
      }
    }
  };

  const handleExportData = () => {
    const csvContent = [
      [
        "SL",
        "Airline",
        "Route",
        "Date",
        "Time",
        "Price",
        "Seats",
        "Status",
      ].join(","),
      ...filteredTickets.map((ticket, index) =>
        [
          index + 1,
          ticket.batch?.airline || ticket.airline || "N/A",
          `${ticket.batch?.origin || "Origin"} → ${ticket.batch?.destination || ticket.country?.name || "Destination"}`,
          ticket.batch?.flight_date
            ? new Date(ticket.batch.flight_date).toLocaleDateString()
            : ticket.departure_date || "N/A",
          ticket.batch?.departure_time || ticket.departure_time || "N/A",
          `৳${ticket.selling_price.toLocaleString()}`,
          `${ticket.available_seats}/${ticket.total_seats}`,
          ticket.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Tickets data exported to CSV file",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          Error Loading Tickets
        </h3>
        <p className="text-foreground/70 font-body mb-4">{error}</p>
        <Button
          onClick={() => loadTickets()}
          className="velvet-button text-primary-foreground font-body"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
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
              <TicketIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                All Tickets
              </h1>
              <p className="text-foreground/70 font-body">
                Manage and book flight tickets from all destinations
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-gray-100 rounded-full inline-flex items-center space-x-2">
                  <TicketIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Showing {tickets.length} tickets{" "}
                    {tickets.length >= 1000
                      ? "(reached limit)"
                      : "(all tickets)"}
                  </span>
                </div>
                {tickets.length >= 1000 && (
                  <div className="px-3 py-1 bg-orange-100 rounded-full inline-flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      More tickets may exist - contact admin to see all
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExportData}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => loadTickets()}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center space-x-2 velvet-text">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
            <CardDescription className="font-body">
              Search and filter tickets by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search airline, country, flight..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-body"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={airlineFilter} onValueChange={setAirlineFilter}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Filter by airline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Airlines</SelectItem>
                  {airlines.map((airline) => (
                    <SelectItem key={airline} value={airline}>
                      {airline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <span className="font-body text-sm text-foreground/70">
                  {stats.total} tickets found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-foreground velvet-text">
              {stats.total}
            </div>
            <div className="text-sm font-body text-foreground/60">
              Total
              {tickets.length >= 200 && (
                <div className="text-xs text-orange-600 mt-1">
                  (May be limited)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-green-600 velvet-text">
              {stats.available}
            </div>
            <div className="text-sm font-body text-foreground/60">
              Available
            </div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-blue-600 velvet-text">
              {stats.booked}
            </div>
            <div className="text-sm font-body text-foreground/60">Booked</div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-yellow-600 velvet-text">
              {stats.locked}
            </div>
            <div className="text-sm font-body text-foreground/60">Locked</div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-foreground/60 velvet-text">
              {stats.sold}
            </div>
            <div className="text-sm font-body text-foreground/60">Sold</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/20">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-cream-100 to-cream-200 border-b border-border/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      SL
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Airline
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Departure Date
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Selling Price
                    </th>
                    {showBuyingPrice && (
                      <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                        Buying Price
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Seats
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket, index) => (
                      <TicketRow
                        key={ticket.id || `ticket-${index}`}
                        ticket={ticket}
                        index={index}
                        showBuyingPrice={showBuyingPrice}
                        onView={handleView}
                        onBook={handleBook}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={showBuyingPrice ? 10 : 9}
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <TicketIcon className="h-12 w-12 text-foreground/30" />
                          <div>
                            <h3 className="font-heading font-medium text-green-600 mb-1">
                              {searchTerm ||
                              statusFilter !== "all" ||
                              countryFilter !== "all" ||
                              airlineFilter !== "all"
                                ? "No tickets match your criteria"
                                : "Database is Clean & Ready for Real Data!"}
                            </h3>
                            <p className="font-body text-sm text-foreground/60">
                              {searchTerm ||
                              statusFilter !== "all" ||
                              countryFilter !== "all" ||
                              airlineFilter !== "all"
                                ? "Try adjusting your filters or search terms"
                                : "All demo tickets have been removed. Add real tickets through Admin → Buy Tickets"}
                            </p>
                            {(searchTerm ||
                              statusFilter !== "all" ||
                              countryFilter !== "all" ||
                              airlineFilter !== "all") && (
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setStatusFilter("all");
                                  setCountryFilter("all");
                                  setAirlineFilter("all");
                                }}
                                className="mt-2 text-primary hover:underline text-sm font-medium"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Booking Dialog */}
      <BookingDialog
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onSubmit={handleBookingSubmit}
      />
    </div>
  );
}
