import { db } from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// User model
export interface User {
  id: string;
  username: string;
  password_hash?: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "manager" | "staff";
  status: "active" | "inactive";
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  static findById(id: string): User | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
  }

  static findByUsername(username: string): User | undefined {
    return db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as User;
  }

  static findAll(): User[] {
    return db
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all() as User[];
  }

  static create(
    userData: Omit<User, "id" | "created_at" | "updated_at"> & {
      password: string;
    },
  ): User {
    const id = uuidv4();
    const password_hash = bcrypt.hashSync(userData.password, 10);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, email, phone, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userData.username,
      password_hash,
      userData.name,
      userData.email,
      userData.phone,
      userData.role,
      userData.status,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static update(id: string, updates: Partial<User>): User | undefined {
    const now = new Date().toISOString();
    updates.updated_at = now;

    const fields =
      Object.keys(updates)
        .filter((key) => key !== "id")
        .join(" = ?, ") + " = ?";
    const values = Object.values(updates).filter(
      (_, index) => Object.keys(updates)[index] !== "id",
    );

    const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);

    return this.findById(id);
  }

  static updateLastLogin(id: string): void {
    const stmt = db.prepare("UPDATE users SET last_login = ? WHERE id = ?");
    stmt.run(new Date().toISOString(), id);
  }

  static verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Country model
export interface Country {
  code: string;
  name: string;
  flag: string;
  created_at: string;
}

export class CountryRepository {
  static findAll(): Country[] {
    return db
      .prepare("SELECT * FROM countries ORDER BY name")
      .all() as Country[];
  }

  static findByCode(code: string): Country | undefined {
    return db
      .prepare("SELECT * FROM countries WHERE code = ?")
      .get(code) as Country;
  }
}

// Airline model
export interface Airline {
  id: string;
  name: string;
  code?: string;
  created_at: string;
}

export class AirlineRepository {
  static findAll(): Airline[] {
    return db
      .prepare("SELECT * FROM airlines ORDER BY name")
      .all() as Airline[];
  }

  static findById(id: string): Airline | undefined {
    return db.prepare("SELECT * FROM airlines WHERE id = ?").get(id) as Airline;
  }

  static findByName(name: string): Airline | undefined {
    return db
      .prepare("SELECT * FROM airlines WHERE name = ?")
      .get(name) as Airline;
  }
}

// TicketBatch model
export interface TicketBatch {
  id: string;
  country_code: string;
  airline_name: string;
  flight_date: string;
  flight_time: string;
  buying_price: number;
  quantity: number;
  agent_name: string;
  agent_contact?: string;
  agent_address?: string;
  remarks?: string;
  document_url?: string;
  created_by: string;
  created_at: string;
}

export class TicketBatchRepository {
  static findAll(): TicketBatch[] {
    return db
      .prepare("SELECT * FROM ticket_batches ORDER BY created_at DESC")
      .all() as TicketBatch[];
  }

  static findById(id: string): TicketBatch | undefined {
    return db
      .prepare("SELECT * FROM ticket_batches WHERE id = ?")
      .get(id) as TicketBatch;
  }

  static findByCountry(countryCode: string): TicketBatch[] {
    return db
      .prepare(
        "SELECT * FROM ticket_batches WHERE country_code = ? ORDER BY created_at DESC",
      )
      .all(countryCode) as TicketBatch[];
  }

  static create(
    batchData: Omit<TicketBatch, "id" | "created_at">,
  ): TicketBatch {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ticket_batches (id, country_code, airline_name, flight_date, flight_time, buying_price, quantity, agent_name, agent_contact, agent_address, remarks, document_url, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      batchData.country_code,
      batchData.airline_name,
      batchData.flight_date,
      batchData.flight_time,
      batchData.buying_price,
      batchData.quantity,
      batchData.agent_name,
      batchData.agent_contact,
      batchData.agent_address,
      batchData.remarks,
      batchData.document_url,
      batchData.created_by,
      now,
    );

    return this.findById(id)!;
  }

  static getStatsByCountry(): Array<{
    country_code: string;
    total_tickets: number;
    available_tickets: number;
  }> {
    return db
      .prepare(
        `
      SELECT
        tb.country_code,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END) as available_tickets
      FROM ticket_batches tb
      LEFT JOIN tickets t ON tb.id = t.batch_id
      GROUP BY tb.country_code
      HAVING COUNT(t.id) > 0
    `,
      )
      .all() as Array<{
      country_code: string;
      total_tickets: number;
      available_tickets: number;
    }>;
  }
}

// Ticket model
export interface Ticket {
  id: string;
  batch_id: string;
  flight_number: string;
  status: "available" | "booked" | "locked" | "sold";
  selling_price: number;
  aircraft?: string;
  terminal?: string;
  arrival_time?: string;
  duration?: string;
  available_seats: number;
  total_seats: number;
  locked_until?: string;
  sold_by?: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketWithBatch extends Ticket {
  batch: TicketBatch;
  country: Country;
}

export class TicketRepository {
  static findAll(): TicketWithBatch[] {
    return db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      ORDER BY t.created_at DESC
    `,
      )
      .all()
      .map(this.mapTicketWithBatch) as TicketWithBatch[];
  }

  static findById(id: string): TicketWithBatch | undefined {
    const result = db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      WHERE t.id = ?
    `,
      )
      .get(id);

    return result ? this.mapTicketWithBatch(result) : undefined;
  }

  static findByCountry(countryCode: string): TicketWithBatch[] {
    return db
      .prepare(
        `
      SELECT 
        t.*,
        tb.country_code, tb.airline_name, tb.flight_date, tb.flight_time, tb.buying_price, tb.agent_name,
        c.name as country_name, c.flag as country_flag
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      JOIN countries c ON tb.country_code = c.code
      WHERE tb.country_code = ?
      ORDER BY t.created_at DESC
    `,
      )
      .all(countryCode)
      .map(this.mapTicketWithBatch) as TicketWithBatch[];
  }

  static create(
    ticketData: Omit<Ticket, "id" | "created_at" | "updated_at">,
  ): Ticket {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tickets (id, batch_id, flight_number, status, selling_price, aircraft, terminal, arrival_time, duration, available_seats, total_seats, locked_until, sold_by, sold_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      ticketData.batch_id,
      ticketData.flight_number,
      ticketData.status,
      ticketData.selling_price,
      ticketData.aircraft,
      ticketData.terminal,
      ticketData.arrival_time,
      ticketData.duration,
      ticketData.available_seats,
      ticketData.total_seats,
      ticketData.locked_until,
      ticketData.sold_by,
      ticketData.sold_at,
      now,
      now,
    );

    return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
  }

  static updateStatus(
    id: string,
    status: Ticket["status"],
    soldBy?: string,
  ): boolean {
    const now = new Date().toISOString();
    let stmt;

    if (status === "sold" && soldBy) {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, sold_by = ?, sold_at = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, soldBy, now, now, id);
    } else if (status === "locked") {
      const lockedUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(); // 24 hours from now
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = ?, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, lockedUntil, now, id);
    } else {
      stmt = db.prepare(
        "UPDATE tickets SET status = ?, locked_until = NULL, updated_at = ? WHERE id = ?",
      );
      stmt.run(status, now, id);
    }

    return stmt.changes > 0;
  }

  static getDashboardStats() {
    const today = new Date().toISOString().split("T")[0];

    const todaysSales = db
      .prepare(
        `
      SELECT COUNT(*) as count, COALESCE(SUM(selling_price), 0) as amount
      FROM tickets
      WHERE status = 'sold' AND DATE(sold_at) = ?
    `,
      )
      .get(today) as { count: number; amount: number };

    const totalBookings = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'
    `,
      )
      .get() as { count: number };

    // Get all ticket counts by status
    const totalTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets
    `,
      )
      .get() as { count: number };

    const availableTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status = 'available'
    `,
      )
      .get() as { count: number };

    const lockedTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status = 'locked'
    `,
      )
      .get() as { count: number };

    const soldTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status = 'sold'
    `,
      )
      .get() as { count: number };

    const totalInventory = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets WHERE status IN ('available', 'locked')
    `,
      )
      .get() as { count: number };

    // Get total investment from all ticket batches
    const totalInvestment = db
      .prepare(
        `
      SELECT COALESCE(SUM(buying_price * quantity), 0) as investment
      FROM ticket_batches
    `,
      )
      .get() as { investment: number };

    const estimatedProfit = db
      .prepare(
        `
      SELECT COALESCE(SUM(t.selling_price - tb.buying_price), 0) as profit
      FROM tickets t
      JOIN ticket_batches tb ON t.batch_id = tb.id
      WHERE t.status = 'sold'
    `,
      )
      .get() as { profit: number };

    return {
      todaysSales,
      totalBookings: totalBookings.count,
      totalTickets: totalTickets.count,
      availableTickets: availableTickets.count,
      lockedTickets: lockedTickets.count,
      soldTickets: soldTickets.count,
      totalInventory: totalInventory.count,
      totalInvestment: totalInvestment.investment,
      estimatedProfit: estimatedProfit.profit,
    };
  }

  private static mapTicketWithBatch(row: any): TicketWithBatch {
    return {
      id: row.id,
      batch_id: row.batch_id,
      flight_number: row.flight_number,
      status: row.status,
      selling_price: row.selling_price,
      aircraft: row.aircraft,
      terminal: row.terminal,
      arrival_time: row.arrival_time,
      duration: row.duration,
      available_seats: row.available_seats,
      total_seats: row.total_seats,
      locked_until: row.locked_until,
      sold_by: row.sold_by,
      sold_at: row.sold_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      batch: {
        id: row.batch_id,
        country_code: row.country_code,
        airline_name: row.airline_name,
        flight_date: row.flight_date,
        flight_time: row.flight_time,
        buying_price: row.buying_price,
        quantity: 0, // Will be filled if needed
        agent_name: row.agent_name,
        created_by: "",
        created_at: "",
      },
      country: {
        code: row.country_code,
        name: row.country_name,
        flag: row.country_flag,
        created_at: "",
      },
    };
  }
}

// Booking model
export interface Booking {
  id: string;
  ticket_id: string;
  agent_name: string;
  agent_phone?: string;
  agent_email?: string;
  passenger_name: string;
  passenger_passport: string;
  passenger_phone: string;
  passenger_email?: string;
  pax_count: number;
  selling_price: number;
  payment_type: "full" | "partial";
  partial_amount?: number;
  payment_method: string;
  payment_details?: string;
  comments?: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  created_by: string;
  confirmed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export class BookingRepository {
  static findAll(): Booking[] {
    return db
      .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
      .all() as Booking[];
  }

  // Transform booking data for frontend compatibility
  static transformForFrontend(booking: Booking) {
    return {
      ...booking,
      agentInfo: {
        name: booking.agent_name,
        phone: booking.agent_phone,
        email: booking.agent_email,
      },
      passengerInfo: {
        name: booking.passenger_name,
        passportNo: booking.passenger_passport,
        phone: booking.passenger_phone,
        email: booking.passenger_email,
        paxCount: booking.pax_count,
      },
    };
  }

  static findAllForFrontend() {
    const bookings = this.findAll();
    return bookings.map((booking) => this.transformForFrontend(booking));
  }

  static findById(id: string): Booking | undefined {
    return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking;
  }

  static findByUser(userId: string): Booking[] {
    return db
      .prepare(
        "SELECT * FROM bookings WHERE created_by = ? ORDER BY created_at DESC",
      )
      .all(userId) as Booking[];
  }

  static create(
    bookingData: Omit<Booking, "id" | "created_at" | "updated_at">,
  ): Booking {
    const id = uuidv4();
    const now = new Date().toISOString();
    const expiresAt =
      bookingData.payment_type === "partial"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        : undefined;

    const stmt = db.prepare(`
      INSERT INTO bookings (id, ticket_id, agent_name, agent_phone, agent_email, passenger_name, passenger_passport, passenger_phone, passenger_email, pax_count, selling_price, payment_type, partial_amount, payment_method, payment_details, comments, status, created_by, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bookingData.ticket_id,
      bookingData.agent_name,
      bookingData.agent_phone,
      bookingData.agent_email,
      bookingData.passenger_name,
      bookingData.passenger_passport,
      bookingData.passenger_phone,
      bookingData.passenger_email,
      bookingData.pax_count,
      bookingData.selling_price,
      bookingData.payment_type,
      bookingData.partial_amount,
      bookingData.payment_method,
      bookingData.payment_details,
      bookingData.comments,
      bookingData.status,
      bookingData.created_by,
      expiresAt,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static updateStatus(id: string, status: Booking["status"]): boolean {
    console.log("BookingRepository.updateStatus called with:", { id, status });

    // First check if the booking exists and get current status
    const currentBooking = this.findById(id);
    if (!currentBooking) {
      console.log("Booking not found for status update:", id);
      return false;
    }

    console.log("Current booking status:", currentBooking.status);

    // If the status is already the same, consider it successful
    if (currentBooking.status === status) {
      console.log("Status is already set to:", status);
      return true;
    }

    const now = new Date().toISOString();
    let stmt;
    let result;

    try {
      if (status === "confirmed") {
        stmt = db.prepare(
          "UPDATE bookings SET status = ?, confirmed_at = ?, updated_at = ? WHERE id = ?",
        );
        result = stmt.run(status, now, now, id);
        console.log("Confirmed status update result:", result);
      } else {
        stmt = db.prepare(
          "UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?",
        );
        result = stmt.run(status, now, id);
        console.log("Status update result:", result);
      }

      console.log("Changes made:", result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error("Error in BookingRepository.updateStatus:", error);
      throw error;
    }
  }
}

// System Settings model
export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export class SystemSettingsRepository {
  static findAll(): Record<string, string> {
    const settings = db
      .prepare("SELECT key, value FROM system_settings")
      .all() as SystemSetting[];
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  static get(key: string): string | undefined {
    const result = db
      .prepare("SELECT value FROM system_settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return result?.value;
  }

  static set(key: string, value: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, value, now, value, now);
  }

  static setBatch(settings: Record<string, string>): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, value, now, value, now);
      }
    });

    transaction();
  }
}

// Activity Log model
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class ActivityLogRepository {
  static create(logData: Omit<ActivityLog, "id" | "created_at">): ActivityLog {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      logData.user_id,
      logData.action,
      logData.entity_type,
      logData.entity_id,
      logData.details,
      logData.ip_address,
      logData.user_agent,
      now,
    );

    return db
      .prepare("SELECT * FROM activity_logs WHERE id = ?")
      .get(id) as ActivityLog;
  }

  static findByUser(userId: string, limit: number = 50): ActivityLog[] {
    return db
      .prepare(
        "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      )
      .all(userId, limit) as ActivityLog[];
  }

  static findRecent(limit: number = 100): ActivityLog[] {
    return db
      .prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?")
      .all(limit) as ActivityLog[];
  }
}

// Umrah With Transport model
export interface UmrahWithTransport {
  id: string;
  passenger_name: string;
  pnr: string;
  passport_number: string;
  flight_airline_name: string;
  departure_date: string;
  return_date: string;
  approved_by: string;
  reference_agency: string;
  emergency_flight_contact: string;
  passenger_mobile: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class UmrahWithTransportRepository {
  static findAll(): UmrahWithTransport[] {
    return db
      .prepare("SELECT * FROM umrah_with_transport ORDER BY created_at DESC")
      .all() as UmrahWithTransport[];
  }

  static findById(id: string): UmrahWithTransport | undefined {
    return db
      .prepare("SELECT * FROM umrah_with_transport WHERE id = ?")
      .get(id) as UmrahWithTransport;
  }

  static findByPassenger(passengerName: string): UmrahWithTransport[] {
    return db
      .prepare(
        "SELECT * FROM umrah_with_transport WHERE passenger_name LIKE ? ORDER BY created_at DESC",
      )
      .all(`%${passengerName}%`) as UmrahWithTransport[];
  }

  static create(
    packageData: Omit<UmrahWithTransport, "id" | "created_at" | "updated_at">,
  ): UmrahWithTransport {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO umrah_with_transport (
        id, passenger_name, pnr, passport_number, flight_airline_name,
        departure_date, return_date, approved_by, reference_agency,
        emergency_flight_contact, passenger_mobile, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      packageData.passenger_name,
      packageData.pnr,
      packageData.passport_number,
      packageData.flight_airline_name,
      packageData.departure_date,
      packageData.return_date,
      packageData.approved_by,
      packageData.reference_agency,
      packageData.emergency_flight_contact,
      packageData.passenger_mobile,
      packageData.created_by,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    updateData: Partial<
      Omit<UmrahWithTransport, "id" | "created_at" | "updated_at">
    >,
  ): UmrahWithTransport | undefined {
    const now = new Date().toISOString();
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    const stmt = db.prepare(`
      UPDATE umrah_with_transport
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM umrah_with_transport WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static search(searchTerm: string): UmrahWithTransport[] {
    return db
      .prepare(
        `
        SELECT * FROM umrah_with_transport
        WHERE passenger_name LIKE ? OR pnr LIKE ? OR passport_number LIKE ?
        ORDER BY created_at DESC
      `,
      )
      .all(
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
      ) as UmrahWithTransport[];
  }
}

// Umrah Without Transport model
export interface UmrahWithoutTransport {
  id: string;
  flight_departure_date: string;
  return_date: string;
  passenger_name: string;
  passport_number: string;
  entry_recorded_by: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  last_payment_date?: string;
  remarks?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class UmrahWithoutTransportRepository {
  static findAll(): UmrahWithoutTransport[] {
    return db
      .prepare("SELECT * FROM umrah_without_transport ORDER BY created_at DESC")
      .all() as UmrahWithoutTransport[];
  }

  static findById(id: string): UmrahWithoutTransport | undefined {
    return db
      .prepare("SELECT * FROM umrah_without_transport WHERE id = ?")
      .get(id) as UmrahWithoutTransport;
  }

  static findByPassenger(passengerName: string): UmrahWithoutTransport[] {
    return db
      .prepare(
        "SELECT * FROM umrah_without_transport WHERE passenger_name LIKE ? ORDER BY created_at DESC",
      )
      .all(`%${passengerName}%`) as UmrahWithoutTransport[];
  }

  static findPendingPayments(): UmrahWithoutTransport[] {
    return db
      .prepare(
        "SELECT * FROM umrah_without_transport WHERE remaining_amount > 0 ORDER BY created_at DESC",
      )
      .all() as UmrahWithoutTransport[];
  }

  static create(
    packageData: Omit<
      UmrahWithoutTransport,
      "id" | "created_at" | "updated_at"
    >,
  ): UmrahWithoutTransport {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Ensure remaining amount is calculated correctly
    const remainingAmount = packageData.total_amount - packageData.amount_paid;

    const stmt = db.prepare(`
      INSERT INTO umrah_without_transport (
        id, flight_departure_date, return_date, passenger_name, passport_number,
        entry_recorded_by, total_amount, amount_paid, remaining_amount,
        last_payment_date, remarks, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      packageData.flight_departure_date,
      packageData.return_date,
      packageData.passenger_name,
      packageData.passport_number,
      packageData.entry_recorded_by,
      packageData.total_amount,
      packageData.amount_paid,
      remainingAmount,
      packageData.last_payment_date,
      packageData.remarks,
      packageData.created_by,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    updateData: Partial<
      Omit<UmrahWithoutTransport, "id" | "created_at" | "updated_at">
    >,
  ): UmrahWithoutTransport | undefined {
    const now = new Date().toISOString();

    // If total_amount or amount_paid is being updated, recalculate remaining_amount
    if (
      updateData.total_amount !== undefined ||
      updateData.amount_paid !== undefined
    ) {
      const current = this.findById(id);
      if (current) {
        const totalAmount = updateData.total_amount ?? current.total_amount;
        const amountPaid = updateData.amount_paid ?? current.amount_paid;
        updateData.remaining_amount = totalAmount - amountPaid;
      }
    }

    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    const stmt = db.prepare(`
      UPDATE umrah_without_transport
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return this.findById(id);
  }

  static updatePayment(
    id: string,
    amountPaid: number,
    lastPaymentDate?: string,
  ): UmrahWithoutTransport | undefined {
    const current = this.findById(id);
    if (!current) return undefined;

    const newAmountPaid = current.amount_paid + amountPaid;
    const remainingAmount = current.total_amount - newAmountPaid;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE umrah_without_transport
      SET amount_paid = ?, remaining_amount = ?, last_payment_date = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      newAmountPaid,
      remainingAmount,
      lastPaymentDate || now.split("T")[0], // Use current date if not provided
      now,
      id,
    );

    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM umrah_without_transport WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static search(searchTerm: string): UmrahWithoutTransport[] {
    return db
      .prepare(
        `
        SELECT * FROM umrah_without_transport
        WHERE passenger_name LIKE ? OR passport_number LIKE ?
        ORDER BY created_at DESC
      `,
      )
      .all(`%${searchTerm}%`, `%${searchTerm}%`) as UmrahWithoutTransport[];
  }

  static getPaymentSummary(): {
    totalPackages: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    pendingPackages: number;
  } {
    const result = db
      .prepare(
        `
        SELECT
          COUNT(*) as total_packages,
          SUM(total_amount) as total_amount,
          SUM(amount_paid) as total_paid,
          SUM(remaining_amount) as total_remaining,
          SUM(CASE WHEN remaining_amount > 0 THEN 1 ELSE 0 END) as pending_packages
        FROM umrah_without_transport
      `,
      )
      .get() as any;

    return {
      totalPackages: result.total_packages || 0,
      totalAmount: result.total_amount || 0,
      totalPaid: result.total_paid || 0,
      totalRemaining: result.total_remaining || 0,
      pendingPackages: result.pending_packages || 0,
    };
  }
}

// Types for Umrah Group Tickets
export interface UmrahGroupTicket {
  id: string;
  group_name: string;
  package_type: "with-transport" | "without-transport";
  departure_date: string;
  return_date: string;
  ticket_count: number;
  total_cost: number;
  average_cost_per_ticket: number;
  agent_name: string;
  agent_contact?: string;
  purchase_notes?: string;
  // Flight Details
  departure_airline?: string;
  departure_flight_number?: string;
  departure_time?: string;
  departure_route?: string;
  return_airline?: string;
  return_flight_number?: string;
  return_time?: string;
  return_route?: string;
  // System fields
  remaining_tickets?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UmrahGroupBooking {
  id: string;
  group_ticket_id: string;
  passenger_id: string;
  passenger_type: "with-transport" | "without-transport";
  assigned_at: string;
  assigned_by: string;
}

export class UmrahGroupTicketRepository {
  static findAll(): UmrahGroupTicket[] {
    return db
      .prepare(
        "SELECT * FROM umrah_group_tickets ORDER BY departure_date DESC, created_at DESC",
      )
      .all() as UmrahGroupTicket[];
  }

  static findById(id: string): UmrahGroupTicket | undefined {
    return db
      .prepare("SELECT * FROM umrah_group_tickets WHERE id = ?")
      .get(id) as UmrahGroupTicket;
  }

  static findByPackageType(
    packageType: "with-transport" | "without-transport",
  ): UmrahGroupTicket[] {
    return db
      .prepare(
        "SELECT * FROM umrah_group_tickets WHERE package_type = ? ORDER BY departure_date DESC",
      )
      .all(packageType) as UmrahGroupTicket[];
  }

  static findByDateRange(
    startDate: string,
    endDate: string,
  ): UmrahGroupTicket[] {
    return db
      .prepare(
        `
        SELECT * FROM umrah_group_tickets
        WHERE departure_date BETWEEN ? AND ?
        ORDER BY departure_date DESC
      `,
      )
      .all(startDate, endDate) as UmrahGroupTicket[];
  }

  static create(
    ticketData: Omit<UmrahGroupTicket, "id" | "created_at" | "updated_at">,
  ): UmrahGroupTicket {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO umrah_group_tickets (
        id, group_name, package_type, departure_date, return_date,
        ticket_count, total_cost, average_cost_per_ticket, agent_name,
        agent_contact, purchase_notes, departure_airline, departure_flight_number,
        departure_time, departure_route, return_airline, return_flight_number,
        return_time, return_route, remaining_tickets, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      ticketData.group_name,
      ticketData.package_type,
      ticketData.departure_date,
      ticketData.return_date,
      ticketData.ticket_count,
      ticketData.total_cost,
      ticketData.average_cost_per_ticket,
      ticketData.agent_name,
      ticketData.agent_contact || null,
      ticketData.purchase_notes || null,
      ticketData.departure_airline || null,
      ticketData.departure_flight_number || null,
      ticketData.departure_time || null,
      ticketData.departure_route || null,
      ticketData.return_airline || null,
      ticketData.return_flight_number || null,
      ticketData.return_time || null,
      ticketData.return_route || null,
      ticketData.remaining_tickets || ticketData.ticket_count, // Initially, remaining_tickets = ticket_count
      ticketData.created_by,
      now,
      now,
    );

    return this.findById(id)!;
  }

  static update(
    id: string,
    updateData: Partial<
      Omit<UmrahGroupTicket, "id" | "created_at" | "updated_at">
    >,
  ): UmrahGroupTicket | undefined {
    const now = new Date().toISOString();
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    const stmt = db.prepare(`
      UPDATE umrah_group_tickets
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM umrah_group_tickets WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getGroupsByDateRange(
    packageType: "with-transport" | "without-transport",
  ): Array<{
    departure_date: string;
    return_date: string;
    group_count: number;
    total_tickets: number;
    total_cost: number;
    groups: UmrahGroupTicket[];
  }> {
    const groups = this.findByPackageType(packageType);

    const groupedByDates = groups.reduce(
      (acc, group) => {
        const key = `${group.departure_date}_${group.return_date}`;
        if (!acc[key]) {
          acc[key] = {
            departure_date: group.departure_date,
            return_date: group.return_date,
            group_count: 0,
            total_tickets: 0,
            total_cost: 0,
            groups: [],
          };
        }

        acc[key].group_count++;
        acc[key].total_tickets += group.ticket_count;
        acc[key].total_cost += group.total_cost;
        acc[key].groups.push(group);

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(groupedByDates);
  }

  static search(searchTerm: string): UmrahGroupTicket[] {
    return db
      .prepare(
        `
        SELECT * FROM umrah_group_tickets
        WHERE group_name LIKE ? OR agent_name LIKE ?
        ORDER BY departure_date DESC
      `,
      )
      .all(`%${searchTerm}%`, `%${searchTerm}%`) as UmrahGroupTicket[];
  }

  // Update remaining tickets when a booking is assigned
  static updateRemainingTickets(groupTicketId: string): void {
    const assignedCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM umrah_group_bookings WHERE group_ticket_id = ?",
      )
      .get(groupTicketId) as { count: number };

    const groupTicket = this.findById(groupTicketId);
    if (!groupTicket) return;

    const remainingTickets = groupTicket.ticket_count - assignedCount.count;

    db.prepare(
      "UPDATE umrah_group_tickets SET remaining_tickets = ? WHERE id = ?",
    ).run(remainingTickets, groupTicketId);
  }

  // Find available group tickets for auto-assignment
  static findAvailableGroupTickets(
    packageType: "with-transport" | "without-transport",
    departureDate: string,
    returnDate: string,
  ): UmrahGroupTicket[] {
    return db
      .prepare(
        `
        SELECT * FROM umrah_group_tickets
        WHERE package_type = ?
          AND departure_date = ?
          AND return_date = ?
          AND remaining_tickets > 0
        ORDER BY created_at ASC
      `,
      )
      .all(packageType, departureDate, returnDate) as UmrahGroupTicket[];
  }

  // Auto-assign passenger to an available group ticket
  static autoAssignToGroupTicket(
    passengerId: string,
    passengerType: "with-transport" | "without-transport",
    departureDate: string,
    returnDate: string,
    assignedBy: string,
  ): UmrahGroupBooking | null {
    const availableGroups = this.findAvailableGroupTickets(
      passengerType,
      departureDate,
      returnDate,
    );

    if (availableGroups.length === 0) return null;

    // Get the first available group (FIFO)
    const selectedGroup = availableGroups[0];

    // Create the assignment
    const assignment = UmrahGroupBookingRepository.create({
      group_ticket_id: selectedGroup.id,
      passenger_id: passengerId,
      passenger_type: passengerType,
      assigned_by: assignedBy,
    });

    // Update remaining tickets
    this.updateRemainingTickets(selectedGroup.id);

    return assignment;
  }

  // Initialize remaining tickets for all existing group tickets
  static initializeRemainingTickets(): void {
    const allGroupTickets = this.findAll();

    for (const groupTicket of allGroupTickets) {
      this.updateRemainingTickets(groupTicket.id);
    }
  }
}

export class UmrahGroupBookingRepository {
  static findAll(): UmrahGroupBooking[] {
    return db
      .prepare("SELECT * FROM umrah_group_bookings ORDER BY assigned_at DESC")
      .all() as UmrahGroupBooking[];
  }

  static findByGroupTicketId(groupTicketId: string): UmrahGroupBooking[] {
    return db
      .prepare("SELECT * FROM umrah_group_bookings WHERE group_ticket_id = ?")
      .all(groupTicketId) as UmrahGroupBooking[];
  }

  static findByPassengerId(
    passengerId: string,
    passengerType: "with-transport" | "without-transport",
  ): UmrahGroupBooking | undefined {
    return db
      .prepare(
        "SELECT * FROM umrah_group_bookings WHERE passenger_id = ? AND passenger_type = ?",
      )
      .get(passengerId, passengerType) as UmrahGroupBooking;
  }

  static create(
    bookingData: Omit<UmrahGroupBooking, "id" | "assigned_at">,
  ): UmrahGroupBooking {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO umrah_group_bookings (
        id, group_ticket_id, passenger_id, passenger_type, assigned_at, assigned_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bookingData.group_ticket_id,
      bookingData.passenger_id,
      bookingData.passenger_type,
      now,
      bookingData.assigned_by,
    );

    return { ...bookingData, id, assigned_at: now };
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM umrah_group_bookings WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deleteByPassenger(
    passengerId: string,
    passengerType: "with-transport" | "without-transport",
  ): boolean {
    const stmt = db.prepare(
      "DELETE FROM umrah_group_bookings WHERE passenger_id = ? AND passenger_type = ?",
    );
    const result = stmt.run(passengerId, passengerType);
    return result.changes > 0;
  }
}
