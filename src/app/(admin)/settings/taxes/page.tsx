import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { TaxService } from "@/services";
import TaxesManagement from "@/components/settings/TaxesManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Taxes | FoodOra POS",
  description: "Manage tax rates and configurations",
};

export default async function TaxesPage() {
  const taxes = await TaxService.getTaxes();

  return (
    <ProtectedRoute requiredPermission="taxes.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Taxes" />
        <TaxesManagement initialTaxes={taxes} />
      </div>
    </ProtectedRoute>
  );
}
