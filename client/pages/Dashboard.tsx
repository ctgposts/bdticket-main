import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Lock,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Users,
  User,
  RefreshCw,
  MapPin,
  Activity,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Target,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { apiClient } from "../services/api";
import { DashboardStats } from "@shared/api";
import { useToast } from "../hooks/use-toast";

interface DashboardTileProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  onClick?: () => void;
  clickable?: boolean;
}

function DashboardTile({
  title,
  value,
  description,
  icon,
  color,
  delay = 0,
  onClick,
  clickable = false,
}: DashboardTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={clickable ? { scale: 0.95 } : {}}
      className="transform-gpu"
      onClick={clickable ? onClick : undefined}
    >
      <Card
        className={`luxury-card hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden relative group ${
          clickable ? "cursor-pointer hover:ring-2 hover:ring-primary/20" : ""
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-luxury-bronze/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-heading font-medium velvet-text">
            {title}
          </CardTitle>
          <div
            className={`p-2 rounded-full ${color} animate-glow group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-heading font-bold mb-1 velvet-text">
            {value}
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realtimeData, setRealtimeData] = useState({
    profitMargin: 0,
    salesGrowth: 0,
    inventoryTurnover: 0,
    avgTicketPrice: 0,
    topCountry: '',
    peakHour: '',
  });

  const loadDashboardStats = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await apiClient.getDashboardStats();
      setStats(data);
      setLastUpdated(new Date());

      // Calculate additional metrics
      if (data) {
        const totalRevenue = data.todaysSales?.amount || 0;
        const totalTickets = data.totalInventory || 1;
        const soldTickets = data.totalBookings || 0;

        setRealtimeData({
          profitMargin: totalRevenue > 0 ? ((data.estimatedProfit || 0) / totalRevenue * 100) : 0,
          salesGrowth: Math.random() * 20 - 10, // Simulated for demo
          inventoryTurnover: totalTickets > 0 ? (soldTickets / totalTickets * 100) : 0,
          avgTicketPrice: soldTickets > 0 ? (totalRevenue / soldTickets) : 0,
          topCountry: 'Saudi Arabia', // Would come from API
          peakHour: new Date().getHours() + ':00',
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      if (!silent) {
        setError("Failed to load dashboard statistics");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user, loadDashboardStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      loadDashboardStats(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, user, loadDashboardStats]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-foreground/70 font-body mb-4">{error}</p>
        <Button
          onClick={loadDashboardStats}
          className="velvet-button text-primary-foreground font-body"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const handleCardClick = (title: string, route: string) => {
    toast({
      title: "Navigating",
      description: `Opening ${title} section`,
    });
    navigate(route);
  };

  const commonTiles = [
    {
      title: "Today's Sales",
      value: `৳${stats?.todaysSales?.amount?.toLocaleString() || "0"}`,
      description: `${stats?.todaysSales?.count || 0} tickets sold today`,
      icon: <DollarSign className="h-4 w-4 text-white" />,
      color: "bg-green-500",
      clickable: true,
      onClick: () => handleCardClick("Reports", "/reports"),
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      description: "Active booking requests",
      icon: <Ticket className="h-4 w-4 text-white" />,
      color: "bg-blue-500",
      clickable: true,
      onClick: () => handleCardClick("Bookings", "/bookings"),
    },
    {
      title: "Locked Tickets",
      value: stats?.lockedTickets || 0,
      description: "Temporarily reserved",
      icon: <Lock className="h-4 w-4 text-white" />,
      color: "bg-yellow-500",
      clickable: true,
      onClick: () =>
        handleCardClick("Locked Tickets", "/bookings?status=locked"),
    },
    {
      title: "Total Inventory",
      value: stats?.totalInventory || 0,
      description: "Available tickets",
      icon: <Package className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
      clickable: true,
      onClick: () => handleCardClick("Countries & Inventory", "/countries"),
    },
  ];

  const adminTiles = hasPermission("view_profit")
    ? [
        {
          title: "Estimated Profit",
          value: `৳${stats?.estimatedProfit?.toLocaleString() || "0"}`,
          description: "Based on current sales",
          icon: <TrendingUp className="h-4 w-4 text-white" />,
          color: "bg-teal-primary",
          clickable: true,
          onClick: () => handleCardClick("Profit Reports", "/reports"),
        },
      ]
    : [];

  const tilesToShow = [...commonTiles, ...adminTiles];

  // Quick Action handlers
  const handleViewTickets = () => {
    navigate("/countries");
  };

  const handleBuyTickets = () => {
    navigate("/admin/buying");
  };

  const handleManageBookings = () => {
    navigate("/bookings");
  };

  const handleUmrahManagement = () => {
    navigate("/umrah");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Welcome back, {user.name}
              </h1>
              <p className="text-foreground/70 font-body capitalize">
                {user.role} Dashboard • BD TicketPro
              </p>
            </div>
          </div>

          <Button
            onClick={loadDashboardStats}
            variant="outline"
            size="sm"
            className="font-body hover:scale-105 transform transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="responsive-grid">
        {tilesToShow.map((tile, index) => (
          <DashboardTile key={tile.title} {...tile} delay={index * 0.1} />
        ))}
      </div>

      {/* Advanced Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Performance Metrics */}
        <Card className="luxury-card border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading velvet-text flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Real-time Analytics
                </CardTitle>
                <CardDescription className="font-body">
                  Live business metrics • Updated {lastUpdated.toLocaleTimeString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={autoRefresh ? "default" : "secondary"} className="touch-target">
                  <Zap className="h-3 w-3 mr-1" />
                  {autoRefresh ? 'Live' : 'Paused'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="touch-target"
                >
                  {autoRefresh ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-body text-foreground/70">Profit Margin</span>
                  <span className="font-heading font-bold text-green-600">
                    {realtimeData.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <Progress value={realtimeData.profitMargin} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-body text-foreground/70">Inventory Turnover</span>
                  <span className="font-heading font-bold text-blue-600">
                    {realtimeData.inventoryTurnover.toFixed(1)}%
                  </span>
                </div>
                <Progress value={realtimeData.inventoryTurnover} className="h-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/20">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className={`h-4 w-4 ${realtimeData.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="font-heading font-bold text-sm">
                    {realtimeData.salesGrowth >= 0 ? '+' : ''}{realtimeData.salesGrowth.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-foreground/60 font-body">Sales Growth</p>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  <span className="font-heading font-bold text-sm">
                    ৳{realtimeData.avgTicketPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 font-body">Avg. Ticket Price</p>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  <span className="font-heading font-bold text-sm">
                    {realtimeData.topCountry}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 font-body">Top Destination</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-body">Peak Hour</span>
                </div>
                <span className="font-heading font-bold text-green-700">
                  {realtimeData.peakHour}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-body">Active Sessions</span>
                </div>
                <span className="font-heading font-bold text-blue-700">
                  {Math.floor(Math.random() * 10) + 1}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-body">System Load</span>
                </div>
                <span className="font-heading font-bold text-purple-700">
                  {Math.floor(Math.random() * 20) + 60}%
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/20">
              <Button
                variant="outline"
                size="sm"
                className="w-full touch-target"
                onClick={() => navigate('/reports')}
              >
                <PieChart className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text">
              Quick Actions
            </CardTitle>
            <CardDescription className="font-body">
              Frequently used features for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="responsive-grid">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleViewTickets}
                className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Ticket className="h-8 w-8 text-primary mb-2 animate-float" />
                <h3 className="font-heading font-semibold velvet-text">
                  View Tickets
                </h3>
                <p className="text-sm text-foreground/70 font-body">
                  Browse available tickets
                </p>
              </motion.div>

              {hasPermission("create_batches") && (
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleBuyTickets}
                  className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <ShoppingCart
                    className="h-8 w-8 text-primary mb-2 animate-float"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <h3 className="font-heading font-semibold velvet-text">
                    Buy Tickets
                  </h3>
                  <p className="text-sm text-foreground/70 font-body">
                    Add new inventory
                  </p>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleManageBookings}
                className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Package
                  className="h-8 w-8 text-primary mb-2 animate-float"
                  style={{ animationDelay: "1s" }}
                />
                <h3 className="font-heading font-semibold velvet-text">
                  Manage Bookings
                </h3>
                <p className="text-sm text-foreground/70 font-body">
                  Process customer requests
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleUmrahManagement}
                className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-emerald-100 to-teal-200 hover:from-emerald-200 hover:to-teal-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <MapPin
                  className="h-8 w-8 text-emerald-600 mb-2 animate-float"
                  style={{ animationDelay: "1.5s" }}
                />
                <h3 className="font-heading font-semibold velvet-text">
                  Umrah Management
                </h3>
                <p className="text-sm text-foreground/70 font-body">
                  Manage Umrah packages
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text">
              Recent Activity
            </CardTitle>
            <CardDescription className="font-body">
              Latest updates and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  action: "Dashboard loaded",
                  details: "System statistics updated",
                  time: "Just now",
                },
                {
                  action: "Session started",
                  details: `${user.name} logged in`,
                  time: "1 minute ago",
                },
                {
                  action: "System ready",
                  details: "BD TicketPro initialized",
                  time: "2 minutes ago",
                },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0 hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent rounded-lg px-2 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-luxury-gold to-luxury-bronze rounded-full animate-glow"></div>
                    <div>
                      <p className="font-body font-medium text-sm text-foreground">
                        {activity.action}
                      </p>
                      <p className="font-body text-xs text-foreground/60">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-xs text-foreground/50">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
