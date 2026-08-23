import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { DiscountService } from "@/services";
import DiscountsManagement from "@/components/settings/DiscountsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Discounts | FoodOra POS",
  description: "Manage discounts and coupon codes",
};

export default async function DiscountsPage() {
  const discounts = await DiscountService.getDiscounts();

  return (
    <ProtectedRoute requiredPermission="discounts.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Discounts" />
        <DiscountsManagement initialDiscounts={discounts} />
      </div>
    </ProtectedRoute>
  );
}
