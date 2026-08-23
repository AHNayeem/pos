import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SaleService } from "@/services";
import SalesManagement from "@/components/settings/SalesManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Sales & Invoice | FoodOra POS",
  description: "Manage sales and invoices",
};

export default async function SalesPage() {
  const sales = await SaleService.getSales();

  return (
    <ProtectedRoute requiredPermission="sales.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Sales & Invoice" />
        <SalesManagement initialSales={sales} />
      </div>
    </ProtectedRoute>
  );
}
