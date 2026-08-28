import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plane, Lock, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function Login() {
  const { user, login } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(credentials);

    if (!success) {
      setError("Invalid username or password");
    }

    setIsLoading(false);
  };

  const showDemoCredentials =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === "true";

  const demoCredentials = [
    { role: "Admin", username: "admin", password: "admin123" },
    { role: "Manager", username: "manager", password: "manager123" },
    { role: "Staff", username: "staff", password: "staff123" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-luxury-pearl flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-luxury-gold/20 to-luxury-bronze/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cream-300/30 to-cream-400/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full mb-4 animate-glow"
          >
            <Plane className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold velvet-text mb-2">
            BD TicketPro
          </h1>
          <p className="text-foreground/70 font-body">
            International Flight Ticket Management
          </p>
        </div>

        <Card className="luxury-card border-0 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">
              Welcome Back
            </CardTitle>
            <CardDescription className="font-body">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-body font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        username: e.target.value,
                      })
                    }
                    className="pl-10 font-body"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-body font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    className="pl-10 font-body"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-sm font-body text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full velvet-button text-primary-foreground font-body hover:scale-105 transform transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            {showDemoCredentials && (
              <div className="mt-6 p-4 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg border border-border/50">
                <h3 className="text-sm font-heading font-semibold text-foreground mb-2">
                  Demo Credentials:
                </h3>
                <div className="space-y-1 text-xs font-body text-foreground/70">
                  {demoCredentials.map((cred, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="font-medium">{cred.role}:</span>
                      <span>
                        {cred.username} / {cred.password}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-foreground/60 font-body">
          © 2024 Travel Agency Management System.
        </div>
      </motion.div>
    </div>
  );
}
