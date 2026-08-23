import { repositories } from "@/repositories";
import type { LoyaltySettings } from "@/domain/types";

type LoyaltyServiceError = { code: string; message: string };

export class LoyaltyService {
  static async getLoyaltySettings(): Promise<LoyaltySettings | null> {
    return repositories.loyalty.getSettings();
  }

  static async updateLoyaltySettings(data: Partial<LoyaltySettings>) {
    if (data.pointsPerCurrency !== undefined && data.pointsPerCurrency < 0) {
      throw { code: "INVALID_RATE", message: "Points per currency must be a non-negative number" } as LoyaltyServiceError;
    }
    if (data.redemptionRate !== undefined && data.redemptionRate < 0) {
      throw { code: "INVALID_RATE", message: "Redemption rate must be a non-negative number" } as LoyaltyServiceError;
    }
    if (data.expirationDays !== undefined && data.expirationDays < 0) {
      throw { code: "INVALID_EXPIRATION", message: "Expiration days must be a non-negative number" } as LoyaltyServiceError;
    }
    return repositories.loyalty.updateSettings(data);
  }
}
