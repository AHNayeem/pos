import type { Cart, CartItem, Order, OrderItem, Payment } from "@/domain/types";
import { repositories } from "@/repositories";

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
      return {
        ...item,
        lineTotal: taxableAmount + taxAmount,
      };
    });

    const taxAmount = itemsWithTax.reduce((sum, item) => sum + (item.lineTotal - (item.unitPrice * item.quantity - (item.discountType === "percentage" ? (item.unitPrice * item.quantity * item.discount) / 100 : item.discount)) * (1 + item.taxRate / 100)), 0);
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

export class InventoryService {
  static async getStockLevel(variantId: string, branchId: string) {
    const inv = await repositories.inventory.getByVariant(variantId, branchId);
    return inv?.quantity ?? 0;
  }

  static async isInStock(variantId: string, branchId: string, quantity: number): Promise<boolean> {
    const stock = await this.getStockLevel(variantId, branchId);
    return stock >= quantity;
  }

  static async adjustStock(variantId: string, branchId: string, quantity: number, type: "purchase" | "sale" | "adjustment" | "transfer_in" | "transfer_out" | "return", actorId: string, referenceId?: string, note?: string) {
    return repositories.inventory.adjustStock(variantId, branchId, quantity, type, actorId, referenceId, note);
  }

  static async getLowStockItems(branchId: string) {
    return repositories.inventory.getAll({ branchId, lowStock: true });
  }
}

export class PosService {
  static async checkout(cart: Cart, paymentMethod: Payment["method"], paidAmount: number, cashierId: string, branchId: string, customerId?: string) {
    if (cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const orderItems: OrderItem[] = cart.items.map((item) => ({
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
    }));

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
      createdAt: new Date().toISOString(),
    };
    await repositories.payment.create(payment);

    for (const item of orderItems) {
      await InventoryService.adjustStock(item.productVariantId, branchId, -item.quantity, "sale", cashierId, savedOrder.id, `Sale: ${orderNumber}`);
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
    const expectedCash = shift.openingCash + shift.cashSales - shift.totalCashOut;
    return repositories.shift.update(shiftId, {
      closedAt: new Date().toISOString(),
      closingCash,
      expectedCash,
      status: "closed",
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
}
