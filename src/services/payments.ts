import { repositories } from "@/repositories";
import type { Payment, PaymentStatus } from "@/domain/types";
import { AccountingService } from "./accounting";

type PaymentServiceError = { code: string; message: string };

export class PaymentService {
  static async getPayments(filters?: { orderId?: string; method?: string }) {
    let payments = await repositories.payment.getAll({ orderId: filters?.orderId });
    if (filters?.method) {
      payments = payments.filter((p) => p.method === filters.method);
    }
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getPayment(paymentId: string): Promise<Payment | null> {
    return repositories.payment.getById(paymentId);
  }

  static async getPaymentsByOrder(orderId: string) {
    return repositories.payment.getAll({ orderId });
  }

  static async createPayment(input: {
    orderId: string;
    method: Payment["method"];
    amount: number;
    reference?: string;
    note?: string;
  }): Promise<Payment> {
    const order = await repositories.order.getById(input.orderId);
    if (!order) {
      throw { code: "NOT_FOUND", message: "Order not found" } as PaymentServiceError;
    }
    if (input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Payment amount must be greater than zero" } as PaymentServiceError;
    }

    const existingPayments = await repositories.payment.getAll({ orderId: input.orderId });
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = totalPaid + input.amount;
    const paymentStatus: PaymentStatus = newTotalPaid >= order.grandTotal ? "paid" : "partial";

    const payment = await repositories.payment.create({
      orderId: input.orderId,
      method: input.method,
      amount: input.amount,
      reference: input.reference,
      note: input.note,
    });

    await repositories.order.update(input.orderId, {
      paymentStatus,
      paidAmount: newTotalPaid,
      updatedAt: new Date().toISOString(),
    });

    if (input.method === "cash") {
      const cashAccounts = await AccountingService.getAccounts({ type: "cash", branchId: order.branchId });
      if (cashAccounts.length > 0) {
        await AccountingService.createTransaction({
          accountId: cashAccounts[0].id,
          type: "debit",
          amount: input.amount,
          referenceId: input.orderId,
          referenceType: "payment",
          note: `Cash payment for order ${order.orderNumber}`,
          actorId: order.cashierId,
        });
      }
    }

    return payment;
  }
}
