import { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { AccountingService } from "@/services";
import AccountingManagement from "@/components/settings/AccountingManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Accounting | FoodOra POS",
  description: "Receivable, payable, cash, and bank management",
};

export default async function AccountingPage() {
  const [accounts, transactions, receivableSummary, payableSummary, cashSummary, bankSummary] = await Promise.all([
    AccountingService.getAccounts(),
    AccountingService.getTransactions(),
    AccountingService.getReceivableSummary(),
    AccountingService.getPayableSummary(),
    AccountingService.getCashSummary(),
    AccountingService.getBankSummary(),
  ]);

  return (
    <ProtectedRoute requiredPermission="accounting.read">
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Accounting" />
        <AccountingManagement
          initialAccounts={accounts}
          initialTransactions={transactions}
          initialReceivableSummary={receivableSummary}
          initialPayableSummary={payableSummary}
          initialCashSummary={cashSummary}
          initialBankSummary={bankSummary}
        />
      </div>
    </ProtectedRoute>
  );
}
