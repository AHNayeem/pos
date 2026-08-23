import { repositories } from "@/repositories";
import type { Return } from "@/domain/types";

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
    return repositories.return.update(returnId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  }
}
