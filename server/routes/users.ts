import { Router, Request, Response } from "express";
import { UserRepository, ActivityLogRepository } from "../database/models";
import { authenticate, requirePermission } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Schema for creating user
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]),
  status: z.enum(["active", "inactive"]).default("active"),
});

// Schema for updating user
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Schema for updating password
const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Get all users (admin only)
router.get(
  "/",
  requirePermission("manage_users"),
  async (req: Request, res: Response) => {
    try {
      const users = UserRepository.findAll();

      // Remove password hashes from response
      const safeUsers = users.map((user) => {
        const { password_hash, ...safeUser } = user;
        return safeUser;
      });

      res.json({
        success: true,
        message: "Users retrieved successfully",
        data: { users: safeUsers },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get single user by ID
router.get(
  "/:id",
  requirePermission("manage_users"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove password hash from response
      const { password_hash, ...safeUser } = user;

      res.json({
        success: true,
        message: "User retrieved successfully",
        data: { user: safeUser },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Create new user (admin only)
router.post(
  "/",
  requirePermission("manage_users"),
  async (req: Request, res: Response) => {
    try {
      const userData = createUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = UserRepository.findByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Create the user
      const user = UserRepository.create(userData);

      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "create_user",
        entity_type: "user",
        entity_id: user.id,
        details: JSON.stringify({
          username: userData.username,
          role: userData.role,
          created_by: req.user!.name,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      // Remove password hash from response
      const { password_hash, ...safeUser } = user;

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: { user: safeUser },
      });
    } catch (error) {
      console.error("Create user error:", error);

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

// Update user (admin only)
router.put(
  "/:id",
  requirePermission("manage_users"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = updateUserSchema.parse(req.body);

      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Prevent admin from changing their own role to non-admin
      if (id === req.user!.id && updates.role && updates.role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "Cannot change your own admin role",
        });
      }

      const updatedUser = UserRepository.update(id, updates);

      if (updatedUser) {
        // Log activity
        ActivityLogRepository.create({
          user_id: req.user!.id,
          action: "update_user",
          entity_type: "user",
          entity_id: id,
          details: JSON.stringify({
            updates,
            updated_by: req.user!.name,
          }),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("User-Agent"),
        });

        // Remove password hash from response
        const { password_hash, ...safeUser } = updatedUser;

        res.json({
          success: true,
          message: "User updated successfully",
          data: { user: safeUser },
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update user",
        });
      }
    } catch (error) {
      console.error("Update user error:", error);

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

// Update current user profile
router.put("/profile/me", async (req: Request, res: Response) => {
  try {
    const updates = z
      .object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
      .parse(req.body);

    const updatedUser = UserRepository.update(req.user!.id, updates);

    if (updatedUser) {
      // Remove password hash from response
      const { password_hash, ...safeUser } = updatedUser;

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user: safeUser },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  } catch (error) {
    console.error("Update profile error:", error);

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
});

// Update password
router.put("/profile/password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(
      req.body,
    );

    const user = UserRepository.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    if (!UserRepository.verifyPassword(currentPassword, user.password_hash!)) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    const bcrypt = require("bcryptjs");
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);

    UserRepository.update(req.user!.id, { password_hash: newPasswordHash });

    // Log activity
    ActivityLogRepository.create({
      user_id: req.user!.id,
      action: "update_password",
      entity_type: "user",
      entity_id: req.user!.id,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);

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
});

// Delete user (admin only)
router.delete(
  "/:id",
  requirePermission("manage_users"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (id === req.user!.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      const user = UserRepository.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const success = UserRepository.delete(id);

      if (success) {
        // Log activity
        ActivityLogRepository.create({
          user_id: req.user!.id,
          action: "delete_user",
          entity_type: "user",
          entity_id: id,
          details: JSON.stringify({
            deleted_username: user.username,
            deleted_by: req.user!.name,
          }),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("User-Agent"),
        });

        res.json({
          success: true,
          message: "User deleted successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to delete user",
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
