import Database from "better-sqlite3";
import { join } from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const dbPath = join(process.cwd(), "bd-ticketpro.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Seed only essential data (no dummy tickets)
export function seedEssentialData() {
  try {
    // Check if data already exists
    const userCount = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    if (userCount.count > 0) {
      console.log("Database already seeded");
      return;
    }

    // Insert countries
    const insertCountry = db.prepare(`
      INSERT INTO countries (code, name, flag) VALUES (?, ?, ?)
    `);

    const countries = [
      ["KSA", "Saudi Arabia", "🇸🇦"],
      ["UAE", "United Arab Emirates", "🇦🇪"],
      ["QAT", "Qatar", "🇶🇦"],
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

    // Create default users
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, email, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultUsers = [
      {
        id: uuidv4(),
        username: "admin",
        password: "admin123",
        name: "System Administrator",
        email: "admin@bdticketpro.com",
        phone: "+880-123-456-7890",
        role: "admin",
      },
      {
        id: uuidv4(),
        username: "manager",
        password: "manager123",
        name: "Operations Manager",
        email: "manager@bdticketpro.com",
        phone: "+880-123-456-7891",
        role: "manager",
      },
      {
        id: uuidv4(),
        username: "staff",
        password: "staff123",
        name: "Staff Member",
        email: "staff@bdticketpro.com",
        phone: "+880-123-456-7892",
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

    console.log("✅ Essential data seeded successfully!");
    console.log(
      "💡 No dummy tickets created - system ready for real ticket data",
    );
    console.log("📊 Seeded:");
    console.log("   - 8 Countries");
    console.log("   - 8 Airlines");
    console.log("   - 3 Users (admin/manager/staff)");
    console.log("   - System settings");
    console.log("   - 0 Tickets (ready for real data)");
  } catch (error) {
    console.error("Error seeding essential data:", error);
    throw error;
  }
}
