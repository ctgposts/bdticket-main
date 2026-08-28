// Vercel serverless function handler for BD TicketPro API
let app;

export default async function handler(req, res) {
  try {
    // Add CORS headers for preflight requests
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );
      res.setHeader("Access-Control-Max-Age", "86400");
      return res.status(200).end();
    }

    // Initialize app only once
    if (!app) {
      console.log("Initializing BD TicketPro server...");

      try {
        // Try different import paths for Vercel
        let createServerModule;
        try {
          createServerModule = await import("../dist/server/node-build.mjs");
        } catch (e) {
          console.log("Trying alternative import path...");
          createServerModule = await import("./dist/server/node-build.mjs");
        }

        const { createServer } = createServerModule;
        app = createServer();

        console.log("Server initialized successfully");
      } catch (importError) {
        console.error("Failed to import server:", importError);
        throw new Error("Server initialization failed: " + importError.message);
      }
    }

    // Add request logging
    console.log(
      `${req.method} ${req.url} - User-Agent: ${req.headers["user-agent"]}`,
    );

    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    console.error("Error stack:", error.stack);

    // Ensure headers are set
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    // Return error response
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
      details: error.stack ? error.stack.split("\n").slice(0, 5) : [],
      timestamp: new Date().toISOString(),
    });
  }
}
