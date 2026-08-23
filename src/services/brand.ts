import { repositories } from "@/repositories";
import type { Brand } from "@/domain/types";

type BrandServiceError = { code: string; message: string };

export class BrandService {
  static async getBrands() {
    return repositories.brand.getAll();
  }

  static async getBrand(brandId: string): Promise<Brand | null> {
    return repositories.brand.getById(brandId);
  }

  static async createBrand(input: Omit<Brand, "id" | "createdAt" | "updatedAt">): Promise<Brand> {
    const existing = await repositories.brand.getAll();
    if (existing.some((b) => b.name.toLowerCase() === input.name.toLowerCase())) {
      throw { code: "DUPLICATE_NAME", message: "A brand with this name already exists" } as BrandServiceError;
    }
    return repositories.brand.create(input);
  }

  static async updateBrand(brandId: string, data: Partial<Brand>): Promise<Brand> {
    const updated = await repositories.brand.update(brandId, data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "Brand not found" } as BrandServiceError;
    }
    return updated;
  }

  static async archiveBrand(brandId: string): Promise<void> {
    await repositories.brand.archive(brandId);
  }
}
