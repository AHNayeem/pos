import { repositories } from "@/repositories";
import type { Inventory, StockMovementType } from "@/domain/types";

export class InventoryService {
  static async getInventory(filters?: { branchId?: string; productVariantId?: string; lowStock?: boolean }) {
    return repositories.inventory.getAll(filters);
  }

  static async getInventoryItem(variantId: string, branchId: string): Promise<Inventory | null> {
    return repositories.inventory.getByVariant(variantId, branchId);
  }

  static async getStockMovements(filters?: { branchId?: string; productVariantId?: string; type?: string }) {
    return repositories.stockMovement.getAll(filters);
  }

  static async getStockLevel(variantId: string, branchId: string) {
    const inv = await repositories.inventory.getByVariant(variantId, branchId);
    return inv?.quantity ?? 0;
  }

  static async isInStock(variantId: string, branchId: string, quantity: number): Promise<boolean> {
    const stock = await this.getStockLevel(variantId, branchId);
    return stock >= quantity;
  }

  static async adjustStock(variantId: string, branchId: string, quantity: number, type: StockMovementType, actorId: string, referenceId?: string, note?: string): Promise<Inventory> {
    return repositories.inventory.adjustStock(variantId, branchId, quantity, type, actorId, referenceId, note);
  }

  static async getLowStockItems(branchId: string) {
    return repositories.inventory.getAll({ branchId, lowStock: true });
  }
}
