import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { AuditService } from "@/services";
import AuditManagement from "@/components/settings/AuditManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Audit Log | FoodOra POS",
  description: "Activity and audit trail",
};

export default async function AuditPage() {
  const logs = await AuditService.getAuditLogs();

  return (
    <ProtectedRoute requiredPermission="audit.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Audit Log" />
        <AuditManagement initialLogs={logs} />
      </div>
    </ProtectedRoute>
  );
}
