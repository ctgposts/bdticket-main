// User Roles and Authentication
export type UserRole = "admin" | "manager" | "staff";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Ticket and Inventory Management
export type TicketStatus = "available" | "booked" | "locked" | "sold";
export type PaymentType = "full" | "partial";

export interface Country {
  code: string;
  name: string;
  flag: string;
  totalTickets: number;
  availableTickets: number;
}

export interface TicketBatch {
  id: string;
  country: string;
  airline: string;
  flightDate: string;
  flightTime: string;
  buyingPrice: number;
  quantity: number;
  agentName: string;
  agentContact?: string;
  agentAddress?: string;
  remarks?: string;
  documentUrl?: string;
  createdAt: string;
  createdBy: string;
}

export interface Ticket {
  id: string;
  batchId: string;
  status: TicketStatus;
  sellingPrice: number;
  passengerInfo?: PassengerInfo;
  soldBy?: string;
  soldAt?: string;
  lockedUntil?: string;
  bookingId?: string;
}

export interface PassengerInfo {
  name: string;
  passportNo: string;
  phone: string;
  paxCount: 1; // Always 1 passenger per ticket - business rule enforced
  email?: string;
}

export interface Booking {
  id: string;
  ticketId: string;
  agentInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  passengerInfo: PassengerInfo;
  sellingPrice: number;
  paymentType: PaymentType;
  comments?: string;
  createdAt: string;
  createdBy: string;
  confirmedAt?: string;
  expiresAt: string;
}

// Dashboard and Analytics
export interface DashboardStats {
  todaysSales: {
    count: number;
    amount: number;
  };
  totalBookings: number;
  lockedTickets: number;
  totalInventory: number;
  estimatedProfit?: number; // Admin only
}

export interface TicketBuyingSummary {
  todaysTicketsBought: number;
  estimatedProfit: number;
  totalInventory: number;
  unsoldTickets: number;
}

// API Responses
export interface PingResponse {
  message: string;
  timestamp: string;
}

export interface CountriesResponse {
  countries: Country[];
}

export interface TicketsResponse {
  tickets: (Ticket & { batch: TicketBatch })[];
  total: number;
}

export interface BookingResponse {
  booking: Booking;
  success: boolean;
  message: string;
}

export interface TicketBatchResponse {
  batch: TicketBatch;
  ticketsCreated: number;
  success: boolean;
}

// Request types for creating new resources
export interface CreateTicketBatchRequest {
  country: string;
  airline: string;
  flightDate: string;
  flightTime: string;
  buyingPrice: number;
  quantity: number;
  agentName: string;
  agentContact?: string;
  agentAddress?: string;
  remarks?: string;
}

export interface CreateBookingRequest {
  ticketId: string;
  agentInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  passengerInfo: PassengerInfo;
  sellingPrice: number;
  paymentType: PaymentType;
  comments?: string;
}

// Filter and search options
export interface TicketFilters {
  country?: string;
  airline?: string;
  status?: TicketStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProfitReport {
  ticketId: string;
  airline: string;
  flightDate: string;
  buyingPrice: number;
  sellingPrice: number;
  profit: number;
  soldBy: string;
  soldAt: string;
}
