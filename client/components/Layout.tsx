import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plane,
  LayoutDashboard,
  Globe,
  Ticket,
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "./ui/button";
import { NotificationCenter } from "./NotificationCenter";
import { OnlineStatusIndicator } from "./OnlineStatusIndicator";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navigationItems: NavItem[] = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      path: "/countries",
      label: "Countries",
      icon: <Globe className="h-4 w-4" />,
    },
    {
      path: "/tickets",
      label: "Tickets",
      icon: <Ticket className="h-4 w-4" />,
    },
    {
      path: "/bookings",
      label: "Bookings",
      icon: <Package className="h-4 w-4" />,
    },
    {
      path: "/umrah",
      label: "Umrah Management",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      path: "/admin/buying",
      label: "Buy Tickets",
      icon: <ShoppingCart className="h-4 w-4" />,
      permission: "create_batches",
    },
    {
      path: "/reports",
      label: "Reports",
      icon: <BarChart3 className="h-4 w-4" />,
      permission: "view_profit",
    },
    {
      path: "/settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const visibleNavItems = navigationItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const handleLogout = () => {
    logout();
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-body font-medium transition-all duration-300 transform hover:scale-105 ${
          isActive
            ? "velvet-button text-primary-foreground shadow-lg"
            : "text-foreground hover:bg-gradient-to-r hover:from-cream-200 hover:to-cream-300 hover:shadow-md"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-luxury-pearl to-cream-100">
      <OnlineStatusIndicator />
      {/* Top Navigation Bar */}
      <header className="luxury-card shadow-lg border-b border-border/30 backdrop-blur-md bg-gradient-to-r from-card to-cream-100">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-cream-200/50 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-lg animate-glow">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg velvet-text">
                  BD TicketPro
                </h1>
              </div>
            </Link>
          </div>

          {/* User Profile and Actions */}
          <div className="flex items-center space-x-4">
            <NotificationCenter />

            <div className="hidden sm:flex items-center space-x-2 animate-luxury-fade">
              <div className="p-2 bg-gradient-to-br from-cream-200 to-cream-300 rounded-full">
                <User className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-sm text-foreground">
                  {user.name}
                </p>
                <p className="font-body text-xs text-foreground/60 capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200 border-border/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 luxury-card shadow-lg border-r border-border/30 h-[calc(100vh-73px)] backdrop-blur-md">
          <nav className="flex-1 p-4 space-y-2">
            {visibleNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-border/30 bg-gradient-to-r from-cream-100 to-cream-200">
            <div className="flex items-center space-x-3 animate-velvet-slide">
              <div className="p-2 bg-gradient-to-br from-luxury-gold/20 to-luxury-bronze/20 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-body font-medium text-sm text-foreground">
                  {user.name}
                </p>
                <p className="font-body text-xs text-foreground/60 capitalize">
                  {user.role} Account
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 luxury-card h-full shadow-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-lg animate-glow">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="font-heading font-bold text-lg velvet-text">
                    BD TicketPro
                  </h1>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {visibleNavItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </nav>

              <div className="p-4 border-t border-border/30 bg-gradient-to-r from-cream-100 to-cream-200">
                <div className="flex items-center space-x-3 animate-velvet-slide">
                  <div className="p-2 bg-gradient-to-br from-luxury-gold/20 to-luxury-bronze/20 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-sm text-foreground">
                      {user.name}
                    </p>
                    <p className="font-body text-xs text-foreground/60 capitalize">
                      {user.role} Account
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-transparent to-cream-50/30">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
