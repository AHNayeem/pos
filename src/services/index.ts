import type { Cart, CartItem, Order, OrderItem, Payment } from "@/domain/types";
import { repositories } from "@/repositories";
import { InventoryService } from "./inventory";

export { BusinessService } from "./business";
export { BranchService } from "./branch";
export { ProductService } from "./product";
export { CategoryService } from "./category";
export { BrandService } from "./brand";
export { CustomerService } from "./customer";
export { SupplierService } from "./supplier";
export { InventoryService } from "./inventory";
export { PurchasingService } from "./purchasing";
export { PaymentService } from "./payments";
export { SaleService } from "./sales";
export { RefundService } from "./refunds";
export { ReturnService } from "./returns";
export { DiscountService } from "./discounts";
export { PromotionService } from "./promotions";
export { TaxService } from "./taxes";
export { ExpenseService } from "./expenses";
export { LoyaltyService } from "./loyalty";
export { StoreCreditService } from "./storeCredit";
export { StockTransferService } from "./stockTransfer";
export { AccountingService } from "./accounting";
export { NotificationService } from "./notifications";
export { AuditService } from "./audit";
export { SystemSettingsService } from "./systemSettings";

export class PricingService {
  static async calculateCart(items: CartItem[], discountCode?: string): Promise<Cart> {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discountAmount = 0;

    if (discountCode) {
      const discount = await repositories.discount.getByCode(discountCode);
      if (discount && discount.isActive) {
        const now = new Date();
        const start = discount.startsAt ? new Date(discount.startsAt) : null;
        const end = discount.endsAt ? new Date(discount.endsAt) : null;
        if ((!start || now >= start) && (!end || now <= end)) {
          if (!discount.minPurchase || subtotal >= discount.minPurchase) {
            if (discount.type === "percentage") {
              discountAmount = (subtotal * discount.value) / 100;
              if (discount.maxDiscount) {
                discountAmount = Math.min(discountAmount, discount.maxDiscount);
              }
            } else {
              discountAmount = discount.value;
            }
          }
        }
      }
    }

    const itemsWithTax = items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountType === "percentage" ? (lineSubtotal * item.discount) / 100 : item.discount;
      const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
      const taxAmount = (taxableAmount * item.taxRate) / 100;
      const lineTotal = taxableAmount + taxAmount;
      return {
        ...item,
        lineTotal,
      };
    });

    const taxAmount = itemsWithTax.reduce((sum, item) => {
      const lineSub = item.unitPrice * item.quantity;
      const lineDisc = item.discountType === "percentage" ? (lineSub * item.discount) / 100 : item.discount;
      return sum + (Math.max(0, lineSub - lineDisc) * item.taxRate) / 100;
    }, 0);
    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    return {
      id: "",
      items: itemsWithTax,
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
      updatedAt: new Date().toISOString(),
    };
  }

  static calculateItemLineTotal(unitPrice: number, quantity: number, taxRate: number, discount: number, discountType: "percentage" | "fixed"): number {
    const lineSubtotal = unitPrice * quantity;
    const lineDiscount = discountType === "percentage" ? (lineSubtotal * discount) / 100 : discount;
    const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
    return taxableAmount + (taxableAmount * taxRate) / 100;
  }

  static calculateTax(amount: number, taxRate: number): number {
    return (amount * taxRate) / 100;
  }

  static calculateDiscount(amount: number, discount: number, discountType: "percentage" | "fixed"): number {
    if (discountType === "percentage") {
      return (amount * discount) / 100;
    }
    return Math.min(discount, amount);
  }

  static calculateChange(paidAmount: number, grandTotal: number): number {
    return Math.max(0, paidAmount - grandTotal);
  }

  static calculateOutstandingBalance(total: number, paid: number): number {
    return Math.max(0, total - paid);
  }
}

export class PosService {
  static async checkout(cart: Cart, paymentMethod: Payment["method"], paidAmount: number, cashierId: string, branchId: string, customerId?: string) {
    if (cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const settings = await repositories.systemSettings.getSettings();
    if (settings?.posRequireCustomer && !customerId) {
      throw new Error("Customer is required for checkout");
    }

    for (const item of cart.items) {
      const inStock = await InventoryService.isInStock(item.productVariantId, branchId, item.quantity);
      if (!inStock) {
        throw new Error(`Insufficient stock for ${item.productName} (${item.variantName})`);
      }
    }

    const orderItems: OrderItem[] = cart.items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountType === "percentage" ? (lineSubtotal * item.discount) / 100 : item.discount;
      const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
      const taxAmount = (taxableAmount * item.taxRate) / 100;
      const lineTotal = taxableAmount + taxAmount;
      return {
        id: `oi-${Math.random().toString(36).slice(2, 11)}`,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: 0,
        taxRate: item.taxRate,
        discount: item.discount,
        discountType: item.discountType,
        lineTotal,
      };
    });

    const orderNumber = `POS-${String(Date.now()).slice(-6)}`;
    const changeAmount = PricingService.calculateChange(paidAmount, cart.grandTotal);

    const order: Order = {
      id: `ord-${Math.random().toString(36).slice(2, 11)}`,
      orderNumber,
      branchId,
      customerId,
      cashierId,
      items: orderItems,
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      discountAmount: cart.discountAmount,
      grandTotal: cart.grandTotal,
      paymentStatus: paidAmount >= cart.grandTotal ? "paid" : "partial",
      paymentMethod,
      paidAmount,
      changeAmount,
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedOrder = await repositories.order.create(order);

    const payment: Payment = {
      id: `pay-${Math.random().toString(36).slice(2, 11)}`,
      orderId: savedOrder.id,
      method: paymentMethod,
      amount: paidAmount,
      reference: `${paymentMethod.toUpperCase()}-${String(Date.now()).slice(-6)}`,
      note: `Payment for order ${orderNumber}`,
      createdAt: new Date().toISOString(),
    };
    await repositories.payment.create(payment);

    for (const item of orderItems) {
      await InventoryService.adjustStock(item.productVariantId, branchId, -item.quantity, "sale", cashierId, savedOrder.id, `Sale: ${orderNumber}`);
    }

    if (customerId) {
      const customer = await repositories.customer.getById(customerId);
      if (customer) {
        const outstanding = PricingService.calculateOutstandingBalance(cart.grandTotal, paidAmount);
        await repositories.customer.update(customerId, {
          currentBalance: customer.currentBalance + outstanding,
        });
      }
    }

    const cashAccount = await repositories.accounting.getAllAccounts({ type: "cash", branchId });
    const receivableAccount = await repositories.accounting.getAllAccounts({ type: "receivable", branchId });

    if (cashAccount.length > 0 && paidAmount > 0) {
      await repositories.accounting.createTransaction({
        accountId: cashAccount[0].id,
        type: "debit",
        amount: paidAmount,
        referenceId: savedOrder.id,
        referenceType: "order",
        note: `Cash payment for order ${orderNumber}`,
        actorId: cashierId,
      });
    }

    if (receivableAccount.length > 0 && cart.grandTotal > paidAmount) {
      await repositories.accounting.createTransaction({
        accountId: receivableAccount[0].id,
        type: "debit",
        amount: cart.grandTotal - paidAmount,
        referenceId: savedOrder.id,
        referenceType: "order",
        note: `Outstanding balance for order ${orderNumber}`,
        actorId: cashierId,
      });
    }

    if (receivableAccount.length > 0) {
      await repositories.accounting.createTransaction({
        accountId: receivableAccount[0].id,
        type: "credit",
        amount: cart.grandTotal,
        referenceId: savedOrder.id,
        referenceType: "order",
        note: `Revenue from order ${orderNumber}`,
        actorId: cashierId,
      });
    }

    const loyaltySettings = await repositories.loyalty.getSettings();
    if (loyaltySettings?.isActive && customerId) {
      const pointsEarned = Math.floor(cart.grandTotal / loyaltySettings.pointsPerCurrency);
      const customer = await repositories.customer.getById(customerId);
      if (customer && pointsEarned > 0) {
        await repositories.customer.update(customerId, {
          loyaltyPoints: customer.loyaltyPoints + pointsEarned,
        });
      }
    }

    const cashier = await repositories.user.getById(cashierId);
    const customer = customerId ? await repositories.customer.getById(customerId) : null;
    if (cashier) {
      await repositories.sale.update(savedOrder.id, {
        cashierName: cashier.name,
        customerName: customer?.name,
      });
    }

    return savedOrder;
  }

  static async holdOrder(cart: Cart, cashierId: string, branchId: string) {
    if (cart.items.length === 0) {
      throw new Error("Cart is empty");
    }
    const orderNumber = `HLD-${String(Date.now()).slice(-6)}`;
    const order: Order = {
      id: `ord-${Math.random().toString(36).slice(2, 11)}`,
      orderNumber,
      branchId,
      cashierId,
      items: cart.items.map((item) => ({
        id: `oi-${Math.random().toString(36).slice(2, 11)}`,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: 0,
        taxRate: item.taxRate,
        discount: item.discount,
        discountType: item.discountType,
        lineTotal: item.lineTotal,
      })),
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      discountAmount: cart.discountAmount,
      grandTotal: cart.grandTotal,
      paymentStatus: "pending",
      paymentMethod: undefined,
      paidAmount: 0,
      changeAmount: 0,
      status: "held",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return repositories.order.create(order);
  }
}

export class ShiftService {
  static async getShifts(filters?: { branchId?: string; status?: string }) {
    const shifts = await repositories.shift.getAll({
      branchId: filters?.branchId,
      status: filters?.status,
    });
    return shifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async openShift(branchId: string, userId: string, openingCash: number) {
    const existing = await repositories.shift.getActive(branchId, userId);
    if (existing) {
      throw new Error("You already have an open shift");
    }
    return repositories.shift.create({
      branchId,
      userId,
      openedAt: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      creditSales: 0,
      totalSales: 0,
      totalRefunds: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      status: "open",
    });
  }

  static async closeShift(shiftId: string, closingCash: number, note?: string) {
    const shift = await repositories.shift.getById(shiftId);
    if (!shift) throw new Error("Shift not found");

    const expectedCash = shift.openingCash + shift.cashSales - shift.totalCashOut - shift.totalRefunds;
    const _variance = closingCash - expectedCash;

    return repositories.shift.update(shiftId, {
      closedAt: new Date().toISOString(),
      closingCash,
      expectedCash,
      note,
    });
  }
}

export class ReportService {
  static async getSalesSummary(branchId: string, from: string, to: string) {
    const orders = await repositories.order.getAll({ branchId, from, to });
    const completed = orders.filter((o) => o.status === "completed");
    return {
      totalOrders: completed.length,
      totalSales: completed.reduce((sum, o) => sum + o.grandTotal, 0),
      totalTax: completed.reduce((sum, o) => sum + o.taxAmount, 0),
      totalDiscount: completed.reduce((sum, o) => sum + o.discountAmount, 0),
      cashSales: completed.filter((o) => o.paymentMethod === "cash").reduce((sum, o) => sum + o.grandTotal, 0),
      cardSales: completed.filter((o) => o.paymentMethod === "card").reduce((sum, o) => sum + o.grandTotal, 0),
      mobileSales: completed.filter((o) => o.paymentMethod === "mobile").reduce((sum, o) => sum + o.grandTotal, 0),
      creditSales: completed.filter((o) => o.paymentMethod === "credit").reduce((sum, o) => sum + o.grandTotal, 0),
    };
  }

  static async getInventorySummary(filters?: { branchId?: string }) {
    const inventory = await repositories.inventory.getAll(filters);
    const lowStock = inventory.filter((item) => item.quantity <= item.minStockLevel);
    let totalStockValue = 0;
    for (const item of inventory) {
      const variant = await repositories.product.getVariantById(item.productVariantId);
      totalStockValue += item.quantity * (variant?.costPrice ?? 0);
    }
    return {
      totalSKUs: inventory.length,
      totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
      lowStockCount: lowStock.length,
      totalStockValue,
      lowStockItems: lowStock.map((item) => ({
        productVariantId: item.productVariantId,
        branchId: item.branchId,
        quantity: item.quantity,
        minStockLevel: item.minStockLevel,
      })),
    };
  }

  static async getProfitSummary(branchId: string, from: string, to: string) {
    const orders = await repositories.order.getAll({ branchId, from, to });
    const completed = orders.filter((o) => o.status === "completed");
    const revenue = completed.reduce((sum, o) => sum + o.grandTotal, 0);

    const refunds = await repositories.refund.getAll();
    const approvedRefunds = refunds.filter((r) => {
      const order = completed.find((o) => o.id === r.orderId);
      return order && new Date(r.createdAt) >= new Date(from) && new Date(r.createdAt) <= new Date(to);
    });
    const totalRefundAmount = approvedRefunds.reduce((sum, r) => sum + r.amount, 0);
    const netRevenue = revenue - totalRefundAmount;

    const costOfGoodsSold = completed.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.costPrice * item.quantity, 0);
    }, 0);

    const expenses = await repositories.expense.getAll({ branchId, from, to });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const grossProfit = netRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;
    return {
      revenue: netRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      totalRefunds: totalRefundAmount,
      margin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
    };
  }

  static async getTopProducts(filters: { branchId?: string; from?: string; to?: string; limit?: number } = {}) {
    const orders = await repositories.order.getAll({
      branchId: filters.branchId,
      from: filters.from,
      to: filters.to,
    });
    const completed = orders.filter((o) => o.status === "completed");
    const productMap = new Map<string, { productVariantId: string; productName: string; variantName: string; quantity: number; revenue: number }>();
    for (const order of completed) {
      for (const item of order.items) {
        const existing = productMap.get(item.productVariantId) || { productVariantId: item.productVariantId, productName: item.productName, variantName: item.variantName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
        productMap.set(item.productVariantId, existing);
      }
    }
    const sorted = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const limit = filters.limit ?? 10;
    return sorted.slice(0, limit);
  }

  static async getSalesByPaymentMethod(branchId: string, from: string, to: string) {
    const summary = await this.getSalesSummary(branchId, from, to);
    const total = summary.totalSales || 1;
    return [
      { method: "Cash", amount: summary.cashSales, percentage: (summary.cashSales / total) * 100 },
      { method: "Card", amount: summary.cardSales, percentage: (summary.cardSales / total) * 100 },
      { method: "Mobile", amount: summary.mobileSales, percentage: (summary.mobileSales / total) * 100 },
      { method: "Credit", amount: summary.creditSales, percentage: (summary.creditSales / total) * 100 },
    ];
  }
}
