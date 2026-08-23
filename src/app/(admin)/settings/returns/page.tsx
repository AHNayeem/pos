import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ReturnService } from "@/services";
import ReturnsManagement from "@/components/settings/ReturnsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Returns | FoodOra POS",
  description: "Manage returns",
};

export default async function ReturnsPage() {
  const returns = await ReturnService.getReturns();

  return (
    <ProtectedRoute requiredPermission="returns.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Returns" />
        <ReturnsManagement initialReturns={returns} />
      </div>
    </ProtectedRoute>
  );
}
