import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { StockTransferService } from "@/services";
import StockTransfersManagement from "@/components/settings/StockTransfersManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Stock Transfers | FoodOra POS",
  description: "Manage branch-to-branch stock transfers",
};

export default async function StockTransfersPage() {
  const transfers = await StockTransferService.getStockTransfers();

  return (
    <ProtectedRoute requiredPermission="stockTransfers.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Stock Transfers" />
        <StockTransfersManagement initialTransfers={transfers} />
      </div>
    </ProtectedRoute>
  );
}
