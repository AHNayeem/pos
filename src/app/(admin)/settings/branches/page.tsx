import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { BranchService } from "@/services";
import BranchManagement from "@/components/settings/BranchManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Branch Management | FoodOra POS",
  description: "Manage business branches",
};

export default async function BranchesPage() {
  const branches = await BranchService.getBranches({ businessId: "biz-1" });

  return (
    <ProtectedRoute requiredPermission="branches.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Branch Management" />
        <BranchManagement initialBranches={branches} businessId="biz-1" />
      </div>
    </ProtectedRoute>
  );
}
