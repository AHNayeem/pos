import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PromotionService } from "@/services";
import PromotionsManagement from "@/components/settings/PromotionsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Promotions | FoodOra POS",
  description: "Manage promotions and campaigns",
};

export default async function PromotionsPage() {
  const promotions = await PromotionService.getPromotions();

  return (
    <ProtectedRoute requiredPermission="promotions.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Promotions" />
        <PromotionsManagement initialPromotions={promotions} />
      </div>
    </ProtectedRoute>
  );
}
