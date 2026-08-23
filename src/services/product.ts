import { repositories } from "@/repositories";
import type { Product, ProductVariant } from "@/domain/types";

type ProductServiceError = { code: string; message: string };

export class ProductService {
  static async getProducts(filters?: { categoryId?: string; brandId?: string; search?: string }) {
    return repositories.product.getAll(filters);
  }

  static async getProduct(productId: string): Promise<Product | null> {
    return repositories.product.getById(productId);
  }

  static async createProduct(input: {
    name: string;
    description?: string;
    categoryId: string;
    brandId: string;
    imageUrl?: string;
    variants: ProductVariant[];
    isActive: boolean;
  }): Promise<Product> {
    const existing = await repositories.product.getAll({ search: input.name });
    if (existing.some((p) => p.name.toLowerCase() === input.name.toLowerCase())) {
      throw { code: "DUPLICATE_NAME", message: "A product with this name already exists" } as ProductServiceError;
    }
    return repositories.product.create(input);
  }

  static async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const updated = await repositories.product.update(productId, data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "Product not found" } as ProductServiceError;
    }
    return updated;
  }

  static async archiveProduct(productId: string): Promise<void> {
    await repositories.product.archive(productId);
  }
}
