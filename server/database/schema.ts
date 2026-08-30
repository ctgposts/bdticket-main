import Database from "better-sqlite3";
import { join, dirname } from "path";
import { mkdirSync, existsSync, copyFileSync } from "fs";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const resolveDatabasePath = () => {
  const configuredPath = process.env.DB_PATH || process.env.DATABASE_PATH;
  if (configuredPath) {
    return configuredPath;
  }

  if (process.env.NODE_ENV === "production") {
    const fallbackProdPath = "/tmp/bd-ticketpro.db";
    const repoDbPath = join(process.cwd(), "bd-ticketpro.db");
    if (!existsSync(fallbackProdPath) && existsSync(repoDbPath)) {
      mkdirSync(dirname(fallbackProdPath), { recursive: true });
      copyFileSync(repoDbPath, fallbackProdPath);
    }
    return fallbackProdPath;
  }

  return join(process.cwd(), "bd-ticketpro.db");
};

const dbPath = resolveDatabasePath();

mkdirSync(dirname(dbPath), { recursive: true });

export const databasePath = dbPath;
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Migration function to add missing columns to existing tables
function migrateDatabase() {
  try {
    // Check if umrah_group_tickets table exists and add missing columns
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='umrah_group_tickets'"
    ).get();

    if (tableExists) {
      // Get current table schema
      const tableInfo = db.prepare("PRAGMA table_info(umrah_group_tickets)").all();
      const columnNames = tableInfo.map((col: any) => col.name);

      const newColumns = [
        { name: 'departure_airline', type: 'TEXT' },
        { name: 'departure_flight_number', type: 'TEXT' },
        { name: 'departure_time', type: 'TEXT' },
        { name: 'departure_route', type: 'TEXT' },
        { name: 'return_airline', type: 'TEXT' },
        { name: 'return_flight_number', type: 'TEXT' },
        { name: 'return_time', type: 'TEXT' },
        { name: 'return_route', type: 'TEXT' },
        { name: 'remaining_tickets', type: 'INTEGER NOT NULL DEFAULT 0' }
      ];

      // Add missing columns
      for (const column of newColumns) {
        if (!columnNames.includes(column.name)) {
          console.log(`Adding column: ${column.name}`);
          db.exec(`ALTER TABLE umrah_group_tickets ADD COLUMN ${column.name} ${column.type}`);
        }
      }

      // Update remaining_tickets for existing records if needed
      if (!columnNames.includes('remaining_tickets')) {
        db.exec(`
          UPDATE umrah_group_tickets
          SET remaining_tickets = ticket_count
          WHERE remaining_tickets = 0 OR remaining_tickets IS NULL
        `);
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Create tables
export function initializeDatabase() {
  // Run migrations first
  migrateDatabase();
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Countries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Airlines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ticket batches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_batches (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      airline_name TEXT NOT NULL,
      flight_date TEXT NOT NULL,
      flight_time TEXT NOT NULL,
      buying_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      agent_name TEXT NOT NULL,
      agent_contact TEXT,
      agent_address TEXT,
      remarks TEXT,
      document_url TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (country_code) REFERENCES countries(code),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'locked', 'sold')),
      selling_price INTEGER NOT NULL,
      aircraft TEXT,
      terminal TEXT,
      arrival_time TEXT,
      duration TEXT,
      available_seats INTEGER NOT NULL DEFAULT 1,
      total_seats INTEGER NOT NULL DEFAULT 1,
      locked_until TEXT,
      sold_by TEXT,
      sold_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES ticket_batches(id),
      FOREIGN KEY (sold_by) REFERENCES users(id)
    )
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      agent_phone TEXT,
      agent_email TEXT,
      passenger_name TEXT NOT NULL,
      passenger_passport TEXT NOT NULL,
      passenger_phone TEXT NOT NULL,
      passenger_email TEXT,
      pax_count INTEGER NOT NULL DEFAULT 1,
      selling_price INTEGER NOT NULL,
      payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'partial')),
      partial_amount INTEGER,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      payment_details TEXT, -- JSON string for card details, etc.
      comments TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
      created_by TEXT NOT NULL,
      confirmed_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // System settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Activity logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT, -- JSON string
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Umrah with transport packages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS umrah_with_transport (
      id TEXT PRIMARY KEY,
      passenger_name TEXT NOT NULL,
      pnr TEXT NOT NULL,
      passport_number TEXT NOT NULL,
      flight_airline_name TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      approved_by TEXT NOT NULL,
      reference_agency TEXT NOT NULL,
      emergency_flight_contact TEXT NOT NULL,
      passenger_mobile TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Umrah without transport packages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS umrah_without_transport (
      id TEXT PRIMARY KEY,
      flight_departure_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      passport_number TEXT NOT NULL,
      entry_recorded_by TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      amount_paid INTEGER NOT NULL DEFAULT 0,
      remaining_amount INTEGER NOT NULL DEFAULT 0,
      last_payment_date TEXT,
      remarks TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Umrah group ticket purchases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS umrah_group_tickets (
      id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL,
      package_type TEXT NOT NULL CHECK (package_type IN ('with-transport', 'without-transport')),
      departure_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      ticket_count INTEGER NOT NULL DEFAULT 0,
      total_cost INTEGER NOT NULL DEFAULT 0,
      average_cost_per_ticket INTEGER NOT NULL DEFAULT 0,
      agent_name TEXT NOT NULL,
      agent_contact TEXT,
      purchase_notes TEXT,
      -- Flight Details
      departure_airline TEXT,
      departure_flight_number TEXT,
      departure_time TEXT,
      departure_route TEXT,
      return_airline TEXT,
      return_flight_number TEXT,
      return_time TEXT,
      return_route TEXT,
      -- System fields
      remaining_tickets INTEGER NOT NULL DEFAULT 0, -- Calculated field for available tickets
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Umrah group booking assignments table (links individual bookings to group tickets)
  db.exec(`
    CREATE TABLE IF NOT EXISTS umrah_group_bookings (
      id TEXT PRIMARY KEY,
      group_ticket_id TEXT NOT NULL,
      passenger_id TEXT NOT NULL, -- References umrah_with_transport or umrah_without_transport
      passenger_type TEXT NOT NULL CHECK (passenger_type IN ('with-transport', 'without-transport')),
      assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      assigned_by TEXT NOT NULL,
      FOREIGN KEY (group_ticket_id) REFERENCES umrah_group_tickets(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tickets_batch_id ON tickets(batch_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON bookings(created_by);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_umrah_with_transport_passenger_name ON umrah_with_transport(passenger_name);
    CREATE INDEX IF NOT EXISTS idx_umrah_with_transport_passport ON umrah_with_transport(passport_number);
    CREATE INDEX IF NOT EXISTS idx_umrah_with_transport_departure ON umrah_with_transport(departure_date);
    CREATE INDEX IF NOT EXISTS idx_umrah_without_transport_passenger_name ON umrah_without_transport(passenger_name);
    CREATE INDEX IF NOT EXISTS idx_umrah_without_transport_passport ON umrah_without_transport(passport_number);
    CREATE INDEX IF NOT EXISTS idx_umrah_without_transport_departure ON umrah_without_transport(flight_departure_date);
    CREATE INDEX IF NOT EXISTS idx_umrah_without_transport_remaining ON umrah_without_transport(remaining_amount);
    CREATE INDEX IF NOT EXISTS idx_umrah_group_tickets_package_type ON umrah_group_tickets(package_type);
    CREATE INDEX IF NOT EXISTS idx_umrah_group_tickets_departure ON umrah_group_tickets(departure_date);
    CREATE INDEX IF NOT EXISTS idx_umrah_group_tickets_group_name ON umrah_group_tickets(group_name);
    CREATE INDEX IF NOT EXISTS idx_umrah_group_bookings_group_ticket ON umrah_group_bookings(group_ticket_id);
    CREATE INDEX IF NOT EXISTS idx_umrah_group_bookings_passenger ON umrah_group_bookings(passenger_id, passenger_type);
  `);

  console.log("Database schema initialized successfully");
}

// Seed initial data
export function seedDatabase() {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const allowDemoUsers = process.env.ALLOW_DEMO_USERS === "true";

    // Check if data already exists
    const userCount = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    if (userCount.count > 0) {
      console.log("Database already seeded");
      return;
    }

    if (isProduction && !allowDemoUsers) {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        throw new Error(
          "Production deployment requires ADMIN_USERNAME and ADMIN_PASSWORD environment variables.",
        );
      }

      const insertUser = db.prepare(`
        INSERT INTO users (id, username, password_hash, name, email, phone, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const passwordHash = bcrypt.hashSync(adminPassword, 10);
      insertUser.run(
        uuidv4(),
        adminUsername,
        passwordHash,
        "System Administrator",
        process.env.ADMIN_EMAIL || `${adminUsername}@localhost`,
        process.env.ADMIN_PHONE || "",
        "admin",
        "active",
      );

      console.log("Production admin user created using configured or fallback credentials.");
    }

    // Insert default countries
    const insertCountry = db.prepare(`
      INSERT INTO countries (code, name, flag) VALUES (?, ?, ?)
    `);

    const countries = [
      ["KSA", "Saudi Arabia", "🇸🇦"],
      ["UAE", "United Arab Emirates", "🇦🇪"],
      ["QAT", "Qatar", "🇶���"],
      ["KWT", "Kuwait", "🇰🇼"],
      ["OMN", "Oman", "🇴🇲"],
      ["BHR", "Bahrain", "🇧🇭"],
      ["JOR", "Jordan", "🇯🇴"],
      ["LBN", "Lebanon", "🇱🇧"],
    ];

    for (const country of countries) {
      insertCountry.run(...country);
    }

    // Insert default airlines
    const insertAirline = db.prepare(`
      INSERT INTO airlines (id, name, code) VALUES (?, ?, ?)
    `);

    const airlines = [
      [uuidv4(), "Air Arabia", "G9"],
      [uuidv4(), "Emirates", "EK"],
      [uuidv4(), "Qatar Airways", "QR"],
      [uuidv4(), "Saudi Airlines", "SV"],
      [uuidv4(), "Flydubai", "FZ"],
      [uuidv4(), "Kuwait Airways", "KU"],
      [uuidv4(), "Oman Air", "WY"],
      [uuidv4(), "Gulf Air", "GF"],
    ];

    for (const airline of airlines) {
      insertAirline.run(...airline);
    }

    if (!isProduction || allowDemoUsers) {
      // Create default users only in development or when explicitly allowed.
      const insertUser = db.prepare(`
        INSERT INTO users (id, username, password_hash, name, email, phone, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultUsers = [
        {
          id: uuidv4(),
          username: "admin",
          password: "admin123",
          name: "Admin User",
          email: "admin@bdticketpro.com",
          phone: "+8801234567890",
          role: "admin",
        },
        {
          id: uuidv4(),
          username: "manager",
          password: "manager123",
          name: "Manager User",
          email: "manager@bdticketpro.com",
          phone: "+8801234567891",
          role: "manager",
        },
        {
          id: uuidv4(),
          username: "staff",
          password: "staff123",
          name: "Staff User",
          email: "staff@bdticketpro.com",
          phone: "+8801234567892",
          role: "staff",
        },
      ];

      for (const user of defaultUsers) {
        const passwordHash = bcrypt.hashSync(user.password, 10);
        insertUser.run(
          user.id,
          user.username,
          passwordHash,
          user.name,
          user.email,
          user.phone,
          user.role,
          "active",
        );
      }
    }

    // Insert default system settings
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value) VALUES (?, ?)
    `);

    const settings = [
      ["company_name", "BD TicketPro"],
      ["company_email", "info@bdticketpro.com"],
      ["company_phone", "+880-123-456-7890"],
      ["company_address", "Dhanmondi, Dhaka, Bangladesh"],
      ["default_currency", "BDT"],
      ["timezone", "Asia/Dhaka"],
      ["language", "en"],
      ["auto_backup", "true"],
      ["email_notifications", "true"],
      ["sms_notifications", "false"],
      ["booking_timeout", "24"],
    ];

    for (const setting of settings) {
      insertSetting.run(...setting);
    }

    // NOTE: Dummy ticket data creation has been removed
    // The system is now ready for real ticket data to be added
    // through the admin interface or API endpoints

    console.log("✅ Essential data seeded successfully!");
    console.log(
      "💡 Dummy ticket data has been excluded - system ready for real tickets",
    );

    // Note: Demo data creation has been removed
    // The system is now ready for real ticket data to be added through the admin interface

    /*
    // REMOVED: All demo data creation has been disabled
    // The system is now ready for real ticket data entry
    */

    console.log("��� Essential data seeded successfully!");
    console.log("🎯 Database is clean and ready for real ticket data!");
    console.log("💼 You can now:");
    console.log("   - Add real ticket batches through Admin → Buy Tickets");
    console.log("   - Create real bookings through the booking system");
    console.log("   - Start managing real customer data");

    console.log("Database seeded successfully - ready for real ticket data");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Helper function to execute database operations
export function executeTransaction(operations: () => void) {
  const transaction = db.transaction(operations);
  return transaction();
}
