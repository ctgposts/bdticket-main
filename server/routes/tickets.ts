import { Router, Request, Response } from "express";
import {
  TicketRepository,
  TicketBatchRepository,
  CountryRepository,
  ActivityLogRepository,
} from "../database/models";
import {
  authenticate,
  requirePermission,
  hasPermission,
} from "../middleware/auth";
import { z } from "zod";
import {
  calculateFinancialSummary,
  calculateTodaysSales,
  getLowStockCountries,
  getTopPerformingCountries,
} from "../lib/financial-calculator";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all tickets
router.get("/", async (req: Request, res: Response) => {
  try {
    const { country, status, airline, limit = 50, offset = 0 } = req.query;

    let tickets = TicketRepository.findAll();

    // Apply filters
    if (country) {
      tickets = tickets.filter(
        (ticket) => ticket.batch.country_code === country,
      );
    }

    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }

    if (airline) {
      tickets = tickets.filter((ticket) =>
        ticket.batch.airline_name
          .toLowerCase()
          .includes((airline as string).toLowerCase()),
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice) {
      paginatedTickets.forEach((ticket) => {
        if (ticket.batch) {
          delete ticket.batch.buying_price;
        }
      });
    }

    res.json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets: paginatedTickets,
        total: tickets.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all tickets from all countries
router.get("/all", async (req: Request, res: Response) => {
  try {
    const { status, airline, limit = 1000, offset = 0 } = req.query;

    let tickets = TicketRepository.findAll();

    // Apply filters
    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }

    if (airline) {
      tickets = tickets.filter((ticket) =>
        ticket.batch.airline_name
          .toLowerCase()
          .includes((airline as string).toLowerCase()),
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    // Get country information for each ticket
    const countries = CountryRepository.findAll();
    const ticketsWithCountryInfo = paginatedTickets.map((ticket) => {
      const country = countries.find(
        (c) => c.code === ticket.batch.country_code,
      );
      return {
        ...ticket,
        country: country
          ? {
              code: country.code,
              name: country.name,
              flag: country.flag,
            }
          : null,
        batch: {
          ...ticket.batch,
          airline: ticket.batch.airline_name,
          flight_date: ticket.batch.departure_date,
          departure_time: ticket.batch.departure_time,
          arrival_time: ticket.batch.arrival_time,
          origin: ticket.batch.origin_city || "Dhaka",
          destination: country?.name || "Unknown",
          flight_number:
            ticket.batch.flight_number ||
            `${ticket.batch.airline_name}-${Math.floor(Math.random() * 1000)}`,
        },
      };
    });

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice) {
      ticketsWithCountryInfo.forEach((ticket) => {
        if (ticket.batch) {
          delete ticket.batch.buying_price;
        }
        delete ticket.buying_price;
      });
    }

    res.json({
      success: true,
      message: "All tickets retrieved successfully",
      data: {
        tickets: ticketsWithCountryInfo,
        total: tickets.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get tickets by country
router.get("/country/:countryCode", async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    const { status, airline } = req.query;

    let tickets = TicketRepository.findByCountry(countryCode.toUpperCase());

    // Apply filters
    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }

    if (airline) {
      tickets = tickets.filter((ticket) =>
        ticket.batch.airline_name
          .toLowerCase()
          .includes((airline as string).toLowerCase()),
      );
    }

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice) {
      tickets.forEach((ticket) => {
        if (ticket.batch) {
          delete ticket.batch.buying_price;
        }
      });
    }

    res.json({
      success: true,
      message: "Country tickets retrieved successfully",
      data: {
        tickets,
        country: countryCode,
        total: tickets.length,
      },
    });
  } catch (error) {
    console.error("Get country tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get single ticket by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice && ticket.batch) {
      delete ticket.batch.buying_price;
    }

    res.json({
      success: true,
      message: "Ticket retrieved successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update ticket status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["available", "booked", "locked", "sold"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Check permissions for certain status changes
    if (status === "sold" && !hasPermission(req.user!.role, "confirm_sales")) {
      return res.status(403).json({
        success: false,
        message: "Permission required to mark tickets as sold",
      });
    }

    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const success = TicketRepository.updateStatus(
      id,
      status,
      status === "sold" ? req.user!.id : undefined,
    );

    if (success) {
      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "update_ticket_status",
        entity_type: "ticket",
        entity_id: id,
        details: JSON.stringify({
          old_status: ticket.status,
          new_status: status,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Ticket status updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update ticket status",
      });
    }
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get countries with ticket counts
router.get("/countries/stats", async (req: Request, res: Response) => {
  try {
    console.log("📊 Countries stats API called");

    const countries = CountryRepository.findAll();
    console.log(`🌍 Found ${countries.length} countries:`, countries);

    const stats = TicketBatchRepository.getStatsByCountry();
    console.log(`📈 Ticket stats:`, stats);

    const countriesWithStats = countries.map((country) => {
      const countryStats = stats.find(
        (stat) => stat.country_code === country.code,
      );
      const result = {
        ...country,
        totalTickets: countryStats?.total_tickets || 0,
        availableTickets: countryStats?.available_tickets || 0,
      };
      console.log(
        `🏁 ${country.name} (${country.code}): ${result.totalTickets} total, ${result.availableTickets} available`,
      );
      if (countryStats) {
        console.log(`   📈 Raw stats for ${country.code}:`, countryStats);
      } else {
        console.log(`   ⚠️  No stats found for ${country.code}`);
      }
      return result;
    });

    // Calculate grand totals for validation
    const grandTotal = countriesWithStats.reduce(
      (sum, c) => sum + c.totalTickets,
      0,
    );
    const grandAvailable = countriesWithStats.reduce(
      (sum, c) => sum + c.availableTickets,
      0,
    );

    console.log(
      `✅ Grand totals: ${grandTotal} total, ${grandAvailable} available`,
    );
    console.log("✅ Sending countries response");

    res.json({
      success: true,
      message: "Countries with statistics retrieved successfully",
      data: {
        countries: countriesWithStats,
        totals: {
          total: grandTotal,
          available: grandAvailable,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get countries stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Dashboard statistics endpoint with accurate financial calculations
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    // Get comprehensive financial summary
    const financialSummary = calculateFinancialSummary();

    // Get today's sales
    const todaysSales = calculateTodaysSales();

    // Get low stock countries
    const lowStockCountries = getLowStockCountries();

    // Get top performing countries
    const topCountries = getTopPerformingCountries(3);

    // Additional real-time metrics
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    const dashboardData = {
      // Core financial metrics
      totalInvestment: financialSummary.totalInvestment,
      totalRevenue: financialSummary.totalRevenue,
      totalProfit: financialSummary.totalProfit,
      profitMargin: financialSummary.profitMargin,
      roi: financialSummary.roi,

      // Inventory metrics
      totalInventory: financialSummary.totalTicketsBought,
      totalSold: financialSummary.totalTicketsSold,
      totalAvailable: financialSummary.totalTicketsAvailable,
      totalBooked: financialSummary.totalTicketsBooked,
      totalLocked: financialSummary.totalTicketsLocked,
      inventoryUtilization: financialSummary.inventoryUtilization,

      // Pricing metrics
      averageBuyingPrice: financialSummary.averageBuyingPrice,
      averageSellingPrice: financialSummary.averageSellingPrice,

      // Today's performance
      todaysSales: {
        amount: todaysSales.amount,
        count: todaysSales.count,
      },

      // Alerts and insights
      lowStockAlerts: lowStockCountries.length,
      lowStockCountries: lowStockCountries,

      // Top performers
      topPerformingCountry: topCountries[0]?.country_code || "N/A",
      topCountries: topCountries,

      // Real-time data
      lastUpdated: currentTime.toISOString(),
      peakHour: `${currentHour}:00`,
      systemStatus: "operational",

      // Business insights
      insights: {
        mostProfitableCountry: topCountries[0]?.country_code || "N/A",
        averageProfitPerTicket: topCountries[0]?.profit_per_ticket || 0,
        inventoryHealthy: lowStockCountries.length === 0,
        profitabilityStatus:
          financialSummary.profitMargin > 20
            ? "excellent"
            : financialSummary.profitMargin > 10
              ? "good"
              : financialSummary.profitMargin > 0
                ? "fair"
                : "poor",
      },
    };

    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: dashboardData,
      timestamp: currentTime.toISOString(),
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Debug endpoint to compare counts
router.get("/debug/counts", async (req: Request, res: Response) => {
  try {
    // Get all tickets from database
    const allTickets = TicketRepository.findAll();
    console.log(`🔍 Debug: Found ${allTickets.length} tickets in database`);

    // Get countries stats
    const stats = TicketBatchRepository.getStatsByCountry();
    console.log(`🔍 Debug: Countries stats:`, stats);

    // Calculate totals from countries stats
    const totalFromStats = stats.reduce(
      (sum, stat) => sum + stat.total_tickets,
      0,
    );
    const availableFromStats = stats.reduce(
      (sum, stat) => sum + stat.available_tickets,
      0,
    );

    // Calculate totals from direct ticket query
    const totalFromTickets = allTickets.length;
    const availableFromTickets = allTickets.filter(
      (t) => t.status === "available",
    ).length;

    const debugInfo = {
      fromStats: {
        total: totalFromStats,
        available: availableFromStats,
        breakdown: stats,
      },
      fromTickets: {
        total: totalFromTickets,
        available: availableFromTickets,
        statusBreakdown: {
          available: allTickets.filter((t) => t.status === "available").length,
          booked: allTickets.filter((t) => t.status === "booked").length,
          locked: allTickets.filter((t) => t.status === "locked").length,
          sold: allTickets.filter((t) => t.status === "sold").length,
        },
      },
      discrepancy: {
        total: totalFromTickets - totalFromStats,
        available: availableFromTickets - availableFromStats,
      },
    };

    console.log("🔍 Debug info:", debugInfo);

    res.json({
      success: true,
      message: "Debug information retrieved",
      data: debugInfo,
    });
  } catch (error) {
    console.error("Debug counts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
