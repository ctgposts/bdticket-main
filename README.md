# BD TicketPro - Travel Agency Management System

Complete Travel Agency Management System for Bangladeshi Agencies with International Flight Ticket Management and Umrah Package Management.

## Features

- **Dashboard** - Overview of business metrics and statistics
- **Countries Management** - Manage destination countries and their information
- **Tickets Management** - International flight ticket inventory and pricing
- **Admin Buying** - Administrative ticket purchasing interface
- **Bookings** - Customer booking management and tracking
- **Umrah Management** - Specialized Umrah package and group ticket management
- **Reports** - Business analytics and reporting
- **Settings** - System configuration and user management

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, SQLite
- **Authentication**: JWT-based authentication
- **Database**: Better-SQLite3 for fast local database operations
- **UI Components**: Radix UI, shadcn/ui components
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Development

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Deployment to Vercel

This application is optimized for Vercel deployment:

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Connect your repository to Vercel:

   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will automatically detect the configuration

3. Set environment variables in Vercel dashboard:

   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-here
   ```

4. Deploy!

The `vercel.json` configuration file handles:

- API routes through serverless functions
- Static file serving
- SPA routing
- Security headers
- CORS configuration

## Environment Variables

| Variable       | Description                | Default                |
| -------------- | -------------------------- | ---------------------- |
| `NODE_ENV`     | Environment mode           | `development`          |
| `JWT_SECRET`   | Secret key for JWT tokens  | Required in production |
| `DATABASE_URL` | Database connection string | Uses local SQLite      |

## Project Structure

```
├── api/                 # Vercel API functions
├── client/             # React frontend application
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   └── lib/           # Utility functions
├── server/            # Express.js backend
│   ├── database/      # Database models and schema
│   ├── routes/        # API route handlers
│   └── middleware/    # Custom middleware
├── shared/            # Shared types and utilities
└── public/            # Static assets
```

## License

Private - All rights reserved.
