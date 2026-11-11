/**
 * Currency Utility for Indian Rupees (INR)
 * Handles conversions between Major Units (Rupees: ₹) and Minor Units (Paise: 100 paise = ₹1)
 * Used for Razorpay payments and precision financial storage.
 */

export class CurrencyUtils {
  /**
   * Convert Rupees to Paise (e.g. ₹1999.50 -> 199950 paise)
   */
  static toPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Convert Paise to Rupees (e.g. 199950 paise -> ₹1999.50)
   */
  static toRupees(paise: number): number {
    return Number((paise / 100).toFixed(2));
  }

  /**
   * Format Rupees as Indian Currency string (e.g. ₹1,499)
   */
  static formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Calculate 18% GST standard rate for nutrition products
   */
  static calculateGST(taxableAmount: number, isInterState: boolean = false) {
    const rate = 0.18; // 18% standard GST for health supplements
    const totalGst = Number((taxableAmount * rate).toFixed(2));
    
    if (isInterState) {
      return {
        igst: totalGst,
        cgst: 0,
        sgst: 0,
        totalGst,
      };
    }

    const half = Number((totalGst / 2).toFixed(2));
    return {
      igst: 0,
      cgst: half,
      sgst: half,
      totalGst,
    };
  }
}
