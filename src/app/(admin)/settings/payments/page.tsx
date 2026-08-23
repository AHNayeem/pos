import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PaymentService } from "@/services";
import PaymentManagement from "@/components/settings/PaymentManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Payment Management | FoodOra POS",
  description: "Manage payments, transactions, and refunds",
};

export default async function PaymentsPage() {
  const payments = await PaymentService.getPayments();

  return (
    <ProtectedRoute requiredPermission="payments.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Payment Management" />
        <PaymentManagement initialPayments={payments} />
      </div>
    </ProtectedRoute>
  );
}
