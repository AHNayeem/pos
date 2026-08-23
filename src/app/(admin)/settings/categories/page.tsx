import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { CategoryService } from "@/services";
import CategoryManagement from "@/components/settings/CategoryManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Category Management | FoodOra POS",
  description: "Manage product categories",
};

export default async function CategoriesPage() {
  const categories = await CategoryService.getCategories();

  return (
    <ProtectedRoute requiredPermission="categories.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Category Management" />
        <CategoryManagement initialCategories={categories} />
      </div>
    </ProtectedRoute>
  );
}
