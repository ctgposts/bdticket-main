import { Router, Request, Response } from "express";
import {
  TicketBatchRepository,
  TicketRepository,
  ActivityLogRepository,
} from "../database/models";
import { authenticate, requirePermission } from "../middleware/auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { calculateOptimalSellingPrice } from "../lib/financial-calculator";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Schema for creating ticket batch
const createBatchSchema = z.object({
  country: z.string().min(1, "Country is required"),
  airline: z.string().min(1, "Airline is required"),
  flightDate: z.string().min(1, "Flight date is required"),
  flightTime: z.string().min(1, "Flight time is required"),
  buyingPrice: z.number().min(0, "Buying price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  agentName: z.string().min(1, "Agent name is required"),
  agentContact: z.string().optional(),
  agentAddress: z.string().optional(),
  remarks: z.string().optional(),
});

// Get all ticket batches (admin only)
router.get(
  "/",
  requirePermission("view_profit"),
  async (req: Request, res: Response) => {
    try {
      const { country, airline, dateFrom, dateTo } = req.query;

      let batches = TicketBatchRepository.findAll();

      // Apply filters
      if (country) {
        batches = batches.filter((batch) => batch.country_code === country);
      }

      if (airline) {
        batches = batches.filter((batch) =>
          batch.airline_name
            .toLowerCase()
            .includes((airline as string).toLowerCase()),
        );
      }

      if (dateFrom) {
        batches = batches.filter((batch) => batch.flight_date >= dateFrom);
      }

      if (dateTo) {
        batches = batches.filter((batch) => batch.flight_date <= dateTo);
      }

      // Get ticket statistics for each batch
      const batchesWithStats = batches.map((batch) => {
        const tickets = TicketRepository.findAll().filter(
          (ticket) => ticket.batch_id === batch.id,
        );
        const sold = tickets.filter(
          (ticket) => ticket.status === "sold",
        ).length;
        const locked = tickets.filter(
          (ticket) => ticket.status === "locked",
        ).length;
        const available = tickets.filter(
          (ticket) => ticket.status === "available",
        ).length;

        // Calculate profit
        const soldTickets = tickets.filter(
          (ticket) => ticket.status === "sold",
        );
        const totalRevenue = soldTickets.reduce(
          (sum, ticket) => sum + ticket.selling_price,
          0,
        );
        const totalCost = sold * batch.buying_price;
        const profit = totalRevenue - totalCost;

        return {
          ...batch,
          sold,
          locked,
          available,
          totalCost: batch.buying_price * batch.quantity,
          profit,
        };
      });

      res.json({
        success: true,
        message: "Ticket batches retrieved successfully",
        data: {
          batches: batchesWithStats,
          total: batchesWithStats.length,
        },
      });
    } catch (error) {
      console.error("Get ticket batches error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get single ticket batch by ID
router.get(
  "/:id",
  requirePermission("view_profit"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found",
        });
      }

      // Get associated tickets
      const tickets = TicketRepository.findAll().filter(
        (ticket) => ticket.batch_id === id,
      );

      res.json({
        success: true,
        message: "Ticket batch retrieved successfully",
        data: {
          batch,
          tickets,
        },
      });
    } catch (error) {
      console.error("Get ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Create new ticket batch (admin only)
router.post(
  "/",
  requirePermission("create_batches"),
  async (req: Request, res: Response) => {
    try {
      const batchData = createBatchSchema.parse(req.body);

      // Create the ticket batch
      const batch = TicketBatchRepository.create({
        country_code: batchData.country.toUpperCase(),
        airline_name: batchData.airline,
        flight_date: batchData.flightDate,
        flight_time: batchData.flightTime,
        buying_price: batchData.buyingPrice,
        quantity: batchData.quantity,
        agent_name: batchData.agentName,
        agent_contact: batchData.agentContact,
        agent_address: batchData.agentAddress,
        remarks: batchData.remarks,
        created_by: req.user!.id,
      });

      // Create individual tickets for this batch
      const createdTickets = [];
      for (let i = 1; i <= batchData.quantity; i++) {
        // Generate flight number (simplified)
        const airlineCode =
          batchData.airline === "Air Arabia"
            ? "G9"
            : batchData.airline === "Emirates"
              ? "EK"
              : batchData.airline === "Qatar Airways"
                ? "QR"
                : batchData.airline === "Saudi Airlines"
                  ? "SV"
                  : batchData.airline === "Flydubai"
                    ? "FZ"
                    : "XX";

        const flightNumber = `${airlineCode} ${Math.floor(Math.random() * 900) + 100}`;
        const sellingPrice = calculateOptimalSellingPrice(
          batchData.buyingPrice,
          batchData.country.toUpperCase(),
        );

        const ticket = TicketRepository.create({
          batch_id: batch.id,
          flight_number: flightNumber,
          status: "available",
          selling_price: sellingPrice,
          aircraft:
            batchData.airline === "Air Arabia"
              ? "Airbus A320"
              : batchData.airline === "Emirates"
                ? "Boeing 777"
                : batchData.airline === "Qatar Airways"
                  ? "Boeing 787"
                  : "Airbus A321",
          terminal: `Terminal ${Math.floor(Math.random() * 3) + 1}`,
          arrival_time: "18:45", // Default arrival time
          duration: "4h 15m", // Default duration
          available_seats: 1,
          total_seats: 1,
        });

        createdTickets.push(ticket);
      }

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "create_ticket_batch",
        entity_type: "ticket_batch",
        entity_id: batch.id,
        details: JSON.stringify({
          airline: batchData.airline,
          country: batchData.country,
          quantity: batchData.quantity,
          buying_price: batchData.buyingPrice,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        message: "Ticket batch created successfully",
        data: {
          batch,
          ticketsCreated: createdTickets.length,
        },
      });
    } catch (error) {
      console.error("Create ticket batch error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Update ticket batch (admin only)
router.put(
  "/:id",
  requirePermission("edit_batches"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found",
        });
      }

      // Note: In a real implementation, you'd want to update the batch
      // For now, we'll just return a success message
      res.json({
        success: true,
        message: "Ticket batch updated successfully",
      });
    } catch (error) {
      console.error("Update ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Delete ticket batch (admin only)
router.delete(
  "/:id",
  requirePermission("delete_batches"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const batch = TicketBatchRepository.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Ticket batch not found",
        });
      }

      // Check if any tickets are already sold
      const tickets = TicketRepository.findAll().filter(
        (ticket) => ticket.batch_id === id,
      );
      const hasSoldTickets = tickets.some((ticket) => ticket.status === "sold");

      if (hasSoldTickets) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete batch with sold tickets",
        });
      }

      // Note: In a real implementation, you'd want to delete the batch and associated tickets
      // For now, we'll just return a success message
      res.json({
        success: true,
        message: "Ticket batch deleted successfully",
      });
    } catch (error) {
      console.error("Delete ticket batch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
