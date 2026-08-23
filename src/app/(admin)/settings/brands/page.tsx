import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { BrandService } from "@/services";
import BrandManagement from "@/components/settings/BrandManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Brand Management | FoodOra POS",
  description: "Manage product brands",
};

export default async function BrandsPage() {
  const brands = await BrandService.getBrands();

  return (
    <ProtectedRoute requiredPermission="brands.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Brand Management" />
        <BrandManagement initialBrands={brands} />
      </div>
    </ProtectedRoute>
  );
}
