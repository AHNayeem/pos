import { repositories } from "@/repositories";
import type { Refund } from "@/domain/types";
import { InventoryService } from "./inventory";

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

    const orderItem = order.items.find((item) => item.id === input.orderItemId);
    if (!orderItem) {
      throw { code: "NOT_FOUND", message: "Order item not found" } as RefundServiceError;
    }

    const existingRefunds = await repositories.refund.getAll({ orderId: input.orderId, status: "approved" });
    const alreadyRefundedQty = existingRefunds.reduce((sum, r) => sum + (r.orderItemId === input.orderItemId ? r.quantity : 0), 0);
    if (alreadyRefundedQty + input.quantity > orderItem.quantity) {
      throw { code: "INVALID_QUANTITY", message: "Refund quantity exceeds ordered quantity" } as RefundServiceError;
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

    const updated = await repositories.refund.update(refundId, update);

    if (updated && status === "approved") {
      const order = await repositories.order.getById(refund.orderId);
      if (order) {
        await InventoryService.adjustStock(
          refund.productVariantId,
          order.branchId,
          refund.quantity,
          "return",
          processedBy || order.cashierId,
          refund.id,
          `Refund for order ${order.orderNumber}`
        );
      }
    }

    return updated;
  }
}
