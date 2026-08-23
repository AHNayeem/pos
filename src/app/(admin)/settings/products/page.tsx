import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ProductService, CategoryService, BrandService } from "@/services";
import ProductManagement from "@/components/settings/ProductManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Product Management | FoodOra POS",
  description: "Manage products, variants, SKU, and barcode",
};

export default async function ProductsPage() {
  const [products, categories, brands] = await Promise.all([
    ProductService.getProducts(),
    CategoryService.getCategories(),
    BrandService.getBrands(),
  ]);

  return (
    <ProtectedRoute requiredPermission="products.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Product Management" />
        <ProductManagement initialProducts={products} categories={categories} brands={brands} />
      </div>
    </ProtectedRoute>
  );
}
