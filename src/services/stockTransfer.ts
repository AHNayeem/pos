import { repositories } from "@/repositories";
import type { StockTransfer, StockTransferItem } from "@/domain/types";
import { InventoryService } from "./inventory";

type StockTransferServiceError = { code: string; message: string };

export class StockTransferService {
  static async getStockTransfers(filters?: { status?: string; fromBranchId?: string; toBranchId?: string }) {
    const transfers = await repositories.stockTransfer.getAll({
      status: filters?.status,
      fromBranchId: filters?.fromBranchId,
      toBranchId: filters?.toBranchId,
    });
    return transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getStockTransfer(transferId: string): Promise<StockTransfer | null> {
    return repositories.stockTransfer.getById(transferId);
  }

  static async createStockTransfer(input: {
    transferNumber: string;
    fromBranchId: string;
    toBranchId: string;
    items: StockTransferItem[];
    status?: StockTransfer["status"];
    sentBy: string;
    receivedBy?: string;
    receivedAt?: string;
    note?: string;
  }): Promise<StockTransfer> {
    if (!input.items.length) {
      throw { code: "INVALID_INPUT", message: "Transfer must contain at least one item" } as StockTransferServiceError;
    }
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw { code: "INVALID_QUANTITY", message: "Transfer quantity must be greater than zero" } as StockTransferServiceError;
      }
    }
    if (input.fromBranchId === input.toBranchId) {
      throw { code: "INVALID_BRANCH", message: "Source and destination branches must be different" } as StockTransferServiceError;
    }
    return repositories.stockTransfer.create({
      transferNumber: input.transferNumber,
      fromBranchId: input.fromBranchId,
      toBranchId: input.toBranchId,
      items: input.items,
      status: input.status ?? "pending",
      sentBy: input.sentBy,
      receivedBy: input.receivedBy,
      receivedAt: input.receivedAt,
      note: input.note,
    });
  }

  static async updateStockTransfer(transferId: string, data: Partial<StockTransfer>): Promise<StockTransfer | null> {
    const transfer = await repositories.stockTransfer.getById(transferId);
    if (!transfer) {
      throw { code: "NOT_FOUND", message: "Stock transfer not found" } as StockTransferServiceError;
    }
    return repositories.stockTransfer.update(transferId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  static async receiveStockTransfer(transferId: string, receivedBy: string): Promise<StockTransfer> {
    const transfer = await repositories.stockTransfer.getById(transferId);
    if (!transfer) {
      throw { code: "NOT_FOUND", message: "Stock transfer not found" } as StockTransferServiceError;
    }
    if (transfer.status === "completed") {
      throw { code: "INVALID_STATUS", message: "Stock transfer has already been completed" } as StockTransferServiceError;
    }
    if (transfer.status === "cancelled") {
      throw { code: "INVALID_STATUS", message: "Cannot receive a cancelled stock transfer" } as StockTransferServiceError;
    }

    for (const item of transfer.items) {
      await InventoryService.adjustStock(
        item.productVariantId,
        transfer.toBranchId,
        item.quantity,
        "transfer_in",
        receivedBy,
        transfer.id,
        `Stock transfer ${transfer.transferNumber}`
      );
    }

    const updated = await repositories.stockTransfer.update(transferId, {
      status: "completed",
      receivedBy,
      receivedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update stock transfer" } as StockTransferServiceError;
    }

    return updated;
  }
}
