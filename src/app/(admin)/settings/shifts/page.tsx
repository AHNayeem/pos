import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ShiftService } from "@/services";
import ShiftsManagement from "@/components/settings/ShiftsManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Cash Register & Shifts | FoodOra POS",
  description: "Manage cash register shifts and sessions",
};

export default async function ShiftsPage() {
  const shifts = await ShiftService.getShifts();

  return (
    <ProtectedRoute requiredPermission="shifts.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Cash Register & Shifts" />
        <ShiftsManagement initialShifts={shifts} />
      </div>
    </ProtectedRoute>
  );
}
