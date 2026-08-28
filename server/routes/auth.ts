import { Router, Request, Response } from "express";
import { UserRepository, ActivityLogRepository } from "../database/models";
import { generateToken, authenticate } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Login schema validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Find user by username
    const user = UserRepository.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Verify password
    if (!UserRepository.verifyPassword(password, user.password_hash!)) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login
    UserRepository.updateLastLogin(user.id);

    // Log activity
    ActivityLogRepository.create({
      user_id: user.id,
      action: "login",
      entity_type: "auth",
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("User-Agent"),
    });

    // Generate JWT token
    const token = generateToken(user);

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

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

// Get current user profile
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    // User is already verified by authenticate middleware
    const user = req.user!;

    res.json({
      success: true,
      message: "User profile retrieved",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Logout endpoint (client-side mainly, but can log activity)
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is mainly client-side
    // But we can log the activity if user info is available

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
