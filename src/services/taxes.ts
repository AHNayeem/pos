import { repositories } from "@/repositories";
import type { Tax } from "@/domain/types";

type TaxServiceError = { code: string; message: string };

export class TaxService {
  static async getTaxes(filters?: { active?: boolean }) {
    const taxes = await repositories.tax.getAll({
      active: filters?.active,
    });
    return taxes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getTax(taxId: string): Promise<Tax | null> {
    return repositories.tax.getById(taxId);
  }

  static async createTax(input: {
    name: string;
    rate: number;
    type: Tax["type"];
    isActive?: boolean;
  }): Promise<Tax> {
    if (!input.name || input.name.trim() === "") {
      throw { code: "INVALID_NAME", message: "Tax name is required" } as TaxServiceError;
    }
    if (input.rate === undefined || input.rate === null || input.rate < 0) {
      throw { code: "INVALID_RATE", message: "Tax rate must be a non-negative number" } as TaxServiceError;
    }
    if (input.type === "percentage" && input.rate > 100) {
      throw { code: "INVALID_RATE", message: "Percentage tax rate cannot exceed 100%" } as TaxServiceError;
    }
    return repositories.tax.create({
      name: input.name.trim(),
      rate: input.rate,
      type: input.type,
      isActive: input.isActive ?? true,
    });
  }

  static async updateTax(taxId: string, data: Partial<Tax>) {
    const tax = await repositories.tax.getById(taxId);
    if (!tax) {
      throw { code: "NOT_FOUND", message: "Tax not found" } as TaxServiceError;
    }
    if (data.name !== undefined && (!data.name || data.name.trim() === "")) {
      throw { code: "INVALID_NAME", message: "Tax name is required" } as TaxServiceError;
    }
    if (data.rate !== undefined && data.rate < 0) {
      throw { code: "INVALID_RATE", message: "Tax rate must be a non-negative number" } as TaxServiceError;
    }
    if (data.type === "percentage" && data.rate !== undefined && data.rate > 100) {
      throw { code: "INVALID_RATE", message: "Percentage tax rate cannot exceed 100%" } as TaxServiceError;
    }
    return repositories.tax.update(taxId, data);
  }
}
