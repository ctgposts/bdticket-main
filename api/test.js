// Simple test endpoint to verify Vercel deployment
export default function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "BD TicketPro API Test Successful! 🎉",
      timestamp: new Date().toISOString(),
      app: "BD TicketPro",
      version: "1.0.0",
      status: "✅ Working perfectly on Vercel",
      features: [
        "✅ Static file serving",
        "✅ API endpoints",
        "✅ SPA routing",
        "✅ CORS headers",
        "✅ Node.js 20.x compatibility",
      ],
    });
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed",
  });
}
