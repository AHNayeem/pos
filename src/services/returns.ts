import { repositories } from "@/repositories";
import type { Return } from "@/domain/types";
import { InventoryService } from "./inventory";

type ReturnServiceError = { code: string; message: string };

export class ReturnService {
  static async getReturns(filters?: { orderId?: string; status?: string }) {
    const returns = await repositories.return.getAll({
      orderId: filters?.orderId,
      status: filters?.status,
    });
    return returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getReturn(returnId: string): Promise<Return | null> {
    return repositories.return.getById(returnId);
  }

  static async getReturnsByOrder(orderId: string) {
    return repositories.return.getAll({ orderId });
  }

  static async createReturn(input: {
    orderId: string;
    customerId: string;
    items: { productVariantId: string; quantity: number }[];
    reason?: string;
  }): Promise<Return> {
    const order = await repositories.order.getById(input.orderId);
    if (!order) {
      throw { code: "NOT_FOUND", message: "Order not found" } as ReturnServiceError;
    }
    if (!input.items.length) {
      throw { code: "INVALID_INPUT", message: "Return must contain at least one item" } as ReturnServiceError;
    }
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw { code: "INVALID_QUANTITY", message: "Return quantity must be greater than zero" } as ReturnServiceError;
      }
      const orderItem = order.items.find((oi) => oi.productVariantId === item.productVariantId);
      if (!orderItem) {
        throw { code: "INVALID_ITEM", message: `Product variant ${item.productVariantId} not found in order` } as ReturnServiceError;
      }
      const existingReturns = await repositories.return.getAll({ orderId: input.orderId, status: "completed" });
      const alreadyReturnedQty = existingReturns.reduce((sum, r) => {
        return sum + r.items.filter((ri) => ri.productVariantId === item.productVariantId).reduce((q, ri) => q + ri.quantity, 0);
      }, 0);
      if (alreadyReturnedQty + item.quantity > orderItem.quantity) {
        throw { code: "INVALID_QUANTITY", message: `Return quantity for ${orderItem.productName} exceeds ordered quantity` } as ReturnServiceError;
      }
    }
    return repositories.return.create({
      orderId: input.orderId,
      customerId: input.customerId,
      items: input.items,
      reason: input.reason,
      status: "pending",
    });
  }

  static async updateReturnStatus(returnId: string, status: Return["status"]) {
    const returnRecord = await repositories.return.getById(returnId);
    if (!returnRecord) {
      throw { code: "NOT_FOUND", message: "Return not found" } as ReturnServiceError;
    }

    const updated = await repositories.return.update(returnId, {
      status,
      updatedAt: new Date().toISOString(),
    });

    if (updated && status === "completed") {
      const order = await repositories.order.getById(returnRecord.orderId);
      if (order) {
        for (const item of returnRecord.items) {
          await InventoryService.adjustStock(
            item.productVariantId,
            order.branchId,
            item.quantity,
            "return",
            order.cashierId,
            returnRecord.id,
            `Return for order ${order.orderNumber}`
          );
        }
      }
    }

    return updated;
  }
}
