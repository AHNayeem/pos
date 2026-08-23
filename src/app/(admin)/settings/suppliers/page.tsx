import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SupplierService } from "@/services";
import SupplierManagement from "@/components/settings/SupplierManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Supplier Management | FoodOra POS",
  description: "Manage suppliers, balances, and vendor information",
};

export default async function SuppliersPage() {
  const suppliers = await SupplierService.getSuppliers();

  return (
    <ProtectedRoute requiredPermission="suppliers.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Supplier Management" />
        <SupplierManagement initialSuppliers={suppliers} />
      </div>
    </ProtectedRoute>
  );
}
