import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ReportService } from "@/services";
import ReportsManagement from "@/components/settings/ReportsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Reports & Analytics | FoodOra POS",
  description: "Sales, inventory, and profit analytics",
};

export default async function ReportsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString();

  const [salesSummary, inventorySummary, profitSummary, topProducts] = await Promise.all([
    ReportService.getSalesSummary("br-1", thirtyDaysAgo, today),
    ReportService.getInventorySummary(),
    ReportService.getProfitSummary("br-1", thirtyDaysAgo, today),
    ReportService.getTopProducts({ limit: 5 }),
  ]);

  return (
    <ProtectedRoute requiredPermission="reports.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Reports & Analytics" />
        <ReportsManagement
          initialSalesSummary={salesSummary}
          initialInventorySummary={inventorySummary}
          initialProfitSummary={profitSummary}
          initialTopProducts={topProducts}
        />
      </div>
    </ProtectedRoute>
  );
}
