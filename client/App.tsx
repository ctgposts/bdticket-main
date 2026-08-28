import "./global.css";

// Handle HMR errors gracefully
if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.warn("HMR Error caught:", err);
  });
}

// Suppress ResizeObserver loop warnings (common and harmless)
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes(
      "ResizeObserver loop completed with undelivered notifications",
    )
  ) {
    // Suppress this specific harmless error
    return;
  }
  originalError.apply(console, args);
};

import { Toaster } from "./components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Context
import { AuthProvider } from "./context/AuthContext";

// Components and Pages
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { NetworkErrorBoundary } from "./components/NetworkErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Countries from "./pages/Countries";
import Tickets from "./pages/Tickets";
import CountryTickets from "./pages/CountryTickets";
import AdminBuying from "./pages/AdminBuying";
import Bookings from "./pages/Bookings";
import UmrahManagement from "./pages/UmrahManagement";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

// Placeholder components for routes not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
      {title}
    </h1>
    <p className="text-gray-600 font-body">
      This page is under development. Continue prompting to build out this
      section.
    </p>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <NetworkErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes with Layout */}
                <Route
                  path="/dashboard"
                  element={
                    <Layout>
                      <Dashboard />
                    </Layout>
                  }
                />

                <Route
                  path="/countries"
                  element={
                    <Layout>
                      <Countries />
                    </Layout>
                  }
                />

                <Route
                  path="/tickets"
                  element={
                    <Layout>
                      <Tickets />
                    </Layout>
                  }
                />

                <Route
                  path="/tickets/:country"
                  element={
                    <Layout>
                      <CountryTickets />
                    </Layout>
                  }
                />

                <Route
                  path="/admin/buying"
                  element={
                    <Layout>
                      <AdminBuying />
                    </Layout>
                  }
                />

                {/* Redirect old URL to new one */}
                <Route
                  path="/admin-buying"
                  element={<Navigate to="/admin/buying" replace />}
                />

                <Route
                  path="/bookings"
                  element={
                    <Layout>
                      <Bookings />
                    </Layout>
                  }
                />

                <Route
                  path="/umrah"
                  element={
                    <Layout>
                      <UmrahManagement />
                    </Layout>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <Layout>
                      <Settings />
                    </Layout>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <Layout>
                      <Reports />
                    </Layout>
                  }
                />

                {/* Root redirect */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </NetworkErrorBoundary>
  </ErrorBoundary>
);

// Fix for React 18 StrictMode double root creation warning
const container = document.getElementById("root")!;
let root = (container as any)._reactRoot;

if (!root) {
  root = createRoot(container);
  (container as any)._reactRoot = root;
}

root.render(<App />);
