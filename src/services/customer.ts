import { repositories } from "@/repositories";
import type { Customer } from "@/domain/types";

type CustomerServiceError = { code: string; message: string };

export class CustomerService {
  static async getCustomers(filters?: { search?: string }) {
    return repositories.customer.getAll(filters);
  }

  static async getCustomer(customerId: string): Promise<Customer | null> {
    return repositories.customer.getById(customerId);
  }

  static async createCustomer(input: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    taxId?: string;
    openingBalance: number;
    loyaltyPoints?: number;
    isActive: boolean;
  }): Promise<Customer> {
    const existing = await repositories.customer.getAll({ search: input.name });
    if (existing.some((c) => c.name.toLowerCase() === input.name.toLowerCase())) {
      throw { code: "DUPLICATE_NAME", message: "A customer with this name already exists" } as CustomerServiceError;
    }
    return repositories.customer.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      taxId: input.taxId,
      openingBalance: input.openingBalance,
      currentBalance: input.openingBalance,
      loyaltyPoints: input.loyaltyPoints ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  static async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer> {
    const existing = await repositories.customer.getById(customerId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Customer not found" } as CustomerServiceError;
    }
    const updated = await repositories.customer.update(customerId, data);
    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update customer" } as CustomerServiceError;
    }
    return updated;
  }

  static async archiveCustomer(customerId: string): Promise<void> {
    const existing = await repositories.customer.getById(customerId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Customer not found" } as CustomerServiceError;
    }
    await repositories.customer.archive(customerId);
  }
}
