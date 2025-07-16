import { PAYMENT_CONFIG } from '@/lib/constants';

/**
 * Payment calculation utilities for two-stage payment system
 */

export interface PaymentBreakdown {
  totalPrice: number;
  depositAmount: number;
  balanceAmount: number;
  depositPercentage: number;
}

/**
 * Calculate deposit amount based on total price
 */
export function calculateDepositAmount(totalPrice: number): number {
  const percentageAmount = Math.round(totalPrice * (PAYMENT_CONFIG.depositPercentage / 100));
  
  // Apply minimum and maximum deposit limits
  if (percentageAmount < PAYMENT_CONFIG.minimumDeposit) {
    return PAYMENT_CONFIG.minimumDeposit;
  }
  
  if (percentageAmount > PAYMENT_CONFIG.maximumDeposit) {
    return PAYMENT_CONFIG.maximumDeposit;
  }
  
  return percentageAmount;
}

/**
 * Get complete payment breakdown
 */
export function getPaymentBreakdown(totalPrice: number): PaymentBreakdown {
  const depositAmount = calculateDepositAmount(totalPrice);
  const balanceAmount = totalPrice - depositAmount;
  const actualDepositPercentage = Math.round((depositAmount / totalPrice) * 100);
  
  return {
    totalPrice,
    depositAmount,
    balanceAmount,
    depositPercentage: actualDepositPercentage,
  };
}

/**
 * Calculate refund amount based on cancellation timing
 */
export function calculateRefundAmount(
  totalPrice: number,
  depositPaid: number,
  hoursUntilService: number
): {
  refundAmount: number;
  refundPercentage: number;
  refundType: 'full' | 'partial' | 'none';
} {
  if (hoursUntilService >= PAYMENT_CONFIG.fullRefundHours) {
    return {
      refundAmount: depositPaid,
      refundPercentage: 100,
      refundType: 'full',
    };
  }
  
  if (hoursUntilService >= PAYMENT_CONFIG.partialRefundHours) {
    const refundAmount = Math.round(depositPaid * 0.5);
    return {
      refundAmount,
      refundPercentage: 50,
      refundType: 'partial',
    };
  }
  
  return {
    refundAmount: 0,
    refundPercentage: 0,
    refundType: 'none',
  };
}

/**
 * Check if price adjustment is allowed and within limits
 */
export function validatePriceAdjustment(
  originalPrice: number,
  newPrice: number
): {
  isValid: boolean;
  increasePercentage: number;
  requiresApproval: boolean;
  reason?: string;
} {
  if (!PAYMENT_CONFIG.allowPriceAdjustment) {
    return {
      isValid: false,
      increasePercentage: 0,
      requiresApproval: false,
      reason: 'Price adjustments are not allowed',
    };
  }
  
  if (newPrice < originalPrice) {
    // Price decrease is always allowed
    return {
      isValid: true,
      increasePercentage: 0,
      requiresApproval: false,
    };
  }
  
  const increasePercentage = Math.round(((newPrice - originalPrice) / originalPrice) * 100);
  
  if (increasePercentage > PAYMENT_CONFIG.maxPriceIncrease) {
    return {
      isValid: false,
      increasePercentage,
      requiresApproval: false,
      reason: `Price increase of ${increasePercentage}% exceeds maximum allowed increase of ${PAYMENT_CONFIG.maxPriceIncrease}%`,
    };
  }
  
  return {
    isValid: true,
    increasePercentage,
    requiresApproval: PAYMENT_CONFIG.requireApprovalForIncrease && increasePercentage > 0,
  };
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get payment status message for customers
 */
export function getPaymentStatusMessage(
  paymentStatus: string,
  bookingStatus: string,
  breakdown: PaymentBreakdown
): string {
  switch (paymentStatus) {
    case 'pending':
      return 'Waiting for booking confirmation. No payment required yet.';
    
    case 'deposit_required':
      return `Booking confirmed! Please pay your deposit of ${formatPaymentAmount(breakdown.depositAmount)} to secure your appointment.`;
    
    case 'deposit_paid':
      return `Deposit paid. Remaining balance of ${formatPaymentAmount(breakdown.balanceAmount)} will be due after service completion.`;
    
    case 'balance_due':
      return `Service completed! Please pay the remaining balance of ${formatPaymentAmount(breakdown.balanceAmount)}.`;
    
    case 'paid':
      return 'Payment complete. Thank you for your business!';
    
    case 'failed':
      return 'Payment failed. Please try again or contact support.';
    
    case 'refunded':
      return 'Payment has been refunded to your original payment method.';
    
    case 'partial_refund':
      return 'Partial refund has been processed to your original payment method.';
    
    default:
      return 'Payment status unknown. Please contact support.';
  }
}

/**
 * Determine next payment action required
 */
export function getNextPaymentAction(
  paymentStatus: string,
  bookingStatus: string
): {
  action: 'none' | 'pay_deposit' | 'pay_balance' | 'contact_support';
  message: string;
  urgent: boolean;
} {
  switch (paymentStatus) {
    case 'deposit_required':
      return {
        action: 'pay_deposit',
        message: 'Pay deposit to confirm your booking',
        urgent: true,
      };
    
    case 'balance_due':
      return {
        action: 'pay_balance',
        message: 'Pay remaining balance',
        urgent: true,
      };
    
    case 'failed':
      return {
        action: 'contact_support',
        message: 'Contact support for payment assistance',
        urgent: true,
      };
    
    default:
      return {
        action: 'none',
        message: 'No payment action required',
        urgent: false,
      };
  }
}