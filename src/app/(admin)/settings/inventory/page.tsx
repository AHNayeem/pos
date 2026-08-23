import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { InventoryService, BranchService, ProductService } from "@/services";
import InventoryManagement from "@/components/settings/InventoryManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Inventory Management | FoodOra POS",
  description: "Manage stock levels, adjustments, and movements",
};

export default async function InventoryPage() {
  const [inventory, movements, branches, products] = await Promise.all([
    InventoryService.getInventory(),
    InventoryService.getStockMovements(),
    BranchService.getBranches(),
    ProductService.getProducts(),
  ]);

  return (
    <ProtectedRoute requiredPermission="inventory.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Inventory Management" />
        <InventoryManagement 
          initialInventory={inventory} 
          initialMovements={movements}
          branches={branches}
          products={products}
        />
      </div>
    </ProtectedRoute>
  );
}
