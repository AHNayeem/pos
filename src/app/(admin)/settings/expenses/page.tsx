import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { ExpenseService } from "@/services";
import ExpensesManagement from "@/components/settings/ExpensesManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Expenses | FoodOra POS",
  description: "Manage expenses and cost tracking",
};

export default async function ExpensesPage() {
  const expenses = await ExpenseService.getExpenses();

  return (
    <ProtectedRoute requiredPermission="expenses.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Expenses" />
        <ExpensesManagement initialExpenses={expenses} />
      </div>
    </ProtectedRoute>
  );
}
