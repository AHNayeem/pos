"use client";

import React, { useState, useTransition, useMemo } from "react";
import { StoreCreditService } from "@/services";
import type { StoreCreditTransaction } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface StoreCreditManagementProps {
  initialTransactions: StoreCreditTransaction[];
}

type StoreCreditFormData = {
  customerId: string;
  amount: string;
  note: string;
  reference: string;
};

const emptyForm: StoreCreditFormData = {
  customerId: "",
  amount: "",
  note: "",
  reference: "",
};

const STORE_CREDIT_TYPES: StoreCreditTransaction["type"][] = ["issued", "redeemed", "adjusted", "expired"];

export default function StoreCreditManagement({ initialTransactions }: StoreCreditManagementProps) {
  const [transactions, setTransactions] = useState<StoreCreditTransaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<StoreCreditFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!transaction.customerId.toLowerCase().includes(q) && !transaction.note?.toLowerCase().includes(q) && !transaction.reference?.toLowerCase().includes(q) && !transaction.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterType !== "all" && transaction.type !== filterType) {
        return false;
      }
      return true;
    });
  }, [transactions, searchQuery, filterType]);

  const openCreate = () => {
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          addToast("Please enter a valid amount.", "error");
          return;
        }
        const created = await StoreCreditService.issueStoreCredit({
          customerId: formData.customerId,
          amount,
          note: formData.note || undefined,
          reference: formData.reference || undefined,
        });
        setTransactions((prev) => [created, ...prev]);
        addToast("Store credit issued successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to issue store credit. Please check the form.", "error");
      }
    });
  };

  const getTypeBadgeColor = (type: StoreCreditTransaction["type"]) => {
    switch (type) {
      case "issued":
        return "success";
      case "redeemed":
        return "primary";
      case "adjusted":
        return "warning";
      case "expired":
        return "error";
      default:
        return "light";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Store Credit</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage store credit transactions</p>
        </div>
        <Button onClick={openCreate}>Issue Credit</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by customer ID, note, or reference..."
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
            {STORE_CREDIT_TYPES.map((type) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No store credit transactions found. Issue your first credit to get started.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transaction.customerId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getTypeBadgeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm font-semibold ${transaction.type === "redeemed" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {transaction.type === "redeemed" ? "-" : "+"}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transaction.note || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transaction.reference || "—"}
                    </td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Issue Store Credit</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customerId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer ID</label>
              <Input
                type="text"
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                placeholder="e.g. cust-1"
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step={0.01}
                placeholder="e.g. 500"
                required
              />
            </div>
            <div>
              <label htmlFor="reference" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
              <Input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="e.g. INV-12345"
              />
            </div>
            <div>
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="Optional note"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Issuing..." : "Issue Credit"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
