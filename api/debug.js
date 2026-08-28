// Debug endpoint for troubleshooting Vercel deployment
export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const debug = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
      },
      vercel: {
        region: process.env.VERCEL_REGION,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
        url: process.env.VERCEL_URL
      },
      filesystem: {
        cwd: process.cwd(),
        __dirname: __dirname,
        // Check if critical files exist
        files: {
          serverBuild: require('fs').existsSync('./dist/server/node-build.mjs'),
          spaBuild: require('fs').existsSync('./dist/spa/index.html')
        }
      }
    };

    return res.status(200).json(debug);
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed"
  });
}
