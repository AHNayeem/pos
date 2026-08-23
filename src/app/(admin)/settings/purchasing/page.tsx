import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PurchasingService, BranchService, SupplierService, ProductService } from "@/services";
import PurchasingManagement from "@/components/settings/PurchasingManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Purchasing | FoodOra POS",
  description: "Manage purchase orders, receiving, and supplier payables",
};

export default async function PurchasingPage() {
  const [purchaseOrders, branches, suppliers, products] = await Promise.all([
    PurchasingService.getPurchaseOrders(),
    BranchService.getBranches(),
    SupplierService.getSuppliers(),
    ProductService.getProducts(),
  ]);

  return (
    <ProtectedRoute requiredPermission="purchases.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Purchasing" />
        <PurchasingManagement
          initialPurchaseOrders={purchaseOrders}
          branches={branches}
          suppliers={suppliers}
          products={products}
        />
      </div>
    </ProtectedRoute>
  );
}
