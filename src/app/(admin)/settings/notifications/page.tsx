import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { NotificationService } from "@/services";
import NotificationsManagement from "@/components/settings/NotificationsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Notifications | FoodOra POS",
  description: "Manage system notifications and alerts",
};

export default async function NotificationsPage() {
  const notifications = await NotificationService.getNotifications();

  return (
    <ProtectedRoute requiredPermission="notifications.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Notifications" />
        <NotificationsManagement initialNotifications={notifications} />
      </div>
    </ProtectedRoute>
  );
}
