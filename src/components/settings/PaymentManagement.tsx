"use client";

import React, { useState, useTransition, useMemo } from "react";
import { PaymentService } from "@/services";
import type { Payment } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface PaymentManagementProps {
  initialPayments: Payment[];
}

type PaymentFormData = {
  orderId: string;
  method: Payment["method"];
  amount: string;
  reference: string;
  note: string;
};

const emptyForm: PaymentFormData = {
  orderId: "",
  method: "cash",
  amount: "",
  reference: "",
  note: "",
};

const PAYMENT_METHODS: Payment["method"][] = ["cash", "card", "mobile", "credit", "voucher"];

export default function PaymentManagement({ initialPayments }: PaymentManagementProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!payment.orderId.toLowerCase().includes(q) && !payment.reference?.toLowerCase().includes(q) && !payment.note?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterMethod !== "all" && payment.method !== filterMethod) {
        return false;
      }
      return true;
    });
  }, [payments, searchQuery, filterMethod]);

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
          addToast("Please enter a valid payment amount.", "error");
          return;
        }
        const created = await PaymentService.createPayment({
          orderId: formData.orderId,
          method: formData.method,
          amount,
          reference: formData.reference || undefined,
          note: formData.note || undefined,
        });
        setPayments((prev) => [created, ...prev]);
        addToast("Payment recorded successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to record payment. Please check the order ID.", "error");
      }
    });
  };

  const getMethodBadgeColor = (method: Payment["method"]) => {
    switch (method) {
      case "cash":
        return "success";
      case "card":
        return "primary";
      case "mobile":
        return "warning";
      case "credit":
        return "error";
      case "voucher":
        return "info";
      default:
        return "primary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track transactions and payment history</p>
        </div>
        <Button onClick={openCreate}>Record Payment</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by order ID, reference, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No payments found. Record your first payment to get started.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {payment.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {payment.orderId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getMethodBadgeColor(payment.method)}>
                        {payment.method}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {payment.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {payment.reference || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {payment.note || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="orderId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</label>
                <Input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="e.g. ord-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="method" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
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
                  placeholder="e.g. CASH-001, CARD-1234"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <Input
                  type="text"
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Optional payment note"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
