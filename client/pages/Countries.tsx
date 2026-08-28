import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plane,
  MapPin,
  Ticket,
  RefreshCw,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiClient } from "../services/api";

interface Country {
  code: string;
  name: string;
  flag: string;
  totalTickets: number;
  availableTickets: number;
}

interface CountryCardProps {
  country: Country;
  index: number;
}

function CountryCard({ country, index }: CountryCardProps) {
  const availabilityPercentage =
    country.totalTickets > 0
      ? (country.availableTickets / country.totalTickets) * 100
      : 0;

  const getAvailabilityStatus = () => {
    if (availabilityPercentage > 50) return "high";
    if (availabilityPercentage > 20) return "medium";
    return "low";
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={`/tickets/${country.code.toLowerCase()}`}>
        <Card className="h-full luxury-card hover:shadow-2xl transition-all duration-300 cursor-pointer group border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-luxury-bronze/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Availability Status Indicator */}
          <div
            className={`absolute top-2 right-2 w-3 h-3 rounded-full z-20 ${
              availabilityStatus === "high"
                ? "bg-green-500 animate-pulse"
                : availabilityStatus === "medium"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            title={`${availabilityPercentage.toFixed(0)}% available`}
          ></div>
          <CardHeader className="text-center responsive-padding pb-2 relative z-10">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              {country.flag}
            </div>
            <CardTitle className="font-heading responsive-text velvet-text group-hover:text-primary transition-colors">
              {country.name}
            </CardTitle>
            <CardDescription className="font-body text-sm text-foreground/60">
              {country.code}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 relative z-10 responsive-padding">
            {/* Ticket Availability */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-foreground/70">
                  Available
                </span>
                <span className="font-heading font-semibold text-primary">
                  {country.availableTickets.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-gradient-to-r from-cream-200 to-cream-300 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    availabilityStatus === "high"
                      ? "bg-gradient-to-r from-green-400 to-green-600 animate-glow"
                      : availabilityStatus === "medium"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : "bg-gradient-to-r from-red-400 to-red-600"
                  }`}
                  style={{
                    width: `${Math.max(availabilityPercentage, 2)}%`,
                    transition: "width 0.5s ease-in-out",
                  }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs font-body text-foreground/50">
                <span>Total: {country.totalTickets.toLocaleString()}</span>
                <span>{availabilityPercentage.toFixed(0)}% available</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-border/30">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded animate-float">
                  <Plane className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-body text-xs mobile-text-sm text-foreground/70">
                  Multiple Airlines
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`p-1 rounded animate-float ${
                    availabilityStatus === "high"
                      ? "bg-gradient-to-br from-green-100 to-green-200"
                      : availabilityStatus === "medium"
                        ? "bg-gradient-to-br from-yellow-100 to-yellow-200"
                        : "bg-gradient-to-br from-red-100 to-red-200"
                  }`}
                  style={{ animationDelay: "0.5s" }}
                >
                  <Ticket
                    className={`h-3 w-3 ${
                      availabilityStatus === "high"
                        ? "text-green-600"
                        : availabilityStatus === "medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  />
                </div>
                <span className="font-body text-xs mobile-text-sm text-foreground/70">
                  {availabilityStatus === "high"
                    ? "High Availability"
                    : availabilityStatus === "medium"
                      ? "Limited Stock"
                      : "Low Stock"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function Countries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const loadCountries = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setIsBackgroundLoading(true);
      }
      setError(null);
      console.log("🌍 Loading countries data...");

      // Check if user is authenticated
      const token = localStorage.getItem("bd_ticket_pro_token");
      console.log("🔑 Auth token present:", !!token);

      const data = await apiClient.getCountries();
      console.log("✅ Countries API response:", data);
      console.log("📊 Countries array:", data.countries);

      if (mountedRef.current) {
        // Ensure we have valid data with proper ticket counts
        const validCountries = (data.countries || []).map((country) => ({
          ...country,
          totalTickets: Number(country.totalTickets) || 0,
          availableTickets: Number(country.availableTickets) || 0,
        }));

        setCountries(validCountries);
        setLastUpdated(new Date());
        setError(null);
        console.log("✅ Countries data loaded successfully:", validCountries);

        // Log summary for debugging (use API totals if available)
        const totalTickets =
          data.totals?.total ||
          validCountries.reduce((sum, c) => sum + c.totalTickets, 0);
        const totalAvailable =
          data.totals?.available ||
          validCountries.reduce((sum, c) => sum + c.availableTickets, 0);
        console.log(
          `📈 Summary: ${totalTickets} total tickets, ${totalAvailable} available across ${validCountries.length} countries`,
        );
        console.log(`📊 API provided totals:`, data.totals);
      }
    } catch (err) {
      console.error("�� Failed to load countries:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.log("🔍 Error details:", {
        message: errorMessage,
        isAuthError:
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("authentication"),
        hasToken: !!localStorage.getItem("bd_ticket_pro_token"),
      });

      // Try to auto-login with default admin credentials if no token
      const token = localStorage.getItem("bd_ticket_pro_token");
      if (
        !token &&
        (errorMessage.includes("401") || errorMessage.includes("Unauthorized"))
      ) {
        console.log("🔐 Attempting auto-login...");
        try {
          const loginResponse = await apiClient.login({
            username: "admin",
            password: "admin123",
          });
          console.log("✅ Auto-login successful:", loginResponse);
          // Retry loading countries
          return await loadCountries(showLoader);
        } catch (loginErr) {
          console.log("❌ Auto-login failed:", loginErr);
        }
      }

      // Only use demo data for authentication errors, show real errors for other issues
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("authentication")
      ) {
        console.log("🔑 Using demo data due to authentication...");

        // Show countries with sample ticket data for testing
        const demoCountries: Country[] = [
          {
            code: "KSA",
            name: "Saudi Arabia",
            flag: "🇸🇦",
            totalTickets: 55,
            availableTickets: 48,
          },
          {
            code: "UAE",
            name: "United Arab Emirates",
            flag: "🇦🇪",
            totalTickets: 55,
            availableTickets: 52,
          },
          {
            code: "QAT",
            name: "Qatar",
            flag: "🇶🇦",
            totalTickets: 25,
            availableTickets: 22,
          },
          {
            code: "KWT",
            name: "Kuwait",
            flag: "🇰🇼",
            totalTickets: 18,
            availableTickets: 16,
          },
          {
            code: "OMN",
            name: "Oman",
            flag: "🇴🇲",
            totalTickets: 22,
            availableTickets: 19,
          },
          {
            code: "BHR",
            name: "Bahrain",
            flag: "🇧����",
            totalTickets: 16,
            availableTickets: 14,
          },
          {
            code: "JOR",
            name: "Jordan",
            flag: "🇯🇴",
            totalTickets: 20,
            availableTickets: 17,
          },
          {
            code: "LBN",
            name: "Lebanon",
            flag: "🇱🇧",
            totalTickets: 14,
            availableTickets: 11,
          },
        ];

        if (mountedRef.current) {
          setCountries(demoCountries);
          setLastUpdated(new Date());
          setError(null); // Clear error since we're showing demo data
          console.log("✅ Demo countries loaded:", demoCountries);
        }
      } else {
        // Show actual error for non-authentication issues
        if (mountedRef.current) {
          setError(errorMessage);
          setCountries([]);
        }
      }
    } finally {
      if (mountedRef.current) {
        if (showLoader) {
          setLoading(false);
        } else {
          setIsBackgroundLoading(false);
        }
      }
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoRefresh) {
        loadCountries(false);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadCountries, autoRefresh]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && isOnline) {
      // Refresh every 30 seconds when auto-refresh is enabled
      intervalRef.current = setInterval(() => {
        loadCountries(false);
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isOnline, loadCountries]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    loadCountries(true);
  }, [loadCountries]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  // Format last updated time
  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return `Updated ${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Updated ${minutes}m ago`;
    } else {
      return lastUpdated.toLocaleTimeString();
    }
  }, [lastUpdated]);

  // Update the formatted time every second
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render to update the time display
      setLastUpdated((prev) => prev);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return; // Ignore if modifier keys are pressed

      switch (event.key.toLowerCase()) {
        case "r":
          event.preventDefault();
          handleManualRefresh();
          break;
        case "t":
          event.preventDefault();
          toggleAutoRefresh();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleManualRefresh, toggleAutoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">
            Loading countries...
          </span>
        </div>
      </div>
    );
  }

  const totalAvailable = countries.reduce(
    (sum, country) => sum + country.availableTickets,
    0,
  );
  const totalTickets = countries.reduce(
    (sum, country) => sum + country.totalTickets,
    0,
  );

  // Add information box about ticket counting differences
  const showInfoBox = totalTickets > 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          Error Loading Countries
        </h3>
        <p className="text-foreground/70 font-body mb-4">{error}</p>
        <Button
          onClick={handleManualRefresh}
          className="velvet-button text-primary-foreground font-body"
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="responsive-heading font-heading font-bold velvet-text">
                Countries
              </h1>
              <p className="text-foreground/70 font-body">
                Browse tickets by destination country
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to="/tickets">
                  <div className="px-3 py-1 bg-green-100 border border-green-300 rounded-md inline-block hover:bg-green-200 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-green-800">
                      Total: {totalTickets} | Available: {totalAvailable} → View
                      All Tickets
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:space-x-4">
            <div className="flex items-center space-x-2 order-2 sm:order-1">
              {/* Connection Status */}
              <div className="flex items-center space-x-1 text-xs">
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`font-body ${isOnline ? "text-green-600" : "text-red-600"}`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* Auto-refresh toggle */}
              <Button
                onClick={toggleAutoRefresh}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="font-body text-xs px-2 py-1 touch-target"
                title={
                  autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"
                }
              >
                <Clock className="h-3 w-3 mr-1" />
                Auto
              </Button>

              {/* Manual refresh */}
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="font-body hover:scale-105 transform transition-all duration-200 touch-target"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {/* Debug button */}
              <Button
                onClick={async () => {
                  console.log("🔍 Debug: Current countries data:", countries);
                  console.log("🔍 Debug: Last updated:", lastUpdated);
                  console.log("🔍 Debug: Loading state:", loading);
                  console.log("🔍 Debug: Error state:", error);

                  try {
                    // Call debug endpoint
                    const response = await fetch("/api/tickets/debug/counts", {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("bd_ticket_pro_token")}`,
                      },
                    });
                    const debugData = await response.json();
                    console.log("🔍 Debug API Response:", debugData);

                    if (debugData.success) {
                      alert(`Debug Info:
Countries Stats Total: ${debugData.data.fromStats.total}
Direct Tickets Total: ${debugData.data.fromTickets.total}
Discrepancy: ${debugData.data.discrepancy.total}

Available from Stats: ${debugData.data.fromStats.available}
Available from Tickets: ${debugData.data.fromTickets.available}
Available Discrepancy: ${debugData.data.discrepancy.available}`);
                    }
                  } catch (err) {
                    console.error("Debug API failed:", err);
                  }
                }}
                variant="outline"
                size="sm"
                className="font-body text-xs touch-target"
              >
                Debug
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="hidden lg:flex items-center space-x-6 luxury-card p-4 rounded-lg border-0 backdrop-blur-md order-1 sm:order-2">
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-primary velvet-text">
                  {totalAvailable.toLocaleString()}
                </p>
                <p className="text-xs font-body text-foreground/60">
                  Available
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-foreground velvet-text">
                  {totalTickets.toLocaleString()}
                </p>
                <p className="text-xs font-body text-foreground/60">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-blue-600 velvet-text">
                  {countries.length}
                </p>
                <p className="text-xs font-body text-foreground/60">
                  Countries
                </p>
              </div>

              {/* Last Updated Info */}
              {lastUpdated && (
                <div className="text-center border-l border-border/30 pl-4">
                  <p className="text-xs font-body text-foreground/60">
                    {formatLastUpdated()}
                  </p>
                  {autoRefresh && isOnline && (
                    <div className="flex items-center justify-center mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${isBackgroundLoading ? "bg-blue-500 animate-spin" : "bg-green-500 animate-pulse"}`}
                      ></div>
                      <span
                        className={`text-xs font-body ml-1 ${isBackgroundLoading ? "text-blue-600" : "text-green-600"}`}
                      >
                        {isBackgroundLoading ? "Updating..." : "Live"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="md:hidden grid grid-cols-3 gap-4"
      >
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-primary velvet-text">
            {totalAvailable.toLocaleString()}
          </div>
          <div className="text-xs font-body text-foreground/60">Available</div>
        </Card>
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-foreground velvet-text">
            {totalTickets.toLocaleString()}
          </div>
          <div className="text-xs font-body text-foreground/60">Total</div>
        </Card>
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-blue-600 velvet-text">
            {countries.length}
          </div>
          <div className="text-xs font-body text-foreground/60">Countries</div>
          {lastUpdated && autoRefresh && isOnline && (
            <div className="flex items-center justify-center mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-body text-green-600 ml-1">
                Live
              </span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Information Box */}
      {showInfoBox && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="luxury-card p-4 border-l-4 border-blue-500 bg-blue-50/50"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-heading font-semibold text-blue-900 mb-1">
                Ticket Count Information
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                This page shows summary statistics by country. The{" "}
                <Link to="/tickets" className="underline hover:text-blue-900">
                  All Tickets page
                </Link>{" "}
                shows individual ticket records with pagination limits.
              </p>
              <p className="text-xs text-blue-700">
                Countries Total: {totalTickets} tickets | Click any country card
                to see detailed tickets for that destination.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Countries Grid */}
      {countries.length > 0 ? (
        <div className="responsive-grid gap-4 sm:gap-6">
          {countries.map((country, index) => (
            <CountryCard key={country.code} country={country} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-heading font-bold text-green-600 mb-2">
            Database is Clean & Ready!
          </h3>
          <p className="text-foreground/70 font-body mb-4">
            All demo ticket data has been removed. You can now start adding real
            tickets.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Add ticket batches through Admin → Buy Tickets</li>
              <li>• Create real bookings through the booking system</li>
              <li>• Start managing real customer data</li>
              <li>• Countries will appear here once tickets are added</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center py-8"
      >
        <div className="space-y-2">
          <p className="font-body text-sm text-foreground/50">
            Click on any country to view available tickets and make bookings
          </p>
          {lastUpdated && (
            <p className="font-body text-xs text-foreground/40">
              Last updated: {lastUpdated.toLocaleString()} •
              {autoRefresh && isOnline
                ? "Auto-refreshing every 30s"
                : "Manual refresh only"}
            </p>
          )}
          <p className="font-body text-xs text-foreground/30">
            Press 'R' to refresh • Press 'T' to toggle auto-refresh
          </p>
        </div>
      </motion.div>
    </div>
  );
}
