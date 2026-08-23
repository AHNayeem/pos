import { repositories } from "@/repositories";
import type { Payment } from "@/domain/types";

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
    return repositories.payment.create({
      orderId: input.orderId,
      method: input.method,
      amount: input.amount,
      reference: input.reference,
      note: input.note,
    });
  }
}
