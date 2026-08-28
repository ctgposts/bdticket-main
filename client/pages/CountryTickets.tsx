import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plane,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Eye,
  ShoppingCart,
  Filter,
  Search,
  Users,
  Badge as BadgeIcon,
  SortAsc,
  SortDesc,
  RefreshCw,
  Download,
  Grid,
  List,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { apiClient } from "../services/api";
import { useToast } from "../hooks/use-toast";
import { BookingDialog } from "../components/BookingDialog";

interface TicketData {
  id: string;
  batch_id: string;
  flight_number: string;
  status: "available" | "booked" | "locked" | "sold";
  selling_price: number;
  aircraft?: string;
  terminal?: string;
  arrival_time?: string;
  duration?: string;
  available_seats: number;
  total_seats: number;
  locked_until?: string;
  sold_by?: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
  batch: {
    id: string;
    country_code: string;
    airline_name: string;
    flight_date: string;
    flight_time: string;
    buying_price?: number;
    quantity: number;
    agent_name: string;
    agent_contact?: string;
    agent_address?: string;
    remarks?: string;
    document_url?: string;
    created_by: string;
    created_at: string;
  };
}

export default function CountryTickets() {
  const { country } = useParams<{ country: string }>();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingTicket, setBookingTicket] = useState<TicketData | null>(null);

  const showBuyingPrice = hasPermission("view_buying_price");

  // Country information mapping
  const countryInfo = {
    ksa: { name: "Saudi Arabia", flag: "🇸🇦", code: "KSA" },
    uae: { name: "United Arab Emirates", flag: "🇦🇪", code: "UAE" },
    qatar: { name: "Qatar", flag: "🇶🇦", code: "QAT" },
    kuwait: { name: "Kuwait", flag: "🇰🇼", code: "KWT" },
    oman: { name: "Oman", flag: "🇴🇲", code: "OMN" },
    bahrain: { name: "Bahrain", flag: "🇧🇭", code: "BHR" },
    jordan: { name: "Jordan", flag: "🇯🇴", code: "JOR" },
    lebanon: { name: "Lebanon", flag: "🇱🇧", code: "LBN" },
  };

  const currentCountry =
    countryInfo[country?.toLowerCase() as keyof typeof countryInfo];

  // Load tickets data
  useEffect(() => {
    if (country) {
      loadTickets();
    }
  }, [country]);

  const loadTickets = async (showLoading = true) => {
    if (!country) return;

    try {
      if (showLoading) {
        setLoading(true);
        setRefreshing(false);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const countryCode = country.toUpperCase();
      console.log(`🎫 Loading tickets for country: ${countryCode}`);

      // Use the apiClient directly instead of the destructured method
      const response = await apiClient.getTicketsByCountry(countryCode);
      console.log(`✅ Tickets response for ${countryCode}:`, response);
      console.log(`📊 Found ${response.tickets?.length || 0} tickets`);

      setTickets(response.tickets || []);
    } catch (err: any) {
      console.error(`❌ Error loading tickets for ${country}:`, err);
      setError(err.message || "Failed to load tickets");
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTickets(false);
  };

  const airlines = [...new Set(tickets.map((t) => t.batch.airline_name))];

  const filteredTickets = tickets
    .filter((ticket) => {
      const matchesSearch =
        ticket.batch.airline_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ticket.flight_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.batch.agent_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesAirline =
        airlineFilter === "all" || ticket.batch.airline_name === airlineFilter;

      return matchesSearch && matchesStatus && matchesAirline;
    })
    .sort((a, b) => {
      if (priceSort === "asc") return a.selling_price - b.selling_price;
      return b.selling_price - a.selling_price;
    });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "--:--";
    return timeString;
  };

  const exportTickets = () => {
    const csvContent = [
      [
        "Flight Number",
        "Airline",
        "Date",
        "Time",
        "Status",
        "Price",
        "Available Seats",
      ],
      ...filteredTickets.map((ticket) => [
        ticket.flight_number,
        ticket.batch.airline_name,
        ticket.batch.flight_date,
        ticket.batch.flight_time,
        ticket.status,
        ticket.selling_price,
        ticket.available_seats,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentCountry?.name || "country"}_tickets.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
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
            Sold Out
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBookTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setBookingTicket(ticket);
      setBookingOpen(true);
    }
  };

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      console.log("Creating booking with data:", bookingData);

      const response = await apiClient.createBooking(bookingData);

      toast({
        title: "Booking Created Successfully! 🎉",
        description: `Booking ID: ${response.bookingId} | Passenger: ${bookingData.passengerInfo.name}`,
      });

      // Refresh tickets to update status
      await loadTickets(false);
      setBookingOpen(false);
      setBookingTicket(null);

      // Show detailed success information
      setTimeout(() => {
        toast({
          title: "Next Steps",
          description:
            "Check the Bookings section to manage this booking and process payments.",
        });
      }, 2000);
    } catch (err: any) {
      console.error("Error creating booking:", err);

      let errorMessage = "Failed to create booking. Please try again.";

      if (err.message) {
        if (err.message.includes("not available")) {
          errorMessage = "This ticket is no longer available for booking.";
        } else if (err.message.includes("validation")) {
          errorMessage = "Please check all required fields and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      toast({
        title: "Booking Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });

      // If ticket is no longer available, refresh the list
      if (errorMessage.includes("not available")) {
        await loadTickets(false);
      }
    }
  };

  const handleViewDetails = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setDetailsOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600 bg-green-50";
      case "booked":
        return "text-blue-600 bg-blue-50";
      case "locked":
        return "text-yellow-600 bg-yellow-50";
      case "sold":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getAvailabilityPercentage = (available: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((available / total) * 100);
  };

  if (!currentCountry) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
          Country Not Found
        </h1>
        <p className="text-foreground/70 font-body mb-6">
          The requested country could not be found.
        </p>
        <Link to="/countries">
          <Button className="velvet-button text-primary-foreground font-body">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Countries
          </Button>
        </Link>
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/countries">
              <Button variant="outline" size="sm" className="font-body">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{currentCountry.flag}</div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold velvet-text">
                  {currentCountry.name} Flights
                </h1>
                <p className="text-foreground/70 font-body text-sm lg:text-base">
                  Available flights to {currentCountry.name}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="font-body"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={exportTickets}
              variant="outline"
              size="sm"
              className="font-body"
              disabled={filteredTickets.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div className="flex items-center space-x-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="luxury-card p-4 rounded-lg border-0 text-center">
            <div className="text-xl font-heading font-bold text-green-600 velvet-text">
              {loading ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                filteredTickets.filter((t) => t.status === "available").length
              )}
            </div>
            <p className="text-xs font-body text-foreground/60">Available</p>
          </div>
          <div className="luxury-card p-4 rounded-lg border-0 text-center">
            <div className="text-xl font-heading font-bold text-blue-600 velvet-text">
              {loading ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                filteredTickets.reduce((sum, t) => sum + t.available_seats, 0)
              )}
            </div>
            <p className="text-xs font-body text-foreground/60">Total Seats</p>
          </div>
          <div className="luxury-card p-4 rounded-lg border-0 text-center">
            <div className="text-xl font-heading font-bold text-primary velvet-text">
              {loading ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                airlines.length
              )}
            </div>
            <p className="text-xs font-body text-foreground/60">Airlines</p>
          </div>
          <div className="luxury-card p-4 rounded-lg border-0 text-center">
            <div className="text-xl font-heading font-bold text-orange-600 velvet-text">
              {loading ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                tickets.length
              )}
            </div>
            <p className="text-xs font-body text-foreground/60">
              Total Tickets
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Flights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Filters */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative md:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                  <Input
                    placeholder="Search flights, airlines, agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-body"
                    disabled={loading}
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={loading}
                >
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

                <Select
                  value={airlineFilter}
                  onValueChange={setAirlineFilter}
                  disabled={loading}
                >
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

                <Select
                  value={priceSort}
                  onValueChange={setPriceSort}
                  disabled={loading}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Sort by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center">
                        <SortAsc className="h-4 w-4 mr-2" />
                        Price: Low to High
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center">
                        <SortDesc className="h-4 w-4 mr-2" />
                        Price: High to Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between md:col-span-2 lg:col-span-1">
                  <div className="font-body text-sm text-foreground/70">
                    {loading ? (
                      <Skeleton className="h-4 w-20" />
                    ) : (
                      `${filteredTickets.length} flights found`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            <div className="md:hidden">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                  <Input
                    placeholder="Search flights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-body"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Sheet
                    open={mobileFiltersOpen}
                    onOpenChange={setMobileFiltersOpen}
                  >
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="font-body">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {(statusFilter !== "all" ||
                          airlineFilter !== "all") && (
                          <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-primary text-primary-foreground">
                            {
                              [
                                statusFilter !== "all",
                                airlineFilter !== "all",
                              ].filter(Boolean).length
                            }
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filter Options</SheetTitle>
                        <SheetDescription>
                          Customize your flight search
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                            disabled={loading}
                          >
                            <SelectTrigger className="font-body mt-1">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="available">
                                Available
                              </SelectItem>
                              <SelectItem value="booked">Booked</SelectItem>
                              <SelectItem value="locked">Locked</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Airline</label>
                          <Select
                            value={airlineFilter}
                            onValueChange={setAirlineFilter}
                            disabled={loading}
                          >
                            <SelectTrigger className="font-body mt-1">
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
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Sort by Price
                          </label>
                          <Select
                            value={priceSort}
                            onValueChange={setPriceSort}
                            disabled={loading}
                          >
                            <SelectTrigger className="font-body mt-1">
                              <SelectValue placeholder="Sort by price" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">
                                <div className="flex items-center">
                                  <SortAsc className="h-4 w-4 mr-2" />
                                  Price: Low to High
                                </div>
                              </SelectItem>
                              <SelectItem value="desc">
                                <div className="flex items-center">
                                  <SortDesc className="h-4 w-4 mr-2" />
                                  Price: High to Low
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(searchTerm ||
                          statusFilter !== "all" ||
                          airlineFilter !== "all") && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("all");
                              setAirlineFilter("all");
                              setMobileFiltersOpen(false);
                            }}
                            className="w-full font-body"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="font-body text-sm text-foreground/70">
                    {loading ? (
                      <Skeleton className="h-4 w-20" />
                    ) : (
                      `${filteredTickets.length} found`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters - Desktop Only */}
            {(searchTerm ||
              statusFilter !== "all" ||
              airlineFilter !== "all") && (
              <div className="hidden md:block mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setAirlineFilter("all");
                  }}
                  className="font-body"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="luxury-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            Error Loading Flights
          </h3>
          <p className="text-foreground/60 font-body mb-4">{error}</p>
          <Button onClick={() => loadTickets()} className="velvet-button">
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Flight Cards/List */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card
                className={`luxury-card border-0 ${viewMode === "list" ? "" : "h-full"} ${
                  ticket.status === "sold" ? "opacity-75" : ""
                } hover:shadow-2xl transition-all duration-300 group`}
              >
                <CardHeader className="pb-3">
                  <div
                    className={`flex items-center justify-between ${viewMode === "list" ? "flex-row" : ""}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-luxury-gold/20 to-luxury-bronze/20 rounded-full">
                        <Plane className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-lg velvet-text">
                          {ticket.batch.airline_name}
                        </CardTitle>
                        <CardDescription className="font-body text-sm">
                          {ticket.flight_number}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Flight Details */}
                  <div
                    className={`grid ${viewMode === "list" ? "grid-cols-4" : "grid-cols-2"} gap-4`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-foreground/40" />
                        <span className="font-body text-sm text-foreground">
                          {formatDate(ticket.batch.flight_date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-foreground/40" />
                        <span className="font-body text-sm text-foreground">
                          {formatTime(ticket.batch.flight_time)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-foreground/40" />
                        <span className="font-body text-sm text-foreground">
                          {ticket.terminal || "Terminal 1"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BadgeIcon className="h-4 w-4 text-foreground/40" />
                        <span className="font-body text-sm text-foreground">
                          {ticket.aircraft || "Boeing 737"}
                        </span>
                      </div>
                    </div>
                    {viewMode === "list" && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-foreground/40" />
                            <span className="font-body text-sm text-foreground">
                              {ticket.available_seats}/{ticket.total_seats}{" "}
                              seats
                            </span>
                          </div>
                          <div className="text-xs text-foreground/60 font-body">
                            Agent: {ticket.batch.agent_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-heading font-bold text-lg text-green-600">
                              ৳{ticket.selling_price.toLocaleString()}
                            </span>
                          </div>
                          {showBuyingPrice && ticket.batch.buying_price && (
                            <div className="text-xs text-foreground/60 font-body">
                              Cost: ৳
                              {ticket.batch.buying_price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {viewMode === "grid" && (
                    <>
                      {/* Journey Info */}
                      <div className="bg-gradient-to-r from-cream-100 to-cream-200 rounded-lg p-3">
                        <div className="flex justify-between items-center text-sm font-body">
                          <span className="text-foreground">Dhaka (DAC)</span>
                          <div className="flex items-center space-x-2 text-foreground/60">
                            <div className="w-8 border-t border-foreground/30"></div>
                            <Plane className="h-4 w-4" />
                            <div className="w-8 border-t border-foreground/30"></div>
                          </div>
                          <span className="text-foreground">
                            {currentCountry.code}
                          </span>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-xs text-foreground/60 font-body">
                            {ticket.duration || "4h 15m"}
                          </span>
                        </div>
                      </div>

                      {/* Seats and Pricing */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-foreground/40" />
                          <span className="font-body text-sm text-foreground">
                            {ticket.available_seats}/{ticket.total_seats} seats
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-heading font-bold text-lg text-green-600">
                              ৳{ticket.selling_price.toLocaleString()}
                            </span>
                          </div>
                          {showBuyingPrice && ticket.batch.buying_price && (
                            <div className="text-xs text-foreground/60 font-body">
                              Cost: ৳
                              {ticket.batch.buying_price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Agent Info */}
                      <div className="text-xs text-foreground/60 font-body border-t pt-2">
                        Agent: {ticket.batch.agent_name}
                        {ticket.batch.agent_contact && (
                          <span className="ml-2">
                            • {ticket.batch.agent_contact}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div
                    className={`flex space-x-2 pt-2 ${viewMode === "list" ? "justify-end" : ""}`}
                  >
                    <Button
                      onClick={() => handleViewDetails(ticket.id)}
                      variant="outline"
                      size="sm"
                      className={`${viewMode === "list" ? "" : "flex-1"} font-body hover:scale-105 transform transition-all duration-200`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    {ticket.status === "available" &&
                      ticket.available_seats > 0 && (
                        <Button
                          onClick={() => handleBookTicket(ticket.id)}
                          size="sm"
                          className={`${viewMode === "list" ? "" : "flex-1"} velvet-button text-primary-foreground font-body hover:scale-105 transform transition-all duration-200`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Book Now</span>
                          <span className="sm:hidden">Book</span>
                        </Button>
                      )}
                    {ticket.status === "available" &&
                      ticket.available_seats === 0 && (
                        <Button
                          disabled
                          size="sm"
                          className={`${viewMode === "list" ? "" : "flex-1"} font-body`}
                          variant="outline"
                        >
                          No Seats
                        </Button>
                      )}
                    {ticket.status === "sold" && (
                      <Button
                        disabled
                        size="sm"
                        className={`${viewMode === "list" ? "" : "flex-1"} font-body`}
                        variant="outline"
                      >
                        Sold Out
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* No Results */}
      {!loading && !error && filteredTickets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            {tickets.length === 0 ? "No flights available" : "No flights found"}
          </h3>
          <p className="text-foreground/60 font-body mb-4">
            {tickets.length === 0
              ? `No tickets are currently available for ${currentCountry.name}`
              : "Try adjusting your filters to see more results"}
          </p>
          {tickets.length === 0 && (
            <Button
              onClick={() => loadTickets()}
              variant="outline"
              className="font-body"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </motion.div>
      )}

      {/* Ticket Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading velvet-text">
              Flight Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this flight ticket
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cream-100 to-cream-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-full">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold">
                      {selectedTicket.batch.airline_name}
                    </h3>
                    <p className="text-sm text-foreground/70">
                      {selectedTicket.flight_number}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>

              {/* Flight Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-heading font-semibold text-lg">
                    Flight Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-foreground/40" />
                      <div>
                        <p className="text-sm text-foreground/60">
                          Departure Date
                        </p>
                        <p className="font-medium">
                          {formatDate(selectedTicket.batch.flight_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-foreground/40" />
                      <div>
                        <p className="text-sm text-foreground/60">
                          Departure Time
                        </p>
                        <p className="font-medium">
                          {formatTime(selectedTicket.batch.flight_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-foreground/40" />
                      <div>
                        <p className="text-sm text-foreground/60">Terminal</p>
                        <p className="font-medium">
                          {selectedTicket.terminal || "Terminal 1"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BadgeIcon className="h-4 w-4 text-foreground/40" />
                      <div>
                        <p className="text-sm text-foreground/60">Aircraft</p>
                        <p className="font-medium">
                          {selectedTicket.aircraft || "Boeing 737"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-heading font-semibold text-lg">
                    Pricing & Availability
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-foreground/60">
                          Selling Price
                        </p>
                        <p className="font-medium text-green-600 text-lg">
                          ৳{selectedTicket.selling_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {showBuyingPrice && selectedTicket.batch.buying_price && (
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm text-foreground/60">
                            Buying Price
                          </p>
                          <p className="font-medium text-orange-600">
                            ৳
                            {selectedTicket.batch.buying_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-foreground/60">
                          Seat Availability
                        </p>
                        <p className="font-medium">
                          {selectedTicket.available_seats} of{" "}
                          {selectedTicket.total_seats} available
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${getAvailabilityPercentage(selectedTicket.available_seats, selectedTicket.total_seats)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <h4 className="font-heading font-semibold text-lg mb-3">
                  Route
                </h4>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="font-bold text-lg">DAC</p>
                    <p className="text-sm text-foreground/60">Dhaka</p>
                    <p className="text-sm text-foreground/60">Bangladesh</p>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground/60">
                    <div className="w-12 border-t border-foreground/30"></div>
                    <Plane className="h-5 w-5" />
                    <div className="w-12 border-t border-foreground/30"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{currentCountry.code}</p>
                    <p className="text-sm text-foreground/60">
                      {currentCountry.name}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {selectedTicket.duration || "4h 15m"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <h4 className="font-heading font-semibold text-lg mb-3">
                  Agent Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground/60">Agent Name</p>
                    <p className="font-medium">
                      {selectedTicket.batch.agent_name}
                    </p>
                  </div>
                  {selectedTicket.batch.agent_contact && (
                    <div>
                      <p className="text-sm text-foreground/60">Contact</p>
                      <p className="font-medium">
                        {selectedTicket.batch.agent_contact}
                      </p>
                    </div>
                  )}
                  {selectedTicket.batch.agent_address && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-foreground/60">Address</p>
                      <p className="font-medium">
                        {selectedTicket.batch.agent_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {selectedTicket.status === "available" && (
                  <Button
                    onClick={() => {
                      handleBookTicket(selectedTicket.id);
                      setDetailsOpen(false);
                    }}
                    className="flex-1 velvet-button text-primary-foreground font-body"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Book This Flight
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                  className="font-body"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <BookingDialog
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setBookingTicket(null);
        }}
        ticket={bookingTicket}
        onSubmit={handleBookingSubmit}
      />
    </div>
  );
}
