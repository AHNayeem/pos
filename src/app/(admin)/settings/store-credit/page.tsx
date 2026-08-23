import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { StoreCreditService } from "@/services";
import StoreCreditManagement from "@/components/settings/StoreCreditManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Store Credit | FoodOra POS",
  description: "Manage store credit transactions",
};

export default async function StoreCreditPage() {
  const transactions = await StoreCreditService.getStoreCreditTransactions();

  return (
    <ProtectedRoute requiredPermission="storeCredit.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Store Credit" />
        <StoreCreditManagement initialTransactions={transactions} />
      </div>
    </ProtectedRoute>
  );
}
