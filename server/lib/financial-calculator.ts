// Financial Calculator for BD TicketPro
// Comprehensive system for accurate calculations across Buy Tickets, Dashboard, and Bookings

import { db } from "../database/schema";

export interface TicketBatch {
  id: string;
  country_code: string;
  airline_name: string;
  flight_date: string;
  buying_price: number;
  quantity: number;
  agent_name: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  batch_id: string;
  flight_number: string;
  status: "available" | "booked" | "locked" | "sold";
  selling_price: number;
  sold_by?: string;
  sold_at?: string;
}

export interface Booking {
  id: string;
  ticket_id: string;
  selling_price: number;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  created_at: string;
  confirmed_at?: string;
}

export interface FinancialSummary {
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  totalTicketsBought: number;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  totalTicketsBooked: number;
  totalTicketsLocked: number;
  profitMargin: number;
  inventoryUtilization: number;
  averageBuyingPrice: number;
  averageSellingPrice: number;
  roi: number;
}

export interface CountryFinancials {
  [countryCode: string]: {
    totalInvestment: number;
    totalRevenue: number;
    totalProfit: number;
    ticketsBought: number;
    ticketsSold: number;
    ticketsAvailable: number;
    averageBuyingPrice: number;
    averageSellingPrice: number;
  };
}

/**
 * Calculate comprehensive financial summary
 */
export function calculateFinancialSummary(): FinancialSummary {
  // Get all ticket batches (buying data)
  const batches = db
    .prepare(
      `
    SELECT * FROM ticket_batches ORDER BY created_at DESC
  `,
    )
    .all() as TicketBatch[];

  // Get all tickets with their batch info
  const tickets = db
    .prepare(
      `
    SELECT 
      t.*,
      tb.buying_price as batch_buying_price,
      tb.country_code,
      tb.airline_name
    FROM tickets t
    JOIN ticket_batches tb ON t.batch_id = tb.id
  `,
    )
    .all() as (Ticket & {
    batch_buying_price: number;
    country_code: string;
    airline_name: string;
  })[];

  // Get all confirmed bookings (actual sales)
  const confirmedBookings = db
    .prepare(
      `
    SELECT 
      b.*,
      t.selling_price as ticket_selling_price,
      tb.buying_price as batch_buying_price
    FROM bookings b
    JOIN tickets t ON b.ticket_id = t.id
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE b.status = 'confirmed'
  `,
    )
    .all() as (Booking & {
    ticket_selling_price: number;
    batch_buying_price: number;
  })[];

  // Calculate total investment (all tickets bought)
  const totalInvestment = batches.reduce((sum, batch) => {
    return sum + batch.buying_price * batch.quantity;
  }, 0);

  // Calculate total revenue (from confirmed bookings only)
  const totalRevenue = confirmedBookings.reduce((sum, booking) => {
    return sum + booking.selling_price;
  }, 0);

  // Calculate total profit (revenue - cost of sold tickets)
  const totalProfit = confirmedBookings.reduce((sum, booking) => {
    return sum + (booking.selling_price - booking.batch_buying_price);
  }, 0);

  // Count tickets by status
  const ticketCounts = tickets.reduce(
    (counts, ticket) => {
      counts[ticket.status] = (counts[ticket.status] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  const totalTicketsBought = batches.reduce(
    (sum, batch) => sum + batch.quantity,
    0,
  );
  const totalTicketsSold = ticketCounts.sold || 0;
  const totalTicketsAvailable = ticketCounts.available || 0;
  const totalTicketsBooked = ticketCounts.booked || 0;
  const totalTicketsLocked = ticketCounts.locked || 0;

  // Calculate metrics
  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const inventoryUtilization =
    totalTicketsBought > 0 ? (totalTicketsSold / totalTicketsBought) * 100 : 0;
  const averageBuyingPrice =
    totalTicketsBought > 0 ? totalInvestment / totalTicketsBought : 0;
  const averageSellingPrice =
    totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return {
    totalInvestment: Math.round(totalInvestment),
    totalRevenue: Math.round(totalRevenue),
    totalProfit: Math.round(totalProfit),
    totalTicketsBought,
    totalTicketsSold,
    totalTicketsAvailable,
    totalTicketsBooked,
    totalTicketsLocked,
    profitMargin: Math.round(profitMargin * 100) / 100,
    inventoryUtilization: Math.round(inventoryUtilization * 100) / 100,
    averageBuyingPrice: Math.round(averageBuyingPrice),
    averageSellingPrice: Math.round(averageSellingPrice),
    roi: Math.round(roi * 100) / 100,
  };
}

/**
 * Calculate financials by country
 */
export function calculateCountryFinancials(): CountryFinancials {
  const result: CountryFinancials = {};

  // Get batches by country
  const batchesByCountry = db
    .prepare(
      `
    SELECT 
      country_code,
      SUM(buying_price * quantity) as total_investment,
      SUM(quantity) as tickets_bought,
      AVG(buying_price) as avg_buying_price
    FROM ticket_batches
    GROUP BY country_code
  `,
    )
    .all() as Array<{
    country_code: string;
    total_investment: number;
    tickets_bought: number;
    avg_buying_price: number;
  }>;

  // Get sales by country
  const salesByCountry = db
    .prepare(
      `
    SELECT 
      tb.country_code,
      COUNT(*) as tickets_sold,
      SUM(b.selling_price) as total_revenue,
      SUM(b.selling_price - tb.buying_price) as total_profit,
      AVG(b.selling_price) as avg_selling_price
    FROM bookings b
    JOIN tickets t ON b.ticket_id = t.id
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE b.status = 'confirmed'
    GROUP BY tb.country_code
  `,
    )
    .all() as Array<{
    country_code: string;
    tickets_sold: number;
    total_revenue: number;
    total_profit: number;
    avg_selling_price: number;
  }>;

  // Get available tickets by country
  const availableByCountry = db
    .prepare(
      `
    SELECT 
      tb.country_code,
      COUNT(*) as tickets_available
    FROM tickets t
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE t.status = 'available'
    GROUP BY tb.country_code
  `,
    )
    .all() as Array<{
    country_code: string;
    tickets_available: number;
  }>;

  // Combine data
  batchesByCountry.forEach((batch) => {
    const sales = salesByCountry.find(
      (s) => s.country_code === batch.country_code,
    );
    const available = availableByCountry.find(
      (a) => a.country_code === batch.country_code,
    );

    result[batch.country_code] = {
      totalInvestment: Math.round(batch.total_investment || 0),
      totalRevenue: Math.round(sales?.total_revenue || 0),
      totalProfit: Math.round(sales?.total_profit || 0),
      ticketsBought: batch.tickets_bought || 0,
      ticketsSold: sales?.tickets_sold || 0,
      ticketsAvailable: available?.tickets_available || 0,
      averageBuyingPrice: Math.round(batch.avg_buying_price || 0),
      averageSellingPrice: Math.round(sales?.avg_selling_price || 0),
    };
  });

  return result;
}

/**
 * Calculate today's sales
 */
export function calculateTodaysSales(): { amount: number; count: number } {
  const today = new Date().toISOString().split("T")[0];

  const todaySales = db
    .prepare(
      `
    SELECT 
      COUNT(*) as count,
      SUM(selling_price) as amount
    FROM bookings
    WHERE status = 'confirmed' 
    AND DATE(confirmed_at) = ?
  `,
    )
    .get(today) as { count: number; amount: number };

  return {
    amount: Math.round(todaySales.amount || 0),
    count: todaySales.count || 0,
  };
}

/**
 * Get low stock countries (< 20% availability)
 */
export function getLowStockCountries(): string[] {
  const countries = db
    .prepare(
      `
    SELECT 
      tb.country_code,
      SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END) as available,
      COUNT(*) as total
    FROM tickets t
    JOIN ticket_batches tb ON t.batch_id = tb.id
    GROUP BY tb.country_code
    HAVING (available * 1.0 / total) < 0.2 AND total > 0
  `,
    )
    .all() as Array<{ country_code: string; available: number; total: number }>;

  return countries.map((c) => c.country_code);
}

/**
 * Calculate profit for a potential sale
 */
export function calculatePotentialProfit(
  ticketId: string,
  sellingPrice: number,
): number {
  const ticketData = db
    .prepare(
      `
    SELECT tb.buying_price
    FROM tickets t
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE t.id = ?
  `,
    )
    .get(ticketId) as { buying_price: number } | undefined;

  if (!ticketData) return 0;

  return Math.round(sellingPrice - ticketData.buying_price);
}

/**
 * Get top performing countries by profit
 */
export function getTopPerformingCountries(limit: number = 5): Array<{
  country_code: string;
  total_profit: number;
  tickets_sold: number;
  profit_per_ticket: number;
}> {
  const countries = db
    .prepare(
      `
    SELECT 
      tb.country_code,
      SUM(b.selling_price - tb.buying_price) as total_profit,
      COUNT(*) as tickets_sold,
      AVG(b.selling_price - tb.buying_price) as profit_per_ticket
    FROM bookings b
    JOIN tickets t ON b.ticket_id = t.id
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE b.status = 'confirmed'
    GROUP BY tb.country_code
    ORDER BY total_profit DESC
    LIMIT ?
  `,
    )
    .all(limit) as Array<{
    country_code: string;
    total_profit: number;
    tickets_sold: number;
    profit_per_ticket: number;
  }>;

  return countries.map((c) => ({
    ...c,
    total_profit: Math.round(c.total_profit),
    profit_per_ticket: Math.round(c.profit_per_ticket),
  }));
}

/**
 * Update ticket selling price when creating tickets
 */
export function calculateOptimalSellingPrice(
  buyingPrice: number,
  countryCode: string,
): number {
  // Get average selling price for this country
  const countryAvg = db
    .prepare(
      `
    SELECT AVG(selling_price) as avg_price
    FROM bookings b
    JOIN tickets t ON b.ticket_id = t.id
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.country_code = ? AND b.status = 'confirmed'
  `,
    )
    .get(countryCode) as { avg_price: number } | undefined;

  // If no historical data, use a standard markup (30%)
  if (!countryAvg?.avg_price) {
    return Math.round(buyingPrice * 1.3);
  }

  // Use historical average, but ensure minimum 20% profit
  const minSellingPrice = Math.round(buyingPrice * 1.2);
  const historicalPrice = Math.round(countryAvg.avg_price);

  return Math.max(minSellingPrice, historicalPrice);
}

/**
 * Validate booking and ensure inventory consistency
 */
export function validateBooking(
  ticketId: string,
  sellingPrice: number,
): {
  valid: boolean;
  error?: string;
  ticketData?: any;
} {
  // Check if ticket exists and is available
  const ticket = db
    .prepare(
      `
    SELECT 
      t.*,
      tb.buying_price,
      tb.country_code,
      tb.airline_name
    FROM tickets t
    JOIN ticket_batches tb ON t.batch_id = tb.id
    WHERE t.id = ?
  `,
    )
    .get(ticketId);

  if (!ticket) {
    return { valid: false, error: "Ticket not found" };
  }

  if (ticket.status !== "available") {
    return {
      valid: false,
      error: `Ticket is ${ticket.status}, not available for booking`,
    };
  }

  if (sellingPrice <= 0) {
    return { valid: false, error: "Selling price must be positive" };
  }

  // Optional: Check if selling price is reasonable (not too low)
  const minPrice = ticket.buying_price * 1.05; // Minimum 5% markup
  if (sellingPrice < minPrice) {
    return {
      valid: false,
      error: `Selling price too low. Minimum recommended: ৳${Math.round(minPrice)}`,
    };
  }

  return { valid: true, ticketData: ticket };
}
