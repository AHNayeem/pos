import type { Business } from "@/domain/types";
import { repositories } from "@/repositories";

type UpdateBusinessInput = {
  name?: string;
  type?: Business["type"];
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  taxId?: string;
  logoUrl?: string;
};

type BusinessServiceError = {
  code: "NOT_FOUND" | "UPDATE_FAILED";
  message: string;
};

export class BusinessService {
  static async getBusiness(businessId: string): Promise<Business | null> {
    return repositories.business.getById(businessId);
  }

  static async updateBusiness(
    businessId: string,
    data: UpdateBusinessInput
  ): Promise<Business> {
    const updated = await repositories.business.update(businessId, data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "Business not found" } as BusinessServiceError;
    }
    return updated;
  }
}
