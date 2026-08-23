import { repositories } from "@/repositories";
import type { PurchaseOrder, PurchaseOrderItem } from "@/domain/types";
import { InventoryService } from "./inventory";
import { SupplierService } from "./supplier";

type PurchasingServiceError = { code: string; message: string };

export interface CreatePurchaseOrderInput {
  poNumber: string;
  branchId: string;
  supplierId: string;
  items: Omit<PurchaseOrderItem, "id" | "lineTotal">[];
  taxAmount: number;
  note?: string;
  createdBy: string;
}

export interface UpdatePurchaseOrderInput {
  branchId?: string;
  supplierId?: string;
  items?: Omit<PurchaseOrderItem, "id" | "lineTotal">[];
  taxAmount?: number;
  note?: string;
}

export interface ReceivePurchaseOrderInput {
  receivedItems: { itemId: string; quantity: number }[];
  receivedBy: string;
}

export class PurchasingService {
  static async getPurchaseOrders(filters?: { status?: string; branchId?: string; supplierId?: string }) {
    return repositories.purchaseOrder.getAll(filters);
  }

  static async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    return repositories.purchaseOrder.getById(poId);
  }

  static async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const grandTotal = subtotal + input.taxAmount;

    const items: PurchaseOrderItem[] = input.items.map((item) => ({
      ...item,
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lineTotal: item.quantity * item.unitCost,
    }));

    const po: PurchaseOrder = {
      id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      poNumber: input.poNumber,
      branchId: input.branchId,
      supplierId: input.supplierId,
      items,
      subtotal,
      taxAmount: input.taxAmount,
      grandTotal,
      status: "draft",
      note: input.note,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return repositories.purchaseOrder.create(po);
  }

  static async updatePurchaseOrder(poId: string, data: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const existing = await repositories.purchaseOrder.getById(poId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Purchase order not found" } as PurchasingServiceError;
    }

    if (existing.status === "received" || existing.status === "cancelled") {
      throw { code: "INVALID_STATUS", message: "Cannot update a received or cancelled purchase order" } as PurchasingServiceError;
    }

    const updates: Partial<PurchaseOrder> = {};

    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
      const fullItems: PurchaseOrderItem[] = data.items.map((item) => ({
        ...item,
        id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        lineTotal: item.quantity * item.unitCost,
      }));
      updates.items = fullItems;
      updates.subtotal = subtotal;
      updates.grandTotal = subtotal + (data.taxAmount ?? existing.taxAmount);
    }

    if (data.branchId !== undefined) updates.branchId = data.branchId;
    if (data.supplierId !== undefined) updates.supplierId = data.supplierId;
    if (data.taxAmount !== undefined) updates.taxAmount = data.taxAmount;
    if (data.note !== undefined) updates.note = data.note;

    updates.updatedAt = new Date().toISOString();

    const updated = await repositories.purchaseOrder.update(poId, updates);
    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update purchase order" } as PurchasingServiceError;
    }
    return updated;
  }

  static async receivePurchaseOrder(poId: string, input: ReceivePurchaseOrderInput): Promise<PurchaseOrder> {
    const po = await repositories.purchaseOrder.getById(poId);
    if (!po) {
      throw { code: "NOT_FOUND", message: "Purchase order not found" } as PurchasingServiceError;
    }

    if (po.status === "cancelled") {
      throw { code: "INVALID_STATUS", message: "Cannot receive a cancelled purchase order" } as PurchasingServiceError;
    }

    if (po.status === "received") {
      throw { code: "ALREADY_RECEIVED", message: "Purchase order has already been fully received" } as PurchasingServiceError;
    }

    const receivedMap = new Map(input.receivedItems.map((r) => [r.itemId, r.quantity]));

    let totalReceivedQuantity = 0;
    let allReceived = true;

    for (const item of po.items) {
      const receivedQty = receivedMap.get(item.id) ?? 0;
      if (receivedQty > item.quantity) {
        throw { code: "INVALID_QUANTITY", message: `Received quantity for ${item.variantName} exceeds ordered quantity` } as PurchasingServiceError;
      }
      totalReceivedQuantity += receivedQty;
      if (receivedQty < item.quantity) {
        allReceived = false;
      }
    }

    if (totalReceivedQuantity === 0) {
      throw { code: "NO_ITEMS", message: "No items were received" } as PurchasingServiceError;
    }

    for (const item of po.items) {
      const receivedQty = receivedMap.get(item.id);
      if (!receivedQty || receivedQty <= 0) continue;

      await InventoryService.adjustStock(
        item.productVariantId,
        po.branchId,
        receivedQty,
        "purchase",
        input.receivedBy,
        po.id,
        `Received from PO ${po.poNumber}`
      );
    }

    const supplier = await repositories.supplier.getById(po.supplierId);
    if (supplier) {
      await SupplierService.updateSupplier(po.supplierId, {
        currentBalance: supplier.currentBalance + po.grandTotal,
      });
    }

    const newStatus = allReceived ? "received" : "partial";

    const updated = await repositories.purchaseOrder.update(poId, {
      status: newStatus,
      receivedBy: input.receivedBy,
      receivedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update purchase order after receiving" } as PurchasingServiceError;
    }

    return updated;
  }

  static async cancelPurchaseOrder(poId: string): Promise<PurchaseOrder> {
    const existing = await repositories.purchaseOrder.getById(poId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Purchase order not found" } as PurchasingServiceError;
    }

    if (existing.status === "received") {
      throw { code: "INVALID_STATUS", message: "Cannot cancel a received purchase order" } as PurchasingServiceError;
    }

    if (existing.status === "cancelled") {
      throw { code: "ALREADY_CANCELLED", message: "Purchase order is already cancelled" } as PurchasingServiceError;
    }

    const updated = await repositories.purchaseOrder.update(poId, {
      status: "cancelled",
    });

    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to cancel purchase order" } as PurchasingServiceError;
    }
    return updated;
  }
}
