import { Router } from "express";
import {
  UmrahWithTransportRepository,
  UmrahWithoutTransportRepository,
  UmrahGroupTicketRepository,
  UmrahGroupBookingRepository,
  ActivityLogRepository,
  type UmrahWithTransport,
  type UmrahWithoutTransport,
  type UmrahGroupTicket,
  type UmrahGroupBooking,
} from "../database/models";
import { authenticate, requirePermission } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Validation schemas
const umrahWithTransportSchema = z.object({
  passenger_name: z.string().min(1, "Passenger name is required"),
  pnr: z.string().min(1, "PNR is required"),
  passport_number: z.string().min(1, "Passport number is required"),
  flight_airline_name: z.string().min(1, "Flight/Airline name is required"),
  departure_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  approved_by: z.string().min(1, "Approved by is required"),
  reference_agency: z.string().min(1, "Reference agency is required"),
  emergency_flight_contact: z.string().min(1, "Emergency contact is required"),
  passenger_mobile: z.string().min(1, "Passenger mobile is required"),
  group_ticket_id: z.string().optional(), // For auto-deduction from group tickets
});

const umrahWithoutTransportSchema = z.object({
  flight_departure_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  passenger_name: z.string().min(1, "Passenger name is required"),
  passport_number: z.string().min(1, "Passport number is required"),
  entry_recorded_by: z.string().min(1, "Entry recorded by is required"),
  total_amount: z.number().positive("Total amount must be positive"),
  amount_paid: z.number().min(0, "Amount paid cannot be negative"),
  last_payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  remarks: z.string().optional(),
  group_ticket_id: z.string().optional(), // For auto-deduction from group tickets
});

const paymentUpdateSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
});

const umrahGroupTicketSchema = z.object({
  group_name: z.string().min(1, "Group name is required"),
  package_type: z.literal("with-transport").default("with-transport"), // Only with-transport allowed
  departure_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  ticket_count: z.number().positive("Ticket count must be positive"),
  total_cost: z.number().min(0, "Total cost cannot be negative"),
  agent_name: z.string().min(1, "Agent name is required"),
  agent_contact: z.string().optional(),
  purchase_notes: z.string().optional(),
  // Flight Details
  departure_airline: z.string().optional(),
  departure_flight_number: z.string().optional(),
  departure_time: z.string().optional(),
  departure_route: z.string().optional(),
  return_airline: z.string().optional(),
  return_flight_number: z.string().optional(),
  return_time: z.string().optional(),
  return_route: z.string().optional(),
});

const groupBookingSchema = z.object({
  group_ticket_id: z.string().min(1, "Group ticket ID is required"),
  passenger_id: z.string().min(1, "Passenger ID is required"),
  passenger_type: z.enum(["with-transport", "without-transport"]),
});

// Umrah With Transport routes
router.get("/with-transport", authenticate, (req, res) => {
  try {
    const { search } = req.query;
    let packages: UmrahWithTransport[];

    if (search && typeof search === "string") {
      packages = UmrahWithTransportRepository.search(search);
    } else {
      packages = UmrahWithTransportRepository.findAll();
    }

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching umrah with transport packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
});

router.get("/with-transport/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const umrahPackage = UmrahWithTransportRepository.findById(id);

    if (!umrahPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.json({
      success: true,
      data: umrahPackage,
    });
  } catch (error) {
    console.error("Error fetching umrah with transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
    });
  }
});

router.post("/with-transport", authenticate, (req, res) => {
  try {
    const validatedData = umrahWithTransportSchema.parse(req.body);

    // Validate date logic
    const departureDate = new Date(validatedData.departure_date);
    const returnDate = new Date(validatedData.return_date);

    if (returnDate <= departureDate) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after departure date",
      });
    }

    const umrahPackage = UmrahWithTransportRepository.create({
      ...validatedData,
      created_by: req.user!.id,
    });

    // Handle group ticket assignment and deduction
    let groupAssignment = null;
    try {
      if (validatedData.group_ticket_id) {
        // Manual assignment to specific group ticket
        const groupTicket = UmrahGroupTicketRepository.findById(
          validatedData.group_ticket_id,
        );
        if (!groupTicket) {
          return res.status(400).json({
            success: false,
            message: "Selected group ticket not found",
          });
        }

        if (groupTicket.remaining_tickets <= 0) {
          return res.status(400).json({
            success: false,
            message: "Selected group ticket has no remaining tickets",
          });
        }

        // Create booking assignment
        groupAssignment = UmrahGroupBookingRepository.create({
          group_ticket_id: validatedData.group_ticket_id,
          passenger_id: umrahPackage.id,
          passenger_type: "with-transport",
          assigned_by: req.user!.id,
        });

        // Update remaining tickets count
        UmrahGroupTicketRepository.updateRemainingTickets(
          validatedData.group_ticket_id,
        );
      } else {
        // Auto-assign to available group ticket
        groupAssignment = UmrahGroupTicketRepository.autoAssignToGroupTicket(
          umrahPackage.id,
          "with-transport",
          validatedData.departure_date,
          validatedData.return_date,
          req.user!.id,
        );
      }
    } catch (autoAssignError) {
      console.warn("Group ticket assignment failed:", autoAssignError);
      // Continue with normal flow even if assignment fails
    }

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "CREATE",
      entity_type: "umrah_with_transport",
      entity_id: umrahPackage.id,
      details: JSON.stringify({
        passenger_name: validatedData.passenger_name,
        pnr: validatedData.pnr,
        auto_assigned_to_group: groupAssignment
          ? groupAssignment.group_ticket_id
          : null,
      }),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.status(201).json({
      success: true,
      data: umrahPackage,
      groupAssignment: groupAssignment,
      message: groupAssignment
        ? "Umrah with transport package created and auto-assigned to group ticket"
        : "Umrah with transport package created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error creating umrah with transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create package",
    });
  }
});

router.put("/with-transport/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = umrahWithTransportSchema.partial().parse(req.body);

    const existingPackage = UmrahWithTransportRepository.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Validate date logic if dates are being updated
    if (validatedData.departure_date || validatedData.return_date) {
      const departureDate = new Date(
        validatedData.departure_date || existingPackage.departure_date,
      );
      const returnDate = new Date(
        validatedData.return_date || existingPackage.return_date,
      );

      if (returnDate <= departureDate) {
        return res.status(400).json({
          success: false,
          message: "Return date must be after departure date",
        });
      }
    }

    const updatedPackage = UmrahWithTransportRepository.update(
      id,
      validatedData,
    );

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "UPDATE",
      entity_type: "umrah_with_transport",
      entity_id: id,
      details: JSON.stringify(validatedData),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      data: updatedPackage,
      message: "Package updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error updating umrah with transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update package",
    });
  }
});

router.delete(
  "/with-transport/:id",
  authenticate,
  requirePermission("delete_bookings"),
  (req, res) => {
    try {
      const { id } = req.params;

      const existingPackage = UmrahWithTransportRepository.findById(id);
      if (!existingPackage) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }

      const success = UmrahWithTransportRepository.delete(id);

      if (success) {
        // Log activity
        ActivityLogRepository.create({
          user_id: req.user!.id,
          action: "DELETE",
          entity_type: "umrah_with_transport",
          entity_id: id,
          details: JSON.stringify({
            passenger_name: existingPackage.passenger_name,
            pnr: existingPackage.pnr,
          }),
          ip_address: req.ip,
          user_agent: req.get("User-Agent"),
        });

        res.json({
          success: true,
          message: "Package deleted successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to delete package",
        });
      }
    } catch (error) {
      console.error("Error deleting umrah with transport package:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete package",
      });
    }
  },
);

// Umrah Without Transport routes
router.get("/without-transport", authenticate, (req, res) => {
  try {
    const { search, pending_only } = req.query;
    let packages: UmrahWithoutTransport[];

    if (pending_only === "true") {
      packages = UmrahWithoutTransportRepository.findPendingPayments();
    } else if (search && typeof search === "string") {
      packages = UmrahWithoutTransportRepository.search(search);
    } else {
      packages = UmrahWithoutTransportRepository.findAll();
    }

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching umrah without transport packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
});

router.get("/without-transport/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const umrahPackage = UmrahWithoutTransportRepository.findById(id);

    if (!umrahPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.json({
      success: true,
      data: umrahPackage,
    });
  } catch (error) {
    console.error("Error fetching umrah without transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
    });
  }
});

router.post("/without-transport", authenticate, (req, res) => {
  try {
    const validatedData = umrahWithoutTransportSchema.parse(req.body);

    // Validate date logic
    const departureDate = new Date(validatedData.flight_departure_date);
    const returnDate = new Date(validatedData.return_date);

    if (returnDate <= departureDate) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after departure date",
      });
    }

    // Validate payment logic
    if (validatedData.amount_paid > validatedData.total_amount) {
      return res.status(400).json({
        success: false,
        message: "Amount paid cannot exceed total amount",
      });
    }

    const umrahPackage = UmrahWithoutTransportRepository.create({
      ...validatedData,
      created_by: req.user!.id,
    });

    // Handle group ticket assignment and deduction
    let groupAssignment = null;
    try {
      if (validatedData.group_ticket_id) {
        // Manual assignment to specific group ticket
        const groupTicket = UmrahGroupTicketRepository.findById(
          validatedData.group_ticket_id,
        );
        if (!groupTicket) {
          return res.status(400).json({
            success: false,
            message: "Selected group ticket not found",
          });
        }

        if (groupTicket.remaining_tickets <= 0) {
          return res.status(400).json({
            success: false,
            message: "Selected group ticket has no remaining tickets",
          });
        }

        // Create booking assignment
        groupAssignment = UmrahGroupBookingRepository.create({
          group_ticket_id: validatedData.group_ticket_id,
          passenger_id: umrahPackage.id,
          passenger_type: "without-transport",
          assigned_by: req.user!.id,
        });

        // Update remaining tickets count
        UmrahGroupTicketRepository.updateRemainingTickets(
          validatedData.group_ticket_id,
        );
      } else {
        // Auto-assign to available group ticket
        groupAssignment = UmrahGroupTicketRepository.autoAssignToGroupTicket(
          umrahPackage.id,
          "without-transport",
          validatedData.flight_departure_date,
          validatedData.return_date,
          req.user!.id,
        );
      }
    } catch (autoAssignError) {
      console.warn("Group ticket assignment failed:", autoAssignError);
      // Continue with normal flow even if assignment fails
    }

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "CREATE",
      entity_type: "umrah_without_transport",
      entity_id: umrahPackage.id,
      details: JSON.stringify({
        passenger_name: validatedData.passenger_name,
        total_amount: validatedData.total_amount,
        amount_paid: validatedData.amount_paid,
        auto_assigned_to_group: groupAssignment
          ? groupAssignment.group_ticket_id
          : null,
      }),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.status(201).json({
      success: true,
      data: umrahPackage,
      groupAssignment: groupAssignment,
      message: groupAssignment
        ? "Umrah without transport package created and auto-assigned to group ticket"
        : "Umrah without transport package created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error creating umrah without transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create package",
    });
  }
});

router.put("/without-transport/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = umrahWithoutTransportSchema.partial().parse(req.body);

    const existingPackage = UmrahWithoutTransportRepository.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Validate date logic if dates are being updated
    if (validatedData.flight_departure_date || validatedData.return_date) {
      const departureDate = new Date(
        validatedData.flight_departure_date ||
          existingPackage.flight_departure_date,
      );
      const returnDate = new Date(
        validatedData.return_date || existingPackage.return_date,
      );

      if (returnDate <= departureDate) {
        return res.status(400).json({
          success: false,
          message: "Return date must be after departure date",
        });
      }
    }

    // Validate payment logic if amounts are being updated
    if (
      validatedData.total_amount !== undefined ||
      validatedData.amount_paid !== undefined
    ) {
      const totalAmount =
        validatedData.total_amount ?? existingPackage.total_amount;
      const amountPaid =
        validatedData.amount_paid ?? existingPackage.amount_paid;

      if (amountPaid > totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Amount paid cannot exceed total amount",
        });
      }
    }

    const updatedPackage = UmrahWithoutTransportRepository.update(
      id,
      validatedData,
    );

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "UPDATE",
      entity_type: "umrah_without_transport",
      entity_id: id,
      details: JSON.stringify(validatedData),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      data: updatedPackage,
      message: "Package updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error updating umrah without transport package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update package",
    });
  }
});

router.post("/without-transport/:id/payment", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = paymentUpdateSchema.parse(req.body);

    const existingPackage = UmrahWithoutTransportRepository.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Validate payment amount
    const newTotalPaid = existingPackage.amount_paid + validatedData.amount;
    if (newTotalPaid > existingPackage.total_amount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount exceeds remaining balance",
      });
    }

    const updatedPackage = UmrahWithoutTransportRepository.updatePayment(
      id,
      validatedData.amount,
      validatedData.payment_date,
    );

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "PAYMENT",
      entity_type: "umrah_without_transport",
      entity_id: id,
      details: JSON.stringify({
        payment_amount: validatedData.amount,
        payment_date: validatedData.payment_date,
        new_amount_paid: newTotalPaid,
        remaining_amount: existingPackage.total_amount - newTotalPaid,
      }),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      data: updatedPackage,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  }
});

router.delete(
  "/without-transport/:id",
  authenticate,
  requirePermission("delete_bookings"),
  (req, res) => {
    try {
      const { id } = req.params;

      const existingPackage = UmrahWithoutTransportRepository.findById(id);
      if (!existingPackage) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }

      const success = UmrahWithoutTransportRepository.delete(id);

      if (success) {
        // Log activity
        ActivityLogRepository.create({
          user_id: req.user!.id,
          action: "DELETE",
          entity_type: "umrah_without_transport",
          entity_id: id,
          details: JSON.stringify({
            passenger_name: existingPackage.passenger_name,
            total_amount: existingPackage.total_amount,
          }),
          ip_address: req.ip,
          user_agent: req.get("User-Agent"),
        });

        res.json({
          success: true,
          message: "Package deleted successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to delete package",
        });
      }
    } catch (error) {
      console.error("Error deleting umrah without transport package:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete package",
      });
    }
  },
);

// Summary and statistics
router.get(
  "/payment-summary",
  authenticate,
  requirePermission("view_profit"),
  (req, res) => {
    try {
      const summary = UmrahWithoutTransportRepository.getPaymentSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Error fetching payment summary:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment summary",
      });
    }
  },
);

router.get("/stats", authenticate, (req, res) => {
  try {
    const withTransportPackages = UmrahWithTransportRepository.findAll();
    const withoutTransportPackages = UmrahWithoutTransportRepository.findAll();
    const paymentSummary = UmrahWithoutTransportRepository.getPaymentSummary();

    const stats = {
      total_with_transport: withTransportPackages.length,
      total_without_transport: withoutTransportPackages.length,
      total_packages:
        withTransportPackages.length + withoutTransportPackages.length,
      payment_summary: paymentSummary,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching umrah stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// Umrah Group Ticket Management Routes

// Get all group tickets
router.get("/group-tickets", authenticate, (req, res) => {
  try {
    const { package_type, search } = req.query;
    let groupTickets: UmrahGroupTicket[];

    if (search && typeof search === "string") {
      groupTickets = UmrahGroupTicketRepository.search(search);
    } else if (
      package_type &&
      (package_type === "with-transport" ||
        package_type === "without-transport")
    ) {
      groupTickets = UmrahGroupTicketRepository.findByPackageType(package_type);
    } else {
      groupTickets = UmrahGroupTicketRepository.findAll();
    }

    res.json({
      success: true,
      data: groupTickets,
    });
  } catch (error) {
    console.error("Error fetching group tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group tickets",
    });
  }
});

// Get group tickets grouped by date ranges
router.get("/group-tickets/by-dates/:packageType", authenticate, (req, res) => {
  try {
    const { packageType } = req.params;

    if (packageType !== "with-transport") {
      return res.status(400).json({
        success: false,
        message:
          "Group tickets by dates are only available for with-transport packages",
      });
    }

    const groupedTickets =
      UmrahGroupTicketRepository.getGroupsByDateRange(packageType);

    res.json({
      success: true,
      data: groupedTickets,
    });
  } catch (error) {
    console.error("Error fetching grouped tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch grouped tickets",
    });
  }
});

// Get single group ticket
router.get("/group-tickets/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const groupTicket = UmrahGroupTicketRepository.findById(id);

    if (!groupTicket) {
      return res.status(404).json({
        success: false,
        message: "Group ticket not found",
      });
    }

    // Get assigned passengers
    const assignments = UmrahGroupBookingRepository.findByGroupTicketId(id);

    res.json({
      success: true,
      data: {
        groupTicket,
        assignments,
        assignedCount: assignments.length,
        remainingTickets: groupTicket.ticket_count - assignments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching group ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group ticket",
    });
  }
});

// Create new group ticket purchase
router.post(
  "/group-tickets",
  authenticate,
  requirePermission("manage_umrah"),
  (req, res) => {
    try {
      const validatedData = umrahGroupTicketSchema.parse(req.body);

      // Validate dates
      const departureDate = new Date(validatedData.departure_date);
      const returnDate = new Date(validatedData.return_date);

      if (returnDate <= departureDate) {
        return res.status(400).json({
          success: false,
          message: "Return date must be after departure date",
        });
      }

      // Calculate average cost per ticket
      const averageCostPerTicket =
        validatedData.total_cost / validatedData.ticket_count;

      const groupTicket = UmrahGroupTicketRepository.create({
        ...validatedData,
        average_cost_per_ticket: Math.round(averageCostPerTicket),
        created_by: req.user!.id,
      });

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "CREATE",
        entity_type: "umrah_group_ticket",
        entity_id: groupTicket.id,
        details: JSON.stringify({
          group_name: validatedData.group_name,
          package_type: validatedData.package_type,
          ticket_count: validatedData.ticket_count,
          total_cost: validatedData.total_cost,
        }),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        data: groupTicket,
        message: "Group ticket purchase created successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error creating group ticket:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create group ticket",
      });
    }
  },
);

// Update group ticket
router.put(
  "/group-tickets/:id",
  authenticate,
  requirePermission("manage_umrah"),
  (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = umrahGroupTicketSchema.partial().parse(req.body);

      const existingTicket = UmrahGroupTicketRepository.findById(id);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: "Group ticket not found",
        });
      }

      // Recalculate average if ticket count or total cost changed
      if (validatedData.ticket_count || validatedData.total_cost) {
        const ticketCount =
          validatedData.ticket_count || existingTicket.ticket_count;
        const totalCost = validatedData.total_cost || existingTicket.total_cost;
        validatedData.average_cost_per_ticket = Math.round(
          totalCost / ticketCount,
        );
      }

      const updatedTicket = UmrahGroupTicketRepository.update(
        id,
        validatedData,
      );

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "UPDATE",
        entity_type: "umrah_group_ticket",
        entity_id: id,
        details: JSON.stringify(validatedData),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        data: updatedTicket,
        message: "Group ticket updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error updating group ticket:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update group ticket",
      });
    }
  },
);

// Delete group ticket
router.delete(
  "/group-tickets/:id",
  authenticate,
  requirePermission("manage_umrah"),
  (req, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query; // Get force parameter from query string

      // Check if there are any assignments
      const assignments = UmrahGroupBookingRepository.findByGroupTicketId(id);
      if (assignments.length > 0 && !force) {
        // Get passenger details for better error message
        const passengerDetails = assignments.map((assignment) => {
          if (assignment.passenger_type === "with-transport") {
            const passenger = UmrahWithTransportRepository.findById(
              assignment.passenger_id,
            );
            return {
              type: "with-transport",
              name: passenger?.passenger_name || "Unknown",
              pnr: passenger?.pnr || "N/A",
            };
          } else {
            const passenger = UmrahWithoutTransportRepository.findById(
              assignment.passenger_id,
            );
            return {
              type: "without-transport",
              name: passenger?.passenger_name || "Unknown",
              passport: passenger?.passport_number || "N/A",
            };
          }
        });

        return res.status(400).json({
          success: false,
          message: "Cannot delete group ticket with assigned passengers",
          canForceDelete: true, // Indicate that force delete is possible
          details: {
            assignedCount: assignments.length,
            passengers: passengerDetails,
          },
        });
      }

      // If force delete, remove all assignments first
      if (force && assignments.length > 0) {
        // Delete all group bookings for this ticket
        for (const assignment of assignments) {
          UmrahGroupBookingRepository.deleteByPassenger(
            assignment.passenger_id,
            assignment.passenger_type,
          );
        }
      }

      const deleted = UmrahGroupTicketRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Group ticket not found",
        });
      }

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "DELETE",
        entity_type: "umrah_group_ticket",
        entity_id: id,
        details: JSON.stringify({ deleted: true }),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Group ticket deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting group ticket:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete group ticket",
      });
    }
  },
);

// Assign passenger to group ticket
router.post(
  "/group-bookings",
  authenticate,
  requirePermission("manage_umrah"),
  (req, res) => {
    try {
      const validatedData = groupBookingSchema.parse(req.body);

      // Check if group ticket exists and has available slots
      const groupTicket = UmrahGroupTicketRepository.findById(
        validatedData.group_ticket_id,
      );
      if (!groupTicket) {
        return res.status(404).json({
          success: false,
          message: "Group ticket not found",
        });
      }

      // Check if passenger is already assigned to a group
      const existingAssignment = UmrahGroupBookingRepository.findByPassengerId(
        validatedData.passenger_id,
        validatedData.passenger_type,
      );
      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: "Passenger is already assigned to a group",
        });
      }

      // Check available slots
      const currentAssignments =
        UmrahGroupBookingRepository.findByGroupTicketId(
          validatedData.group_ticket_id,
        );
      if (currentAssignments.length >= groupTicket.ticket_count) {
        return res.status(400).json({
          success: false,
          message: "No available slots in this group",
        });
      }

      // Verify passenger type matches group ticket type
      if (validatedData.passenger_type !== groupTicket.package_type) {
        return res.status(400).json({
          success: false,
          message: "Passenger type must match group ticket package type",
        });
      }

      const assignment = UmrahGroupBookingRepository.create({
        ...validatedData,
        assigned_by: req.user!.id,
      });

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "CREATE",
        entity_type: "umrah_group_booking",
        entity_id: assignment.id,
        details: JSON.stringify({
          group_ticket_id: validatedData.group_ticket_id,
          passenger_id: validatedData.passenger_id,
          passenger_type: validatedData.passenger_type,
        }),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: "Passenger assigned to group successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      console.error("Error creating group booking:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign passenger to group",
      });
    }
  },
);

// Remove passenger from group
router.delete(
  "/group-bookings/:id",
  authenticate,
  requirePermission("manage_umrah"),
  (req, res) => {
    try {
      const { id } = req.params;

      const deleted = UmrahGroupBookingRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Group booking not found",
        });
      }

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "DELETE",
        entity_type: "umrah_group_booking",
        entity_id: id,
        details: JSON.stringify({ deleted: true }),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Passenger removed from group successfully",
      });
    } catch (error) {
      console.error("Error removing group booking:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove passenger from group",
      });
    }
  },
);

// Get available group tickets for auto-assignment
router.get(
  "/group-tickets/available/:packageType/:departureDate/:returnDate",
  authenticate,
  (req, res) => {
    try {
      const { packageType, departureDate, returnDate } = req.params;

      if (packageType !== "with-transport") {
        return res.status(400).json({
          success: false,
          message:
            "Group tickets are only available for with-transport packages",
        });
      }

      const availableGroups =
        UmrahGroupTicketRepository.findAvailableGroupTickets(
          packageType as "with-transport" | "without-transport",
          departureDate,
          returnDate,
        );

      res.json({
        success: true,
        data: availableGroups,
        totalAvailableTickets: availableGroups.reduce(
          (sum, group) => sum + (group.remaining_tickets || 0),
          0,
        ),
      });
    } catch (error) {
      console.error("Error fetching available group tickets:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch available group tickets",
      });
    }
  },
);

// Debug endpoint to check group ticket assignments
router.get("/debug/group-ticket/:id", authenticate, (req, res) => {
  try {
    const { id } = req.params;

    const groupTicket = UmrahGroupTicketRepository.findById(id);
    if (!groupTicket) {
      return res.status(404).json({
        success: false,
        message: "Group ticket not found",
      });
    }

    const assignments = UmrahGroupBookingRepository.findByGroupTicketId(id);

    res.json({
      success: true,
      data: {
        groupTicket,
        assignments,
        calculatedRemaining: groupTicket.ticket_count - assignments.length,
        currentRemaining: groupTicket.remaining_tickets,
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Debug endpoint failed",
    });
  }
});

export default router;
