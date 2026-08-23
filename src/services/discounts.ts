import { repositories } from "@/repositories";
import type { Discount } from "@/domain/types";

type DiscountServiceError = { code: string; message: string };

export class DiscountService {
  static async getDiscounts(filters?: { active?: boolean }) {
    const discounts = await repositories.discount.getAll({
      active: filters?.active,
    });
    return discounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getDiscount(discountId: string): Promise<Discount | null> {
    return repositories.discount.getById(discountId);
  }

  static async getDiscountByCode(code: string): Promise<Discount | null> {
    return repositories.discount.getByCode(code);
  }

  static async createDiscount(input: {
    name: string;
    code?: string;
    type: Discount["type"];
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }): Promise<Discount> {
    if (input.value <= 0) {
      throw { code: "INVALID_VALUE", message: "Discount value must be greater than zero" } as DiscountServiceError;
    }
    if (input.type === "percentage" && input.value > 100) {
      throw { code: "INVALID_VALUE", message: "Percentage discount cannot exceed 100%" } as DiscountServiceError;
    }
    return repositories.discount.create({
      name: input.name,
      code: input.code,
      type: input.type,
      value: input.value,
      minPurchase: input.minPurchase,
      maxDiscount: input.maxDiscount,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive ?? true,
    });
  }

  static async updateDiscount(discountId: string, data: Partial<Discount>) {
    const discount = await repositories.discount.getById(discountId);
    if (!discount) {
      throw { code: "NOT_FOUND", message: "Discount not found" } as DiscountServiceError;
    }
    if (data.type === "percentage" && data.value && data.value > 100) {
      throw { code: "INVALID_VALUE", message: "Percentage discount cannot exceed 100%" } as DiscountServiceError;
    }
    return repositories.discount.update(discountId, data);
  }
}
