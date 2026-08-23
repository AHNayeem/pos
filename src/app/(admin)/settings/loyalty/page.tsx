import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { LoyaltyService } from "@/services";
import LoyaltyManagement from "@/components/settings/LoyaltyManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Loyalty | FoodOra POS",
  description: "Manage loyalty program settings",
};

export default async function LoyaltyPage() {
  const settings = await LoyaltyService.getLoyaltySettings();

  return (
    <ProtectedRoute requiredPermission="loyalty.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Loyalty" />
        <LoyaltyManagement initialSettings={settings} />
      </div>
    </ProtectedRoute>
  );
}
