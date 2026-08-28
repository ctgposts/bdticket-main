// Currency and calculation utilities for BD TicketPro
// Ensures accurate monetary calculations and formatting

/**
 * Format currency with proper locale and precision
 */
export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '৳0';
  }

  // Round to 2 decimal places to avoid floating point errors
  const rounded = Math.round(amount * 100) / 100;
  
  return `৳${rounded.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate profit with precision
 */
export function calculateProfit(sellingPrice: number, buyingPrice: number, quantity: number): number {
  if (isNaN(sellingPrice) || isNaN(buyingPrice) || isNaN(quantity)) {
    return 0;
  }
  
  const profit = (sellingPrice - buyingPrice) * quantity;
  return Math.round(profit * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate profit margin as percentage
 */
export function calculateProfitMargin(profit: number, revenue: number): number {
  if (isNaN(profit) || isNaN(revenue) || revenue === 0) {
    return 0;
  }
  
  const margin = (profit / revenue) * 100;
  return Math.round(margin * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate percentage with precision
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return 0;
  }
  
  const percentage = (numerator / denominator) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Safe addition to avoid floating point errors
 */
export function safeAdd(...numbers: number[]): number {
  return numbers.reduce((sum, num) => {
    if (isNaN(num) || !isFinite(num)) return sum;
    return Math.round((sum + num) * 100) / 100;
  }, 0);
}

/**
 * Safe multiplication to avoid floating point errors
 */
export function safeMultiply(a: number, b: number): number {
  if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
    return 0;
  }
  
  return Math.round(a * b * 100) / 100;
}

/**
 * Safe division to avoid floating point errors and division by zero
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return 0;
  }
  
  return Math.round((numerator / denominator) * 100) / 100;
}

/**
 * Format number with proper locale
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (isNaN(num) || !isFinite(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate inventory metrics
 */
export interface InventoryMetrics {
  totalInventory: number;
  totalSold: number;
  totalAvailable: number;
  totalLocked: number;
  utilizationRate: number;
  availabilityRate: number;
}

export function calculateInventoryMetrics(batches: any[]): InventoryMetrics {
  const totals = batches.reduce((acc, batch) => {
    const quantity = batch.quantity || 0;
    const sold = batch.sold_count || batch.sold || 0;
    const locked = batch.locked_count || batch.locked || 0;
    const available = batch.available_count || batch.available || 0;
    
    return {
      totalInventory: acc.totalInventory + quantity,
      totalSold: acc.totalSold + sold,
      totalLocked: acc.totalLocked + locked,
      totalAvailable: acc.totalAvailable + available,
    };
  }, {
    totalInventory: 0,
    totalSold: 0,
    totalLocked: 0,
    totalAvailable: 0,
  });
  
  return {
    ...totals,
    utilizationRate: calculatePercentage(totals.totalSold, totals.totalInventory),
    availabilityRate: calculatePercentage(totals.totalAvailable, totals.totalInventory),
  };
}

/**
 * Calculate financial metrics
 */
export interface FinancialMetrics {
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  averageBuyingPrice: number;
  averageSellingPrice: number;
  roi: number; // Return on Investment
}

export function calculateFinancialMetrics(batches: any[]): FinancialMetrics {
  const totals = batches.reduce((acc, batch) => {
    const quantity = batch.quantity || 0;
    const buyingPrice = batch.buying_price || 0;
    const sellingPrice = batch.selling_price || 0;
    const sold = batch.sold_count || batch.sold || 0;
    
    const investment = safeMultiply(buyingPrice, quantity);
    const revenue = safeMultiply(sellingPrice, sold);
    const profit = safeMultiply(sellingPrice - buyingPrice, sold);
    
    return {
      totalInvestment: safeAdd(acc.totalInvestment, investment),
      totalRevenue: safeAdd(acc.totalRevenue, revenue),
      totalProfit: safeAdd(acc.totalProfit, profit),
      totalQuantity: acc.totalQuantity + quantity,
      totalSold: acc.totalSold + sold,
      weightedBuyingPrice: safeAdd(acc.weightedBuyingPrice, safeMultiply(buyingPrice, quantity)),
      weightedSellingPrice: safeAdd(acc.weightedSellingPrice, safeMultiply(sellingPrice, sold)),
    };
  }, {
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalQuantity: 0,
    totalSold: 0,
    weightedBuyingPrice: 0,
    weightedSellingPrice: 0,
  });
  
  const averageBuyingPrice = safeDivide(totals.weightedBuyingPrice, totals.totalQuantity);
  const averageSellingPrice = safeDivide(totals.weightedSellingPrice, totals.totalSold);
  const profitMargin = calculateProfitMargin(totals.totalProfit, totals.totalRevenue);
  const roi = calculatePercentage(totals.totalProfit, totals.totalInvestment);
  
  return {
    totalInvestment: totals.totalInvestment,
    totalRevenue: totals.totalRevenue,
    totalProfit: totals.totalProfit,
    profitMargin,
    averageBuyingPrice,
    averageSellingPrice,
    roi,
  };
}
