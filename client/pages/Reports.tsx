import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
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
import { Badge } from "../components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  LineChart,
  Globe,
  Plane,
  Clock,
  AlertCircle,
  FileText,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useToast } from "../hooks/use-toast";

interface ReportData {
  salesReport: {
    totalRevenue: number;
    totalBookings: number;
    avgTicketPrice: number;
    profitMargin: number;
    dailySales: Array<{ date: string; amount: number; bookings: number }>;
  };
  countryReport: {
    topCountries: Array<{
      country: string;
      bookings: number;
      revenue: number;
      flag?: string;
    }>;
  };
  agentReport: {
    topAgents: Array<{ agent: string; bookings: number; revenue: number }>;
  };
  paymentReport: {
    paymentMethods: Array<{ method: string; count: number; amount: number }>;
    pendingPayments: number;
    completedPayments: number;
  };
}

export default function Reports() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Get real dashboard stats
      const stats = await apiClient.getDashboardStats();
      const bookings = await apiClient.getBookings({ limit: 100 });
      const countries = await apiClient.getCountries();

      // Process real data to create report structure
      const mockData: ReportData = {
        salesReport: {
          totalRevenue: stats.todaysSales?.amount || 0,
          totalBookings: stats.totalBookings || 0,
          avgTicketPrice:
            stats.todaysSales?.amount && stats.todaysSales?.count
              ? Math.round(stats.todaysSales.amount / stats.todaysSales.count)
              : 0,
          profitMargin: 0, // Will be calculated when real data is available
          dailySales: [], // Will be populated with real sales data
        },
        countryReport: {
          topCountries: [], // Will be populated with real booking and revenue data
        },
        agentReport: {
          topAgents: [], // Will show real agent performance data
        },
        paymentReport: {
          paymentMethods: [], // Will show real payment method statistics
          pendingPayments: 0,
          completedPayments: 0,
        },
      };

      setReportData(mockData);
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast({
        title: "Error Loading Reports",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: string) => {
    if (!reportData) return;

    let csvContent = "";

    if (reportType === "countries") {
      csvContent = [
        [
          "Country",
          "Bookings",
          "Revenue",
          "Average Price",
          "Market Share",
        ].join(","),
        ...reportData.countryReport.topCountries.map((country) =>
          [
            country.country,
            country.bookings,
            country.revenue,
            Math.round(country.revenue / country.bookings),
            `${((country.bookings / reportData.salesReport.totalBookings) * 100).toFixed(1)}%`,
          ].join(","),
        ),
      ].join("\n");
    } else if (reportType === "agents") {
      csvContent = [
        ["Agent", "Bookings", "Revenue", "Average Deal Size"].join(","),
        ...reportData.agentReport.topAgents.map((agent) =>
          [
            agent.agent,
            agent.bookings,
            agent.revenue,
            Math.round(agent.revenue / agent.bookings),
          ].join(","),
        ),
      ].join("\n");
    } else {
      // Overview export
      csvContent = [
        ["Metric", "Value"].join(","),
        [
          "Total Revenue",
          `৳${reportData.salesReport.totalRevenue.toLocaleString()}`,
        ],
        ["Total Bookings", reportData.salesReport.totalBookings],
        [
          "Average Ticket Price",
          `৳${reportData.salesReport.avgTicketPrice.toLocaleString()}`,
        ],
        ["Profit Margin", `${reportData.salesReport.profitMargin}%`],
      ].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${reportType} report exported as ${format.toUpperCase()}`,
    });
  };

  if (!hasPermission("view_profit")) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="luxury-card border-0">
            <CardContent className="p-12 text-center">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-heading font-bold velvet-text mb-2">
                Access Denied
              </h2>
              <p className="text-foreground/70 font-body">
                You don't have permission to view financial reports.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="luxury-card border-0">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="luxury-card border-0">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Business Reports
              </h1>
              <p className="text-foreground/70 font-body">
                Comprehensive analytics and business insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="font-body text-sm">
                From:
              </Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-auto font-body"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="font-body text-sm">
                To:
              </Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-auto font-body"
              />
            </div>
            <Button
              onClick={loadReportData}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="luxury-card border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 font-body">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-heading font-bold velvet-text">
                    ৳{reportData?.salesReport.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1 font-body">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="luxury-card border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 font-body">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-heading font-bold velvet-text">
                    {reportData?.salesReport.totalBookings}
                  </p>
                  <p className="text-sm text-blue-600 flex items-center mt-1 font-body">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8.3% from last month
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full">
                  <Ticket className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="luxury-card border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 font-body">
                    Avg. Ticket Price
                  </p>
                  <p className="text-2xl font-heading font-bold velvet-text">
                    ৳{reportData?.salesReport.avgTicketPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-purple-600 flex items-center mt-1 font-body">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +3.7% from last month
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="luxury-card border-0 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 font-body">
                    Profit Margin
                  </p>
                  <p className="text-2xl font-heading font-bold velvet-text">
                    {reportData?.salesReport.profitMargin}%
                  </p>
                  <p className="text-sm text-orange-600 flex items-center mt-1 font-body">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +1.2% from last month
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full">
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Tabs value={reportType} onValueChange={setReportType}>
          <div className="flex items-center justify-between">
            <TabsList className="luxury-card border-0">
              <TabsTrigger value="overview" className="font-body">
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="countries" className="font-body">
                <Globe className="h-4 w-4 mr-2" />
                Countries
              </TabsTrigger>
              <TabsTrigger value="agents" className="font-body">
                <Users className="h-4 w-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="payments" className="font-body">
                <DollarSign className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport("csv")}
                className="font-body hover:scale-105 transform transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport("excel")}
                className="font-body hover:scale-105 transform transition-all duration-200"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading velvet-text flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Daily Sales Trend
                </CardTitle>
                <CardDescription className="font-body">
                  Revenue and booking trends over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-cream-100/50 to-cream-200/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-foreground/30 mx-auto mb-4 animate-float" />
                    <p className="text-foreground/70 font-body font-medium">
                      Sales Trend Visualization
                    </p>
                    <p className="text-sm text-foreground/50 font-body">
                      Showing {reportData?.salesReport.dailySales.length} days
                      of sales data
                    </p>
                    <Badge className="mt-2 bg-luxury-gold/20 text-luxury-gold border-luxury-gold">
                      Chart Ready for Integration
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries" className="space-y-6">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading velvet-text flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Performing Countries
                </CardTitle>
                <CardDescription className="font-body">
                  Countries ranked by booking volume and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading">Country</TableHead>
                        <TableHead className="font-heading">Bookings</TableHead>
                        <TableHead className="font-heading">Revenue</TableHead>
                        <TableHead className="font-heading">
                          Avg. Price
                        </TableHead>
                        <TableHead className="font-heading">
                          Market Share
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.countryReport.topCountries.map(
                        (country, index) => (
                          <TableRow
                            key={country.country}
                            className="hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent"
                          >
                            <TableCell className="font-medium font-body">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    index === 0
                                      ? "bg-gradient-to-br from-luxury-gold to-luxury-bronze"
                                      : index === 1
                                        ? "bg-gradient-to-br from-gray-400 to-gray-500"
                                        : index === 2
                                          ? "bg-gradient-to-br from-amber-600 to-amber-700"
                                          : "bg-gradient-to-br from-blue-500 to-blue-600"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">
                                    {country.flag}
                                  </span>
                                  <span>{country.country}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-body">
                              {country.bookings}
                            </TableCell>
                            <TableCell className="font-body font-semibold text-green-600">
                              ৳{country.revenue.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-body">
                              ৳
                              {Math.round(
                                country.revenue / country.bookings,
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-body">
                                {(
                                  (country.bookings /
                                    (reportData?.salesReport.totalBookings ||
                                      1)) *
                                  100
                                ).toFixed(1)}
                                %
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="luxury-card border-0">
              <CardHeader>
                <CardTitle className="font-heading velvet-text flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performing Agents
                </CardTitle>
                <CardDescription className="font-body">
                  Travel agents ranked by performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading">Agent</TableHead>
                        <TableHead className="font-heading">Bookings</TableHead>
                        <TableHead className="font-heading">Revenue</TableHead>
                        <TableHead className="font-heading">
                          Avg. Deal Size
                        </TableHead>
                        <TableHead className="font-heading">
                          Performance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.agentReport.topAgents.map((agent, index) => (
                        <TableRow
                          key={agent.agent}
                          className="hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent"
                        >
                          <TableCell className="font-medium font-body">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                              {agent.agent}
                            </div>
                          </TableCell>
                          <TableCell className="font-body">
                            {agent.bookings}
                          </TableCell>
                          <TableCell className="font-body font-semibold text-green-600">
                            ৳{agent.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-body">
                            ৳
                            {Math.round(
                              agent.revenue / agent.bookings,
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`font-body ${
                                index < 2
                                  ? "bg-green-100 text-green-800"
                                  : index < 4
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {index < 2
                                ? "🏆 Excellent"
                                : index < 4
                                  ? "⭐ Good"
                                  : "👍 Average"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="luxury-card border-0">
                <CardHeader>
                  <CardTitle className="font-heading velvet-text flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription className="font-body">
                    Distribution of payment methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData?.paymentReport.paymentMethods.map(
                      (method, index) => (
                        <div
                          key={method.method}
                          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-cream-100/30 to-transparent hover:from-cream-100/50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded ${
                                index === 0
                                  ? "bg-green-500"
                                  : index === 1
                                    ? "bg-blue-500"
                                    : index === 2
                                      ? "bg-purple-500"
                                      : "bg-orange-500"
                              }`}
                            ></div>
                            <span className="font-medium font-body">
                              {method.method}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold font-body">
                              ৳{method.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-foreground/60 font-body">
                              {method.count} transactions
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card border-0">
                <CardHeader>
                  <CardTitle className="font-heading velvet-text flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Payment Status
                  </CardTitle>
                  <CardDescription className="font-body">
                    Overview of payment completion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-100/30 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="font-medium font-body">
                          Completed Payments
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 font-body">
                          {reportData?.paymentReport.completedPayments}
                        </p>
                        <p className="text-sm text-foreground/60 font-body">
                          {(
                            ((reportData?.paymentReport.completedPayments ||
                              0) /
                              ((reportData?.paymentReport.completedPayments ||
                                0) +
                                (reportData?.paymentReport.pendingPayments ||
                                  0))) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-100/30 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="font-medium font-body">
                          Pending Payments
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-600 font-body">
                          {reportData?.paymentReport.pendingPayments}
                        </p>
                        <p className="text-sm text-foreground/60 font-body">
                          {(
                            ((reportData?.paymentReport.pendingPayments || 0) /
                              ((reportData?.paymentReport.completedPayments ||
                                0) +
                                (reportData?.paymentReport.pendingPayments ||
                                  0))) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium font-body">
                          Total Transactions
                        </span>
                        <span className="font-bold font-heading velvet-text">
                          {(reportData?.paymentReport.completedPayments || 0) +
                            (reportData?.paymentReport.pendingPayments || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
