import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { CustomerService } from "@/services";
import CustomerManagement from "@/components/settings/CustomerManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Customer Management | FoodOra POS",
  description: "Manage customers, balances, and loyalty points",
};

export default async function CustomersPage() {
  const customers = await CustomerService.getCustomers();

  return (
    <ProtectedRoute requiredPermission="customers.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Customer Management" />
        <CustomerManagement initialCustomers={customers} />
      </div>
    </ProtectedRoute>
  );
}
