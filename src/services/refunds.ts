import { repositories } from "@/repositories";
import type { Refund } from "@/domain/types";

type RefundServiceError = { code: string; message: string };

export class RefundService {
  static async getRefunds(filters?: { orderId?: string; status?: string }) {
    const refunds = await repositories.refund.getAll({
      orderId: filters?.orderId,
      status: filters?.status,
    });
    return refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getRefund(refundId: string): Promise<Refund | null> {
    return repositories.refund.getById(refundId);
  }

  static async getRefundsByOrder(orderId: string) {
    return repositories.refund.getAll({ orderId });
  }

  static async createRefund(input: {
    orderId: string;
    orderItemId: string;
    productVariantId: string;
    quantity: number;
    amount: number;
    reason?: string;
    processedBy?: string;
  }): Promise<Refund> {
    const order = await repositories.order.getById(input.orderId);
    if (!order) {
      throw { code: "NOT_FOUND", message: "Order not found" } as RefundServiceError;
    }
    if (input.quantity <= 0) {
      throw { code: "INVALID_QUANTITY", message: "Refund quantity must be greater than zero" } as RefundServiceError;
    }
    if (input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Refund amount must be greater than zero" } as RefundServiceError;
    }
    return repositories.refund.create({
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      productVariantId: input.productVariantId,
      quantity: input.quantity,
      amount: input.amount,
      reason: input.reason,
      status: "pending",
      processedBy: input.processedBy,
    });
  }

  static async updateRefundStatus(refundId: string, status: Refund["status"], processedBy?: string) {
    const refund = await repositories.refund.getById(refundId);
    if (!refund) {
      throw { code: "NOT_FOUND", message: "Refund not found" } as RefundServiceError;
    }
    const update: Partial<Refund> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (processedBy) {
      update.processedBy = processedBy;
      update.processedAt = new Date().toISOString();
    }
    return repositories.refund.update(refundId, update);
  }
}
