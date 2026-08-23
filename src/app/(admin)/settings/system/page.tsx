import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SystemSettingsService } from "@/services";
import SystemSettingsManagement from "@/components/settings/SystemSettingsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "System Settings | FoodOra POS",
  description: "POS and system configuration",
};

export default async function SystemSettingsPage() {
  const settings = await SystemSettingsService.getSettings();

  return (
    <ProtectedRoute requiredPermission="systemSettings.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="System Settings" />
        <SystemSettingsManagement initialSettings={settings} />
      </div>
    </ProtectedRoute>
  );
}
