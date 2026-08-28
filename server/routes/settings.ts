import { Router, Request, Response } from "express";
import {
  SystemSettingsRepository,
  ActivityLogRepository,
} from "../database/models";
import {
  authenticate,
  requirePermission,
  hasPermission,
} from "../middleware/auth";
import { z } from "zod";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Add middleware to log all requests to settings routes
router.use((req, res, next) => {
  console.log(`Settings route accessed: ${req.method} ${req.path}`);
  next();
});

// Test endpoint to verify routing works
router.get("/test", (req: Request, res: Response) => {
  console.log("Test endpoint called successfully!");
  res.json({
    success: true,
    message: "Settings route test successful",
    timestamp: new Date().toISOString(),
  });
});

// Schema for updating system settings
const updateSettingsSchema = z.object({
  company_name: z.string().min(1).optional(),
  company_email: z.string().email().optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  default_currency: z.enum(["BDT", "USD", "EUR"]).optional(),
  timezone: z.string().optional(),
  language: z.enum(["en", "bn", "ar"]).optional(),
  auto_backup: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  booking_timeout: z.number().min(1).max(48).optional(),
});

// Get system settings (basic info for all users, full settings for admins)
router.get("/", async (req: Request, res: Response) => {
  try {
    const settingsRecord = SystemSettingsRepository.findAll();

    // Convert Record to array format expected by client
    const settingsArray = Object.entries(settingsRecord).map(([key, value]) => ({
      key,
      value,
    }));

    // Filter settings based on user permissions
    let filteredSettings = settingsArray;

    // If user doesn't have system_settings permission, only return basic company info
    if (!req.user || !hasPermission(req.user.role, "system_settings")) {
      const allowedKeys = [
        "company_name",
        "company_email",
        "company_phone",
        "company_address",
        "default_currency",
        "timezone",
        "language",
      ];
      filteredSettings = settingsArray.filter((setting) =>
        allowedKeys.includes(setting.key),
      );
    }

    res.json({
      success: true,
      message: "System settings retrieved successfully",
      data: { settings: filteredSettings },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get specific setting by key
router.get("/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    // Allow certain settings to be viewed by all authenticated users
    const publicSettings = [
      "company_name",
      "default_currency",
      "timezone",
      "language",
      "booking_timeout",
    ];

    if (!publicSettings.includes(key) && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const value = SystemSettingsRepository.get(key);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    res.json({
      success: true,
      message: "Setting retrieved successfully",
      data: { key, value },
    });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update system settings (admin only)
router.put(
  "/",
  requirePermission("system_settings"),
  async (req: Request, res: Response) => {
    try {
      const updates = updateSettingsSchema.parse(req.body);

      // Convert boolean values to strings for storage
      const settingsToUpdate: Record<string, string> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          settingsToUpdate[key] =
            typeof value === "boolean" ? value.toString() : value.toString();
        }
      }

      // Update settings
      SystemSettingsRepository.setBatch(settingsToUpdate);

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "update_settings",
        entity_type: "system_settings",
        details: JSON.stringify({
          updates: settingsToUpdate,
          updated_by: req.user!.name,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "System settings updated successfully",
      });
    } catch (error) {
      console.error("Update settings error:", error);

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

// Update single setting (admin only)
router.put(
  "/:key",
  requirePermission("system_settings"),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          message: "Value is required",
        });
      }

      // Validate specific settings
      const validSettings = [
        "company_name",
        "company_email",
        "company_phone",
        "company_address",
        "default_currency",
        "timezone",
        "language",
        "auto_backup",
        "email_notifications",
        "sms_notifications",
        "booking_timeout",
      ];

      if (!validSettings.includes(key)) {
        return res.status(400).json({
          success: false,
          message: "Invalid setting key",
        });
      }

      // Convert value to string for storage
      const stringValue =
        typeof value === "boolean" ? value.toString() : value.toString();

      SystemSettingsRepository.set(key, stringValue);

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "update_setting",
        entity_type: "system_settings",
        details: JSON.stringify({
          key,
          old_value: SystemSettingsRepository.get(key),
          new_value: stringValue,
          updated_by: req.user!.name,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Setting updated successfully",
      });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Export data (admin only)
router.get(
  "/export/data",
  requirePermission("system_settings"),
  async (req: Request, res: Response) => {
    try {
      const { format = "json" } = req.query;

      // This is a simplified export - in a real implementation you'd want to
      // export actual data from multiple tables
      const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: req.user!.name,
        version: "1.0",
        data: {
          settings: SystemSettingsRepository.findAll(),
          // Add other data exports here
        },
      };

      if (format === "csv") {
        // Convert to CSV format
        const csv = Object.entries(exportData.data.settings)
          .map(([key, value]) => `${key},${value}`)
          .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bd-ticketpro-export.csv"',
        );
        res.send(`key,value\n${csv}`);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bd-ticketpro-export.json"',
        );
        res.json(exportData);
      }

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "export_data",
        entity_type: "system",
        details: JSON.stringify({
          format,
          exported_by: req.user!.name,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get activity logs (admin only)
router.get(
  "/logs/activity",
  requirePermission("system_settings"),
  async (req: Request, res: Response) => {
    try {
      const { limit = 100, user_id } = req.query;

      let logs;
      if (user_id) {
        logs = ActivityLogRepository.findByUser(
          user_id as string,
          parseInt(limit as string),
        );
      } else {
        logs = ActivityLogRepository.findRecent(parseInt(limit as string));
      }

      res.json({
        success: true,
        message: "Activity logs retrieved successfully",
        data: {
          logs,
          total: logs.length,
        },
      });
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get system information (authenticated users)
router.get(
  "/system-info",
  async (req: Request, res: Response) => {
    console.log("System info route called");
    try {
      console.log("Building system info...");

      // Get system information
      const systemInfo = {
        version: "1.0.0",
        uptime: formatUptime(os.uptime()),
        memory_usage: formatBytes(process.memoryUsage().heapUsed),
        cpu_usage: `${os.loadavg()[0].toFixed(2)}%`,
        disk_usage: await getDiskUsage(),
        active_sessions: 1, // You can implement session tracking
        total_users: 3, // Get from database
        total_bookings: 0, // Get from database
        database_size: await getDatabaseSize(),
        last_backup: getLastBackupTime(),
      };

      console.log("System info built successfully:", systemInfo);

      res.json({
        success: true,
        message: "System information retrieved successfully",
        data: systemInfo,
      });
    } catch (error) {
      console.error("Get system info error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
);

// Create backup (admin only)
router.post(
  "/backup",
  requirePermission("system_settings"),
  async (req: Request, res: Response) => {
    try {
      // Create backup directory if it doesn't exist
      const backupDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupDir, `backup-${timestamp}.db`);

      // Copy the database file
      const dbPath = path.join(process.cwd(), "bd-ticketpro.db");
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupFile);

        // Log activity
        ActivityLogRepository.create({
          user_id: req.user!.id,
          action: "create_backup",
          entity_type: "system",
          entity_id: "backup",
          details: `Database backup created: ${backupFile}`,
          ip_address: req.ip,
          user_agent: req.get("User-Agent") || "",
        });

        res.json({
          success: true,
          message: "Backup created successfully",
          data: {
            backup_file: backupFile,
            timestamp,
            size: fs.statSync(backupFile).size,
          },
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Database file not found",
        });
      }
    } catch (error) {
      console.error("Create backup error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create backup",
      });
    }
  },
);

// Helper functions
function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function formatBytes(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

async function getDiskUsage(): Promise<string> {
  try {
    // Get available disk space (simplified approach)
    // In a real production environment, you'd use a library like 'check-disk-space'
    return "Available"; // Placeholder since getting disk space requires additional dependencies
  } catch {
    return "Unknown";
  }
}

async function getDatabaseSize(): Promise<string> {
  try {
    const dbPath = path.join(process.cwd(), "bd-ticketpro.db");
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      return formatBytes(stats.size);
    }
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

function getLastBackupTime(): string {
  try {
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupDir)) {
      return "Never";
    }

    const files = fs
      .readdirSync(backupDir)
      .filter(
        (file: string) => file.startsWith("backup-") && file.endsWith(".db"),
      )
      .map((file: string) => {
        const filePath = path.join(backupDir, file);
        return {
          file,
          time: fs.statSync(filePath).mtime,
        };
      })
      .sort((a: any, b: any) => b.time - a.time);

    if (files.length > 0) {
      return files[0].time.toLocaleString();
    }
    return "Never";
  } catch {
    return "Unknown";
  }
}

export default router;
