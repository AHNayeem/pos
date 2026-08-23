import { repositories } from "@/repositories";
import type { Category } from "@/domain/types";

type CategoryServiceError = { code: string; message: string };

export class CategoryService {
  static async getCategories() {
    return repositories.category.getAll();
  }

  static async getCategory(categoryId: string): Promise<Category | null> {
    return repositories.category.getById(categoryId);
  }

  static async createCategory(input: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const existing = await repositories.category.getAll();
    if (existing.some((c) => c.name.toLowerCase() === input.name.toLowerCase())) {
      throw { code: "DUPLICATE_NAME", message: "A category with this name already exists" } as CategoryServiceError;
    }
    return repositories.category.create(input);
  }

  static async updateCategory(categoryId: string, data: Partial<Category>): Promise<Category> {
    const updated = await repositories.category.update(categoryId, data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "Category not found" } as CategoryServiceError;
    }
    return updated;
  }

  static async archiveCategory(categoryId: string): Promise<void> {
    await repositories.category.archive(categoryId);
  }
}
