import { repositories } from "@/repositories";
import type { Promotion } from "@/domain/types";

type PromotionServiceError = { code: string; message: string };

export class PromotionService {
  static async getPromotions(filters?: { active?: boolean }) {
    const promotions = await repositories.promotion.getAll({
      active: filters?.active,
    });
    return promotions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getPromotion(promotionId: string): Promise<Promotion | null> {
    return repositories.promotion.getById(promotionId);
  }

  static async createPromotion(input: {
    name: string;
    description?: string;
    type: Promotion["type"];
    value?: number;
    buyQuantity?: number;
    getQuantity?: number;
    comboProductIds?: string[];
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
  }): Promise<Promotion> {
    if (input.type === "bogo") {
      if (!input.buyQuantity || !input.getQuantity) {
        throw { code: "INVALID_INPUT", message: "BOGO promotions require buyQuantity and getQuantity" } as PromotionServiceError;
      }
    }
    if ((input.type === "percentage" || input.type === "fixed" || input.type === "combo") && input.value === undefined) {
      throw { code: "INVALID_INPUT", message: "This promotion type requires a value" } as PromotionServiceError;
    }
    if (input.value !== undefined && input.value <= 0) {
      throw { code: "INVALID_VALUE", message: "Promotion value must be greater than zero" } as PromotionServiceError;
    }
    if (input.type === "percentage" && input.value && input.value > 100) {
      throw { code: "INVALID_VALUE", message: "Percentage promotion cannot exceed 100%" } as PromotionServiceError;
    }
    return repositories.promotion.create({
      name: input.name,
      description: input.description,
      type: input.type,
      value: input.value,
      buyQuantity: input.buyQuantity,
      getQuantity: input.getQuantity,
      comboProductIds: input.comboProductIds,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive ?? true,
    });
  }

  static async updatePromotion(promotionId: string, data: Partial<Promotion>) {
    const promotion = await repositories.promotion.getById(promotionId);
    if (!promotion) {
      throw { code: "NOT_FOUND", message: "Promotion not found" } as PromotionServiceError;
    }
    if (data.type === "bogo" && (data.buyQuantity === undefined || data.getQuantity === undefined)) {
      if (!promotion.buyQuantity || !promotion.getQuantity) {
        throw { code: "INVALID_INPUT", message: "BOGO promotions require buyQuantity and getQuantity" } as PromotionServiceError;
      }
    }
    if ((data.type === "percentage" || data.type === "fixed" || data.type === "combo") && data.value === undefined && !promotion.value) {
      throw { code: "INVALID_INPUT", message: "This promotion type requires a value" } as PromotionServiceError;
    }
    if (data.value !== undefined && data.value <= 0) {
      throw { code: "INVALID_VALUE", message: "Promotion value must be greater than zero" } as PromotionServiceError;
    }
    if (data.type === "percentage" && data.value && data.value > 100) {
      throw { code: "INVALID_VALUE", message: "Percentage promotion cannot exceed 100%" } as PromotionServiceError;
    }
    return repositories.promotion.update(promotionId, data);
  }
}
