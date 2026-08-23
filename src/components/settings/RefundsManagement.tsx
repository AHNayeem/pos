"use client";

import React, { useState, useTransition, useMemo } from "react";
import { RefundService } from "@/services";
import type { Refund } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface RefundsManagementProps {
  initialRefunds: Refund[];
}

type RefundFormData = {
  orderId: string;
  orderItemId: string;
  productVariantId: string;
  quantity: string;
  amount: string;
  reason: string;
  processedBy: string;
};

const emptyForm: RefundFormData = {
  orderId: "",
  orderItemId: "",
  productVariantId: "",
  quantity: "",
  amount: "",
  reason: "",
  processedBy: "",
};

const REFUND_STATUSES: Refund["status"][] = ["pending", "approved", "rejected", "processed"];

export default function RefundsManagement({ initialRefunds }: RefundsManagementProps) {
  const [refunds, setRefunds] = useState<Refund[]>(initialRefunds);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<RefundFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredRefunds = useMemo(() => {
    return refunds.filter((refund) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!refund.orderId.toLowerCase().includes(q) && !refund.reason?.toLowerCase().includes(q) && !refund.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== "all" && refund.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [refunds, searchQuery, filterStatus]);

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
        const quantity = parseInt(formData.quantity, 10);
        const amount = parseFloat(formData.amount);
        if (isNaN(quantity) || quantity <= 0) {
          addToast("Please enter a valid quantity.", "error");
          return;
        }
        if (isNaN(amount) || amount <= 0) {
          addToast("Please enter a valid amount.", "error");
          return;
        }
        const created = await RefundService.createRefund({
          orderId: formData.orderId,
          orderItemId: formData.orderItemId,
          productVariantId: formData.productVariantId,
          quantity,
          amount,
          reason: formData.reason || undefined,
          processedBy: formData.processedBy || undefined,
        });
        setRefunds((prev) => [created, ...prev]);
        addToast("Refund created successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to create refund. Please check the order ID.", "error");
      }
    });
  };

  const getStatusBadgeColor = (status: Refund["status"]) => {
    switch (status) {
      case "pending":
        return "light";
      case "approved":
        return "info";
      case "rejected":
        return "error";
      case "processed":
        return "success";
      default:
        return "primary";
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Refunds</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage refund requests and processed refunds</p>
        </div>
        <Button onClick={openCreate}>New Refund</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by order ID or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            {REFUND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Refund ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No refunds found. Create your first refund to get started.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {refund.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {refund.orderId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {refund.productVariantId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {refund.quantity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(refund.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getStatusBadgeColor(refund.status)}>
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {refund.reason || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(refund.createdAt).toLocaleDateString()}
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
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Refund</h3>
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
                <label htmlFor="orderItemId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Order Item ID</label>
                <Input
                  type="text"
                  id="orderItemId"
                  name="orderItemId"
                  value={formData.orderItemId}
                  onChange={handleChange}
                  placeholder="e.g. oi-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="productVariantId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Product Variant ID</label>
                <Input
                  type="text"
                  id="productVariantId"
                  name="productVariantId"
                  value={formData.productVariantId}
                  onChange={handleChange}
                  placeholder="e.g. var-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
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
                  required
                />
              </div>
              <div>
                <label htmlFor="processedBy" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Processed By</label>
                <Input
                  type="text"
                  id="processedBy"
                  name="processedBy"
                  value={formData.processedBy}
                  onChange={handleChange}
                  placeholder="Optional processor name"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                <Input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Optional refund reason"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Refund"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
