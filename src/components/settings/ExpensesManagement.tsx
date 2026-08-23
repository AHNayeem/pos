"use client";

import React, { useState, useTransition, useMemo } from "react";
import { ExpenseService } from "@/services";
import type { Expense } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface ExpensesManagementProps {
  initialExpenses: Expense[];
}

type ExpenseFormData = {
  branchId: string;
  category: string;
  amount: string;
  note: string;
  reference: string;
  actorId: string;
};

const emptyForm: ExpenseFormData = {
  branchId: "",
  category: "",
  amount: "",
  note: "",
  reference: "",
  actorId: "",
};

const EXPENSE_CATEGORIES = ["Utilities", "Salary", "Rent", "Supplies", "Maintenance", "Marketing", "Transport", "Other"];

export default function ExpensesManagement({ initialExpenses }: ExpensesManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const categories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!expense.category.toLowerCase().includes(q) && !expense.note?.toLowerCase().includes(q) && !expense.reference?.toLowerCase().includes(q) && !expense.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterCategory !== "all" && expense.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [expenses, searchQuery, filterCategory]);

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
        const created = await ExpenseService.createExpense({
          branchId: formData.branchId,
          category: formData.category,
          amount,
          note: formData.note || undefined,
          reference: formData.reference || undefined,
          actorId: formData.actorId,
        });
        setExpenses((prev) => [created, ...prev]);
        addToast("Expense created successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to create expense. Please check the form.", "error");
      }
    });
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage expenses and cost tracking</p>
        </div>
        <Button onClick={openCreate}>New Expense</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by category, note, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No expenses found. Create your first expense to get started.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {expense.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {expense.branchId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color="primary">
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {expense.note || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {expense.reference || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch ID</label>
                <Input
                  type="text"
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  placeholder="e.g. br-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
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
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step={0.01}
                  placeholder="e.g. 5000"
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
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
                <label htmlFor="actorId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Actor ID</label>
                <Input
                  type="text"
                  id="actorId"
                  name="actorId"
                  value={formData.actorId}
                  onChange={handleChange}
                  placeholder="e.g. usr-2"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Expense"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
