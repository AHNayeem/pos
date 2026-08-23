export function calculateSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calculateLineTotal(unitPrice: number, quantity: number, taxRate: number, discount: number, discountType: "percentage" | "fixed"): number {
  const lineSubtotal = unitPrice * quantity;
  const lineDiscount = discountType === "percentage" ? (lineSubtotal * discount) / 100 : discount;
  const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
  return taxableAmount + (taxableAmount * taxRate) / 100;
}

export function calculateTax(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

export function calculateDiscount(amount: number, discount: number, discountType: "percentage" | "fixed"): number {
  if (discountType === "percentage") {
    return (amount * discount) / 100;
  }
  return Math.min(discount, amount);
}

export function calculateChange(paidAmount: number, grandTotal: number): number {
  return Math.max(0, paidAmount - grandTotal);
}

export function calculateOutstandingBalance(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

export function formatCurrency(amount: number, currency = "BDT"): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateOrderNumber(prefix = "POS"): string {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

export function generateId(prefix = ""): string {
  const base = Math.random().toString(36).slice(2, 11);
  return prefix ? `${prefix}-${base}` : base;
}

export function isWithinDateRange(date: string, from?: string, to?: string): boolean {
  const d = new Date(date);
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to)) return false;
  return true;
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
