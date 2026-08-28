// Comprehensive validation utilities for BD TicketPro
// টিকেট ক্রয় বিক্রয়ের জন্য সম্পূর্ণ বাংলা ভ্যালিডেশন utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FinancialCalculation {
  totalCost: number;
  estimatedSellingPrice: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  profitMargin: string;
  riskLevel: "low" | "medium" | "high";
}

// 🔍 Phone Number Validation for Bangladesh
export const validateBangladeshiPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s-]/g, "");
  const phoneRegex = /^(\+880|880|0)?(1[3-9]\d{8})$/;
  return phoneRegex.test(cleanPhone);
};

// 📧 Email Validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 💳 Passport Number Validation (Bangladesh)
export const validatePassportNumber = (passport: string): boolean => {
  // Bangladesh passport: 2 letters followed by 7 digits
  const passportRegex = /^[A-Z]{2}\d{7}$/;
  return passportRegex.test(passport.toUpperCase());
};

// 💰 Price Validation
export const validatePrice = (
  price: number,
  min: number = 1000,
  max: number = 500000,
): ValidationResult => {
  const errors: string[] = [];

  if (!price || price <= 0) {
    errors.push("মূল্য ০ এর চেয়ে বেশি হতে হবে / Price must be greater than 0");
  } else if (price < min) {
    errors.push(
      `মূল্য কমপক্ষে ৳${min.toLocaleString()} হতে হবে / Price must be at least ৳${min.toLocaleString()}`,
    );
  } else if (price > max) {
    errors.push(
      `মূল্য সর্বোচ্চ ৳${max.toLocaleString()} হতে পারে / Price cannot exceed ৳${max.toLocaleString()}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 📅 Date Validation
export const validateFlightDate = (dateString: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateString) {
    errors.push("ফ্লাইটের তারিখ আবশ্যক / Flight date is required");
    return { isValid: false, errors, warnings };
  }

  const flightDate = new Date(dateString);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 1);

  // Set time to start of day for comparison
  today.setHours(0, 0, 0, 0);
  flightDate.setHours(0, 0, 0, 0);

  if (flightDate < today) {
    errors.push("ভবিষ্যতের তারিখ নির্বাচন করুন / Please select a future date");
  } else if (flightDate > maxDate) {
    errors.push(
      "১ বছরের মধ্যে তারিখ নির্বাচন করুন / Please select date within 1 year",
    );
  }

  // Warning for very close dates
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  if (flightDate <= threeDaysLater) {
    warnings.push(
      "খুব শীঘ্রই ফ্লাইট - তাড়াহুড়ো বিক্রয় প্রয়োজন / Very soon flight - rush sale required",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// 🕒 Time Validation
export const validateFlightTime = (timeString: string): ValidationResult => {
  const errors: string[] = [];

  if (!timeString) {
    errors.push("ফ্লাইটের সময় আবশ্যক / Flight time is required");
  } else {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeString)) {
      errors.push(
        "সঠিক সময় ফরম্যাট ব্যবহার করুন (HH:MM) / Please use correct time format (HH:MM)",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 🎫 Quantity Validation
export const validateTicketQuantity = (
  quantity: number,
  maxQuantity: number = 1000,
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!quantity || quantity <= 0) {
    errors.push(
      "টিকেটের সংখ্যা ০ এর চেয়ে বেশি হতে হবে / Quantity must be greater than 0",
    );
  } else if (quantity > maxQuantity) {
    errors.push(
      `একবারে সর্বোচ্চ ${maxQuantity} টিকেট ক্রয় করা যাবে / Maximum ${maxQuantity} tickets can be purchased at once`,
    );
  }

  if (quantity > 500) {
    warnings.push(
      "বড় পরিমাণের টিকেট - বিক্রয় পরিকল্পনা নিশ্চিত করুন / Large quantity - ensure sales plan",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// 🏢 Agent Information Validation
export const validateAgentInfo = (
  name: string,
  contact: string,
  address?: string,
): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length < 3) {
    errors.push(
      "এজেন্টের নাম কমপক্ষে ৩ অক্ষর হতে হবে / Agent name must be at least 3 characters",
    );
  }

  if (!contact || !validateBangladeshiPhone(contact)) {
    errors.push(
      "সঠিক বাংলাদেশি মোবাইল নম্বর দিন / Please provide valid Bangladeshi mobile number",
    );
  }

  if (address && address.trim().length > 0 && address.trim().length < 10) {
    errors.push(
      "ঠিকানা কমপক্ষে ১০ অক্ষর হতে হবে / Address must be at least 10 characters",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 💰 Financial Calculation and Risk Assessment
export const calculateFinancials = (
  buyingPrice: number,
  quantity: number,
  markupPercentage: number = 20,
): FinancialCalculation => {
  const totalCost = buyingPrice * quantity;
  const estimatedSellingPrice = Math.round(
    buyingPrice * (1 + markupPercentage / 100),
  );
  const estimatedRevenue = estimatedSellingPrice * quantity;
  const estimatedProfit = estimatedRevenue - totalCost;
  const profitMargin =
    totalCost > 0 ? ((estimatedProfit / totalCost) * 100).toFixed(1) : "0";

  // Risk assessment
  let riskLevel: "low" | "medium" | "high" = "low";

  if (totalCost > 5000000 || parseFloat(profitMargin) < 10 || quantity > 500) {
    riskLevel = "high";
  } else if (
    totalCost > 1000000 ||
    parseFloat(profitMargin) < 15 ||
    quantity > 200
  ) {
    riskLevel = "medium";
  }

  return {
    totalCost,
    estimatedSellingPrice,
    estimatedRevenue,
    estimatedProfit,
    profitMargin,
    riskLevel,
  };
};

// ✈️ Passenger Count Validation (1 Passenger = 1 Ticket Rule)
export const validatePassengerCount = (paxCount: number): ValidationResult => {
  const errors: string[] = [];

  if (paxCount !== 1) {
    errors.push(
      `নিয়ম লঙ্ঘন: ১ জন যাত্��ী = ১ টি টিকেট। ${paxCount} জন যাত্রীর জন্য ${paxCount} টি আলাদা টিকেট বুক করুন / Rule violation: 1 Passenger = 1 Ticket. Please book ${paxCount} separate tickets for ${paxCount} passengers`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: { paxCount: 1 }, // Always enforce 1 passenger
  };
};

// 🔄 Booking Status Validation
export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string,
): ValidationResult => {
  const errors: string[] = [];

  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled", "expired"],
    confirmed: ["cancelled"], // Can only cancel confirmed bookings
    cancelled: [], // Cannot change cancelled bookings
    expired: [], // Cannot change expired bookings
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    errors.push(
      `অবৈধ স্ট্যাটাস পরিবর্তন: ${currentStatus} থেকে ${newStatus} এ পরিবর্তন করা যাবে না / Invalid status transition: Cannot change from ${currentStatus} to ${newStatus}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 🎭 Passenger Information Validation
export const validatePassengerInfo = (
  name: string,
  passport: string,
  phone: string,
  email?: string,
): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length < 2) {
    errors.push(
      "যাত্রীর নাম কমপক্ষে ২ অক্ষর হতে হবে / Passenger name must be at least 2 characters",
    );
  }

  if (!passport || !validatePassportNumber(passport)) {
    errors.push(
      "সঠিক পাসপোর্ট নম্বর দিন (যেমন: AB1234567) / Please provide valid passport number (e.g., AB1234567)",
    );
  }

  if (!phone || !validateBangladeshiPhone(phone)) {
    errors.push(
      "সঠিক বাংলাদেশি মোবাইল নম্বর দিন / Please provide valid Bangladeshi mobile number",
    );
  }

  if (email && !validateEmail(email)) {
    errors.push("সঠিক ইমেইল ঠিকানা দিন / Please provide valid email address");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 🎯 Complete Ticket Batch Validation
export const validateTicketBatch = (batchData: {
  country: string;
  airline: string;
  flightDate: string;
  flightTime: string;
  buyingPrice: number;
  quantity: number;
  agentName: string;
  agentContact: string;
  agentAddress?: string;
}): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Required field validation
  if (!batchData.country)
    allErrors.push("দেশ নির্বাচন করা আবশ্যক / Country selection is required");
  if (!batchData.airline)
    allErrors.push(
      "এয়ারলাইন নির্বাচন করা আবশ্যক / Airline selection is required",
    );

  // Date validation
  const dateValidation = validateFlightDate(batchData.flightDate);
  allErrors.push(...dateValidation.errors);
  allWarnings.push(...dateValidation.warnings);

  // Time validation
  const timeValidation = validateFlightTime(batchData.flightTime);
  allErrors.push(...timeValidation.errors);

  // Price validation
  const priceValidation = validatePrice(batchData.buyingPrice);
  allErrors.push(...priceValidation.errors);

  // Quantity validation
  const quantityValidation = validateTicketQuantity(batchData.quantity);
  allErrors.push(...quantityValidation.errors);
  allWarnings.push(...quantityValidation.warnings);

  // Agent validation
  const agentValidation = validateAgentInfo(
    batchData.agentName,
    batchData.agentContact,
    batchData.agentAddress,
  );
  allErrors.push(...agentValidation.errors);

  // Financial validation
  const totalCost = batchData.buyingPrice * batchData.quantity;
  if (totalCost > 50000000) {
    // 5 crore limit
    allErrors.push(
      "মোট খরচ ৫ কোটি টাকার বেশি হতে পারে না / Total cost cannot exceed ৳5 crore",
    );
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
};

// 📋 Audit Log Generator
export const generateAuditLog = (
  action: string,
  data: any,
  user: any,
): string => {
  const timestamp = new Date().toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "full",
    timeStyle: "medium",
  });

  return `
=== অডিট লগ / AUDIT LOG ===
কার্যক্রম / Action: ${action}
ব্যবহারকারী / User: ${user?.name} (${user?.role})
সময় / Time: ${timestamp}
তথ্য / Data: ${JSON.stringify(data, null, 2)}
=== লগ শেষ / END LOG ===
  `.trim();
};

// 🛡️ Security Validation
export const validateSecurityPermissions = (
  user: any,
  action: string,
): ValidationResult => {
  const errors: string[] = [];

  if (!user) {
    errors.push("ব্যবহারকারী লগইন করা আবশ্যক / User must be logged in");
    return { isValid: false, errors, warnings: [] };
  }

  const permissionMap: Record<string, string[]> = {
    create_batch: ["admin"],
    confirm_booking: ["admin", "manager"],
    cancel_booking: ["admin", "manager"],
    view_reports: ["admin", "manager"],
    manage_settings: ["admin"],
  };

  const requiredRoles = permissionMap[action];
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    errors.push(
      `এই কার্যক্রমের অনুমতি নেই / No permission for this action: ${action}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

// 🔄 Wrapper functions for compatibility
export const validateForm = validateTicketBatch;
export const validateBusinessRules = (
  formData: any,
  existingData: any[] = [],
): ValidationResult => {
  const errors: string[] = [];

  // Check for duplicate flights on same date/time
  const existingFlight = existingData.find(
    (p) =>
      p.country === formData.country &&
      p.airline === formData.airline &&
      p.flightDate === formData.flightDate,
  );

  if (existingFlight) {
    errors.push(
      "একই দিনে, একই এয়��রলাইনের জন্য ইতিমধ্যে টিকেট ক্রয় করা হয়েছে / Tickets already purchased for same airline on this date",
    );
  }

  // Check minimum profit margin (10%)
  const estimatedSellingPrice = formData.buyingPrice * 1.15; // Minimum 15% markup
  if (
    estimatedSellingPrice - formData.buyingPrice <
    formData.buyingPrice * 0.1
  ) {
    errors.push(
      "লাভের মার্জিন কমপক্ষে ১০% রাখুন / Keep minimum 10% profit margin",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

export default {
  validateBangladeshiPhone,
  validateEmail,
  validatePassportNumber,
  validatePrice,
  validateFlightDate,
  validateFlightTime,
  validateTicketQuantity,
  validateAgentInfo,
  calculateFinancials,
  validateStatusTransition,
  validatePassengerInfo,
  validateTicketBatch,
  generateAuditLog,
  validateSecurityPermissions,
  validateForm,
  validateBusinessRules,
};
