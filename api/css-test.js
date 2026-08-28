// Test endpoint to check CSS loading issues
export default function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Test - BD TicketPro</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .success { 
            color: #4CAF50; 
            font-weight: bold; 
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info { 
            background: rgba(255,255,255,0.2); 
            padding: 15px; 
            border-radius: 5px; 
            margin: 10px 0;
        }
        .btn {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px;
        }
        .btn:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✅ CSS Test Successful!</div>
        <h1>BD TicketPro - Vercel CSS Test</h1>
        
        <div class="info">
            <h3>🎨 Styling Working:</h3>
            <ul>
                <li>✅ Background gradient</li>
                <li>✅ Typography</li>
                <li>✅ Layout and spacing</li>
                <li>✅ CSS animations</li>
            </ul>
        </div>

        <div class="info">
            <h3>🔗 Test Links:</h3>
            <button class="btn" onclick="window.open('/', '_blank')">🏠 Homepage</button>
            <button class="btn" onclick="window.open('/dashboard', '_blank')">📊 Dashboard</button>
            <button class="btn" onclick="window.open('/api/test', '_blank')">🧪 API Test</button>
        </div>

        <div class="info">
            <h3>📋 Debug Info:</h3>
            <p><strong>Current URL:</strong> ${req.headers.host}${req.url}</p>
            <p><strong>User Agent:</strong> ${req.headers["user-agent"]?.slice(0, 100) || "Unknown"}...</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>

        <script>
            console.log('✅ CSS Test page loaded successfully');
            console.log('🔗 Testing main app...');
            
            // Test if main CSS file is accessible
            fetch('/css/index-DO1DSkfU.css')
                .then(response => {
                    if (response.ok) {
                        console.log('✅ Main CSS file accessible');
                        document.body.innerHTML += '<div class="info" style="color: #4CAF50;">✅ Main CSS file is accessible</div>';
                    } else {
                        console.error('❌ Main CSS file not accessible:', response.status);
                        document.body.innerHTML += '<div class="info" style="color: #f44336;">❌ Main CSS file not accessible: ' + response.status + '</div>';
                    }
                })
                .catch(error => {
                    console.error('❌ CSS fetch error:', error);
                    document.body.innerHTML += '<div class="info" style="color: #f44336;">❌ CSS fetch error: ' + error.message + '</div>';
                });
        </script>
    </div>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(testHTML);
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed",
  });
}
