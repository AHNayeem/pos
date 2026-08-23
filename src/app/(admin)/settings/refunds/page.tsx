import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { RefundService } from "@/services";
import RefundsManagement from "@/components/settings/RefundsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Refunds | FoodOra POS",
  description: "Manage refunds",
};

export default async function RefundsPage() {
  const refunds = await RefundService.getRefunds();

  return (
    <ProtectedRoute requiredPermission="refunds.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Refunds" />
        <RefundsManagement initialRefunds={refunds} />
      </div>
    </ProtectedRoute>
  );
}
