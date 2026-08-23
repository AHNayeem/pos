import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { BusinessService } from "@/services";
import BusinessSettingsForm from "@/components/settings/BusinessSettingsForm";
import { notFound } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Business Settings | FoodOra POS",
  description: "Manage business profile and settings",
};

export default async function BusinessSettingsPage() {
  const business = await BusinessService.getBusiness("biz-1");
  if (!business) {
    notFound();
  }

  return (
    <ProtectedRoute requiredPermission="businesses.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Business Settings" />
        <BusinessSettingsForm initialData={business} />
      </div>
    </ProtectedRoute>
  );
}
