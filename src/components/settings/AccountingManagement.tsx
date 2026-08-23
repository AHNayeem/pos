"use client";

import React, { useState, useTransition, useMemo } from "react";
import { AccountingService } from "@/services";
import type { Account, Transaction, AccountType, TransactionType, TransactionReferenceType } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface AccountingManagementProps {
  initialAccounts: Account[];
  initialTransactions: Transaction[];
  initialReceivableSummary: { totalAccounts: number; totalReceivable: number; accounts: { id: string; name: string; branchId: string; balance: number }[] };
  initialPayableSummary: { totalAccounts: number; totalPayable: number; accounts: { id: string; name: string; branchId: string; balance: number }[] };
  initialCashSummary: { totalAccounts: number; totalCash: number; accounts: { id: string; name: string; branchId: string; balance: number }[] };
  initialBankSummary: { totalAccounts: number; totalBank: number; accounts: { id: string; name: string; branchId: string; balance: number }[] };
}

type AccountFormData = {
  name: string;
  type: AccountType;
  branchId: string;
  balance: string;
  isActive: boolean;
};

type TransactionFormData = {
  accountId: string;
  type: TransactionType;
  amount: string;
  referenceId: string;
  referenceType: Transaction["referenceType"];
  note: string;
  actorId: string;
};

const emptyAccountForm: AccountFormData = {
  name: "",
  type: "cash",
  branchId: "",
  balance: "0",
  isActive: true,
};

const emptyTransactionForm: TransactionFormData = {
  accountId: "",
  type: "credit",
  amount: "",
  referenceId: "",
  referenceType: "order",
  note: "",
  actorId: "",
};

const ACCOUNT_TYPES: AccountType[] = ["receivable", "payable", "cash", "bank"];
const TRANSACTION_TYPES: TransactionType[] = ["debit", "credit"];
const TRANSACTION_REFERENCE_TYPES: TransactionReferenceType[] = ["order", "payment", "expense", "transfer", "adjustment", "opening_balance"];

type TabType = "accounts" | "transactions" | "summary";

export default function AccountingManagement({
  initialAccounts,
  initialTransactions,
  initialReceivableSummary,
  initialPayableSummary,
  initialCashSummary,
  initialBankSummary,
}: AccountingManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>("accounts");
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [receivableSummary, setReceivableSummary] = useState(initialReceivableSummary);
  const [payableSummary, setPayableSummary] = useState(initialPayableSummary);
  const [cashSummary, setCashSummary] = useState(initialCashSummary);
  const [bankSummary, setBankSummary] = useState(initialBankSummary);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState<AccountFormData>(emptyAccountForm);
  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData>(emptyTransactionForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!account.name.toLowerCase().includes(q) && !account.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterType !== "all" && account.type !== filterType) {
        return false;
      }
      return true;
    });
  }, [accounts, searchQuery, filterType]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!transaction.id.toLowerCase().includes(q) && !transaction.note?.toLowerCase().includes(q) && !transaction.referenceId?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeBadgeColor = (type: AccountType) => {
    switch (type) {
      case "receivable":
        return "primary";
      case "payable":
        return "error";
      case "cash":
        return "success";
      case "bank":
        return "info";
      default:
        return "light";
    }
  };

  const getTransactionTypeBadgeColor = (type: TransactionType) => {
    switch (type) {
      case "debit":
        return "success";
      case "credit":
        return "error";
      default:
        return "light";
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAccountFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransactionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const balance = parseFloat(accountFormData.balance) || 0;
        const created = await AccountingService.createAccount({
          name: accountFormData.name,
          type: accountFormData.type,
          branchId: accountFormData.branchId,
          balance,
          isActive: accountFormData.isActive,
        });
        setAccounts((prev) => [...prev, created]);
        addToast("Account created successfully", "success");
        setIsAccountModalOpen(false);
        setAccountFormData(emptyAccountForm);
      } catch {
        addToast("Failed to create account. Please check the form.", "error");
      }
    });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const amount = parseFloat(transactionFormData.amount);
        if (isNaN(amount) || amount <= 0) {
          addToast("Please enter a valid amount.", "error");
          return;
        }
        const created = await AccountingService.createTransaction({
          accountId: transactionFormData.accountId,
          type: transactionFormData.type,
          amount,
          referenceId: transactionFormData.referenceId || undefined,
          referenceType: transactionFormData.referenceType,
          note: transactionFormData.note || undefined,
          actorId: transactionFormData.actorId,
        });
        setTransactions((prev) => [created, ...prev]);
        const updatedAccount = await AccountingService.getAccount(created.accountId);
        if (updatedAccount) {
          setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
        }
        addToast("Transaction created successfully", "success");
        setIsTransactionModalOpen(false);
        setTransactionFormData(emptyTransactionForm);
      } catch {
        addToast("Failed to create transaction. Please check the form.", "error");
      }
    });
  };

  const refreshSummaries = async () => {
    startTransition(async () => {
      try {
        const [receivable, payable, cash, bank] = await Promise.all([
          AccountingService.getReceivableSummary(),
          AccountingService.getPayableSummary(),
          AccountingService.getCashSummary(),
          AccountingService.getBankSummary(),
        ]);
        setReceivableSummary(receivable);
        setPayableSummary(payable);
        setCashSummary(cash);
        setBankSummary(bank);
        addToast("Summaries refreshed", "success");
      } catch {
        addToast("Failed to refresh summaries", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accounting</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Receivable, payable, cash, and bank management</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "accounts" && (
            <Button onClick={() => { setAccountFormData(emptyAccountForm); setIsAccountModalOpen(true); }}>New Account</Button>
          )}
          {activeTab === "transactions" && (
            <Button onClick={() => { setTransactionFormData(emptyTransactionForm); setIsTransactionModalOpen(true); }}>New Transaction</Button>
          )}
          {activeTab === "summary" && (
            <Button onClick={refreshSummaries} disabled={isPending}>
              {isPending ? "Refreshing..." : "Refresh"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {(["accounts", "transactions", "summary"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No accounts found. Create your first account to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{account.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.name}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge size="sm" color={getAccountTypeBadgeColor(account.type)}>
                            {account.type}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.branchId}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge size="sm" color={account.isActive ? "success" : "error"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Note</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{transaction.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{transaction.accountId}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge size="sm" color={getTransactionTypeBadgeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {transaction.referenceId || "—"}
                          {transaction.referenceType && <span className="ml-1 text-xs text-gray-400">({transaction.referenceType})</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{transaction.note || "—"}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts Receivable</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Money owed to the business</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Receivable</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(receivableSummary.totalReceivable)}</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {receivableSummary.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.branchId}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts Payable</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Money the business owes</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Payable</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(payableSummary.totalPayable)}</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {payableSummary.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.branchId}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash on Hand</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Physical cash available</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Cash</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(cashSummary.totalCash)}</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {cashSummary.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.branchId}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Accounts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Funds held in bank</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Bank Balance</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(bankSummary.totalBank)}</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {bankSummary.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.branchId}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Account</h3>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
              <Input
                type="text"
                id="name"
                name="name"
                value={accountFormData.name}
                onChange={handleAccountChange}
                placeholder="e.g. Cash on Hand"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                id="type"
                name="type"
                value={accountFormData.type}
                onChange={handleAccountChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch ID</label>
              <Input
                type="text"
                id="branchId"
                name="branchId"
                value={accountFormData.branchId}
                onChange={handleAccountChange}
                placeholder="e.g. br-1"
                required
              />
            </div>
            <div>
              <label htmlFor="balance" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
              <Input
                type="number"
                id="balance"
                name="balance"
                value={accountFormData.balance}
                onChange={handleAccountChange}
                min="0"
                step={0.01}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={accountFormData.isActive}
                onChange={handleAccountChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Transaction</h3>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div>
              <label htmlFor="accountId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
              <select
                id="accountId"
                name="accountId"
                value={transactionFormData.accountId}
                onChange={handleTransactionChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                id="type"
                name="type"
                value={transactionFormData.type}
                onChange={handleTransactionChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={transactionFormData.amount}
                onChange={handleTransactionChange}
                min="0"
                step={0.01}
                placeholder="e.g. 1000"
                required
              />
            </div>
            <div>
              <label htmlFor="referenceType" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Type</label>
              <select
                id="referenceType"
                name="referenceType"
                value={transactionFormData.referenceType}
                onChange={handleTransactionChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {TRANSACTION_REFERENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="referenceId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference ID</label>
              <Input
                type="text"
                id="referenceId"
                name="referenceId"
                value={transactionFormData.referenceId}
                onChange={handleTransactionChange}
                placeholder="e.g. ord-1"
              />
            </div>
            <div>
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
              <textarea
                id="note"
                name="note"
                value={transactionFormData.note}
                onChange={handleTransactionChange}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="Optional note"
              />
            </div>
            <div>
              <label htmlFor="actorId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Actor ID</label>
              <Input
                type="text"
                id="actorId"
                name="actorId"
                value={transactionFormData.actorId}
                onChange={handleTransactionChange}
                placeholder="e.g. usr-4"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsTransactionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Transaction"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
