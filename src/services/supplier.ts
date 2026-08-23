import { repositories } from "@/repositories";
import type { Supplier } from "@/domain/types";

type SupplierServiceError = { code: string; message: string };

export class SupplierService {
  static async getSuppliers(filters?: { search?: string }) {
    return repositories.supplier.getAll(filters);
  }

  static async getSupplier(supplierId: string): Promise<Supplier | null> {
    return repositories.supplier.getById(supplierId);
  }

  static async createSupplier(input: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    address: string;
    taxId?: string;
    openingBalance: number;
    isActive: boolean;
  }): Promise<Supplier> {
    const existing = await repositories.supplier.getAll({ search: input.name });
    if (existing.some((s) => s.name.toLowerCase() === input.name.toLowerCase())) {
      throw { code: "DUPLICATE_NAME", message: "A supplier with this name already exists" } as SupplierServiceError;
    }
    return repositories.supplier.create({
      name: input.name,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address,
      taxId: input.taxId,
      openingBalance: input.openingBalance,
      currentBalance: input.openingBalance,
      isActive: input.isActive ?? true,
    });
  }

  static async updateSupplier(supplierId: string, data: Partial<Supplier>): Promise<Supplier> {
    const existing = await repositories.supplier.getById(supplierId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Supplier not found" } as SupplierServiceError;
    }
    const updated = await repositories.supplier.update(supplierId, data);
    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update supplier" } as SupplierServiceError;
    }
    return updated;
  }

  static async archiveSupplier(supplierId: string): Promise<void> {
    const existing = await repositories.supplier.getById(supplierId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Supplier not found" } as SupplierServiceError;
    }
    await repositories.supplier.archive(supplierId);
  }
}
