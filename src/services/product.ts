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

    for (const variant of input.variants) {
      const allVariants = await repositories.product.getAll();
      const duplicateSku = allVariants.some((p) => p.variants.some((v) => v.sku === variant.sku));
      if (duplicateSku) {
        throw { code: "DUPLICATE_SKU", message: `SKU ${variant.sku} already exists` } as ProductServiceError;
      }
      if (variant.barcode) {
        const duplicateBarcode = allVariants.some((p) => p.variants.some((v) => v.barcode && v.barcode === variant.barcode));
        if (duplicateBarcode) {
          throw { code: "DUPLICATE_BARCODE", message: `Barcode ${variant.barcode} already exists` } as ProductServiceError;
        }
      }
    }

    return repositories.product.create(input);
  }

  static async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const updated = await repositories.product.update(productId, data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "Product not found" } as ProductServiceError;
    }

    if (data.variants) {
      const allVariants = await repositories.product.getAll();
      const otherProducts = allVariants.filter((p) => p.id !== productId);
      for (const variant of data.variants) {
        const duplicateSku = otherProducts.some((p) => p.variants.some((v) => v.sku === variant.sku));
        if (duplicateSku) {
          throw { code: "DUPLICATE_SKU", message: `SKU ${variant.sku} already exists` } as ProductServiceError;
        }
        if (variant.barcode) {
          const duplicateBarcode = otherProducts.some((p) => p.variants.some((v) => v.barcode && v.barcode === variant.barcode));
          if (duplicateBarcode) {
            throw { code: "DUPLICATE_BARCODE", message: `Barcode ${variant.barcode} already exists` } as ProductServiceError;
          }
        }
      }
    }

    return updated;
  }

  static async archiveProduct(productId: string): Promise<void> {
    await repositories.product.archive(productId);
  }
}
