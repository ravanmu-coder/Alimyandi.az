/**
 * Bid Calculator Utility
 * 
 * This utility replicates the exact backend minimum bid calculation logic
 * used in the C# .NET backend to ensure frontend consistency.
 * 
 * Based on Copart-style bidding increments with dynamic minimum bid calculation.
 */

export interface BidCalculationResult {
  minimumBid: number;
  nextMinimumBid: number;
  increment: number;
  isValidBid: boolean;
  validationMessage?: string;
}

export interface BidValidationResult {
  isValid: boolean;
  message?: string;
  suggestedAmount?: number;
}

/**
 * Calculate the bid increment based on current price
 * This replicates the exact backend logic:
 * 
 * const increment = currentPrice switch {
 *   < 100 => 25,
 *   < 500 => 50, 
 *   < 1000 => 100,
 *   < 5000 => 250,
 *   < 10000 => 500,
 *   _ => 1000
 * };
 */
export function calculateBidIncrement(currentPrice: number): number {
  if (currentPrice < 100) return 25;
  if (currentPrice < 500) return 50;
  if (currentPrice < 1000) return 100;
  if (currentPrice < 5000) return 250;
  if (currentPrice < 10000) return 500;
  return 1000;
}

/**
 * Calculate minimum bid amount based on current price and minimum pre-bid
 * Replicates backend logic: Math.max(currentPrice + increment, minPreBid)
 */
export function calculateMinimumBid(
  currentPrice: number, 
  minPreBid: number = 0
): number {
  const increment = calculateBidIncrement(currentPrice);
  return Math.max(currentPrice + increment, minPreBid);
}

/**
 * Calculate next minimum bid amount
 * This is what the next bidder would need to bid
 */
export function calculateNextMinimumBid(currentPrice: number): number {
  const increment = calculateBidIncrement(currentPrice);
  return currentPrice + increment;
}

/**
 * Comprehensive bid calculation with all relevant information
 */
export function calculateBidInfo(
  currentPrice: number,
  minPreBid: number = 0
): BidCalculationResult {
  const increment = calculateBidIncrement(currentPrice);
  const minimumBid = calculateMinimumBid(currentPrice, minPreBid);
  const nextMinimumBid = calculateNextMinimumBid(currentPrice);
  
  return {
    minimumBid,
    nextMinimumBid,
    increment,
    isValidBid: true,
    validationMessage: undefined
  };
}

/**
 * Validate a bid amount against current auction state
 */
export function validateBidAmount(
  bidAmount: number,
  currentPrice: number,
  minPreBid: number = 0,
  userMaxBid?: number
): BidValidationResult {
  // Check if bid amount is a valid number
  if (isNaN(bidAmount) || bidAmount <= 0) {
    return {
      isValid: false,
      message: 'Bid amount must be a valid positive number'
    };
  }

  // Calculate minimum required bid
  const minimumBid = calculateMinimumBid(currentPrice, minPreBid);
  
  // Check if bid meets minimum requirement
  if (bidAmount < minimumBid) {
    return {
      isValid: false,
      message: `Bid must be at least $${minimumBid.toLocaleString()}`,
      suggestedAmount: minimumBid
    };
  }

  // Check if bid exceeds user's maximum (if provided)
  if (userMaxBid && bidAmount > userMaxBid) {
    return {
      isValid: false,
      message: `Bid cannot exceed your maximum of $${userMaxBid.toLocaleString()}`,
      suggestedAmount: userMaxBid
    };
  }

  // Check if bid is reasonable (not more than 10x current price)
  if (bidAmount > currentPrice * 10) {
    return {
      isValid: false,
      message: 'Bid amount seems unusually high. Please verify.',
      suggestedAmount: currentPrice * 2
    };
  }

  return {
    isValid: true
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format bid increment for display
 */
export function formatBidIncrement(increment: number): string {
  return `+$${increment.toLocaleString()}`;
}

/**
 * Calculate proxy bid parameters
 */
export function calculateProxyBidParams(
  startAmount: number,
  maxAmount: number,
  currentPrice: number,
  minPreBid: number = 0
): {
  isValid: boolean;
  message?: string;
  suggestedStartAmount?: number;
  suggestedMaxAmount?: number;
  estimatedBidCount?: number;
} {
  const minimumBid = calculateMinimumBid(currentPrice, minPreBid);
  
  // Validate start amount
  if (startAmount < minimumBid) {
    return {
      isValid: false,
      message: `Start amount must be at least ${formatCurrency(minimumBid)}`,
      suggestedStartAmount: minimumBid
    };
  }

  // Validate max amount
  if (maxAmount <= startAmount) {
    return {
      isValid: false,
      message: 'Maximum amount must be greater than start amount',
      suggestedMaxAmount: startAmount + calculateBidIncrement(startAmount)
    };
  }

  // Calculate estimated number of bids
  let estimatedBidCount = 0;
  let currentBidAmount = startAmount;
  
  while (currentBidAmount < maxAmount) {
    const increment = calculateBidIncrement(currentBidAmount);
    currentBidAmount += increment;
    estimatedBidCount++;
    
    // Prevent infinite loops
    if (estimatedBidCount > 100) break;
  }

  return {
    isValid: true,
    estimatedBidCount: Math.min(estimatedBidCount, 100)
  };
}

/**
 * Calculate bid history statistics
 */
export function calculateBidStats(bids: Array<{ amount: number; placedAtUtc: string }>): {
  totalBids: number;
  averageBid: number;
  highestBid: number;
  lowestBid: number;
  bidVelocity: number; // bids per minute
  priceIncrease: number;
} {
  if (bids.length === 0) {
    return {
      totalBids: 0,
      averageBid: 0,
      highestBid: 0,
      lowestBid: 0,
      bidVelocity: 0,
      priceIncrease: 0
    };
  }

  const amounts = bids.map(bid => bid.amount);
  const totalBids = bids.length;
  const averageBid = amounts.reduce((sum, amount) => sum + amount, 0) / totalBids;
  const highestBid = Math.max(...amounts);
  const lowestBid = Math.min(...amounts);
  
  // Calculate bid velocity (bids per minute)
  const firstBidTime = new Date(bids[bids.length - 1].placedAtUtc).getTime();
  const lastBidTime = new Date(bids[0].placedAtUtc).getTime();
  const timeSpanMinutes = (lastBidTime - firstBidTime) / (1000 * 60);
  const bidVelocity = timeSpanMinutes > 0 ? totalBids / timeSpanMinutes : 0;
  
  // Calculate price increase
  const priceIncrease = highestBid - lowestBid;

  return {
    totalBids,
    averageBid,
    highestBid,
    lowestBid,
    bidVelocity,
    priceIncrease
  };
}

/**
 * Predict next bid amount based on current bidding pattern
 */
export function predictNextBid(
  currentPrice: number,
  recentBids: Array<{ amount: number; placedAtUtc: string }>,
  minPreBid: number = 0
): {
  predictedAmount: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
} {
  const minimumBid = calculateMinimumBid(currentPrice, minPreBid);
  
  if (recentBids.length < 3) {
    return {
      predictedAmount: minimumBid,
      confidence: 'low',
      reasoning: 'Not enough bid history to make accurate prediction'
    };
  }

  // Analyze recent bidding pattern
  const recentAmounts = recentBids.slice(0, 5).map(bid => bid.amount);
  const averageIncrement = recentAmounts.reduce((sum, amount, index) => {
    if (index === 0) return sum;
    return sum + (amount - recentAmounts[index - 1]);
  }, 0) / (recentAmounts.length - 1);

  const standardIncrement = calculateBidIncrement(currentPrice);
  
  // If recent increments are close to standard, predict standard increment
  if (Math.abs(averageIncrement - standardIncrement) < standardIncrement * 0.2) {
    return {
      predictedAmount: minimumBid,
      confidence: 'high',
      reasoning: 'Recent bids follow standard increment pattern'
    };
  }

  // If recent increments are higher, predict higher increment
  if (averageIncrement > standardIncrement * 1.5) {
    return {
      predictedAmount: currentPrice + Math.round(averageIncrement),
      confidence: 'medium',
      reasoning: 'Recent bids show aggressive bidding pattern'
    };
  }

  // Default to minimum bid
  return {
    predictedAmount: minimumBid,
    confidence: 'medium',
    reasoning: 'Standard increment prediction'
  };
}

/**
 * Calculate auction urgency based on timer and bidding activity
 */
export function calculateAuctionUrgency(
  timerSeconds: number,
  recentBids: Array<{ amount: number; placedAtUtc: string }>,
  currentPrice: number
): {
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  urgencyScore: number; // 0-100
  factors: string[];
} {
  const factors: string[] = [];
  let urgencyScore = 0;

  // Timer urgency (40% weight)
  if (timerSeconds <= 10) {
    urgencyScore += 40;
    factors.push('Timer under 10 seconds');
  } else if (timerSeconds <= 30) {
    urgencyScore += 30;
    factors.push('Timer under 30 seconds');
  } else if (timerSeconds <= 60) {
    urgencyScore += 20;
    factors.push('Timer under 1 minute');
  }

  // Bidding activity urgency (30% weight)
  const recentBidCount = recentBids.filter(bid => {
    const bidTime = new Date(bid.placedAtUtc).getTime();
    const now = Date.now();
    return (now - bidTime) < 60000; // Last minute
  }).length;

  if (recentBidCount >= 5) {
    urgencyScore += 30;
    factors.push('High recent bidding activity');
  } else if (recentBidCount >= 3) {
    urgencyScore += 20;
    factors.push('Moderate recent bidding activity');
  } else if (recentBidCount >= 1) {
    urgencyScore += 10;
    factors.push('Some recent bidding activity');
  }

  // Price increase urgency (30% weight)
  if (recentBids.length >= 2) {
    const priceIncrease = recentBids[0].amount - recentBids[recentBids.length - 1].amount;
    const priceIncreasePercent = (priceIncrease / recentBids[recentBids.length - 1].amount) * 100;
    
    if (priceIncreasePercent > 50) {
      urgencyScore += 30;
      factors.push('Rapid price increase');
    } else if (priceIncreasePercent > 25) {
      urgencyScore += 20;
      factors.push('Moderate price increase');
    } else if (priceIncreasePercent > 10) {
      urgencyScore += 10;
      factors.push('Steady price increase');
    }
  }

  // Determine urgency level
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  if (urgencyScore >= 80) {
    urgencyLevel = 'critical';
  } else if (urgencyScore >= 60) {
    urgencyLevel = 'high';
  } else if (urgencyScore >= 30) {
    urgencyLevel = 'medium';
  } else {
    urgencyLevel = 'low';
  }

  return {
    urgencyLevel,
    urgencyScore,
    factors
  };
}

/**
 * Get suggested bid amounts for quick bidding
 */
export function getSuggestedBidAmounts(
  currentPrice: number,
  minPreBid: number = 0
): number[] {
  const minimumBid = calculateMinimumBid(currentPrice, minPreBid);
  const increment = calculateBidIncrement(currentPrice);
  
  // Generate 5 suggested amounts
  const suggestions: number[] = [];
  
  // First suggestion is always the minimum bid
  suggestions.push(minimumBid);
  
  // Add increments based on current price range
  for (let i = 1; i < 5; i++) {
    const multiplier = i * 2; // 2x, 4x, 6x, 8x increments
    suggestions.push(minimumBid + (increment * multiplier));
  }
  
  return suggestions;
}

/**
 * Export all utility functions for easy importing
 */
export const BidCalculator = {
  calculateBidIncrement,
  calculateMinimumBid,
  calculateNextMinimumBid,
  calculateBidInfo,
  validateBidAmount,
  formatCurrency,
  formatBidIncrement,
  calculateProxyBidParams,
  calculateBidStats,
  predictNextBid,
  calculateAuctionUrgency,
  getSuggestedBidAmounts
};

export default BidCalculator;