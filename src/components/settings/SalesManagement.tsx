"use client";

import React, { useState, useTransition, useMemo } from "react";
import { SaleService } from "@/services";
import type { Sale } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface SalesManagementProps {
  initialSales: Sale[];
}

type SaleFormData = {
  orderId: string;
  note: string;
};

const emptyForm: SaleFormData = {
  orderId: "",
  note: "",
};

const SALE_STATUSES: Sale["status"][] = ["draft", "issued", "paid", "overdue", "cancelled"];
const PAYMENT_STATUSES: Sale["paymentStatus"][] = ["pending", "partial", "paid", "failed", "refunded"];

export default function SalesManagement({ initialSales }: SalesManagementProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SaleFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!sale.saleNumber.toLowerCase().includes(q) && !sale.orderId.toLowerCase().includes(q) && !sale.customerName?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== "all" && sale.status !== filterStatus) {
        return false;
      }
      if (filterPaymentStatus !== "all" && sale.paymentStatus !== filterPaymentStatus) {
        return false;
      }
      return true;
    });
  }, [sales, searchQuery, filterStatus, filterPaymentStatus]);

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
        const created = await SaleService.createSale({
          orderId: formData.orderId,
          note: formData.note || undefined,
        });
        setSales((prev) => [created, ...prev]);
        addToast("Sale created successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to create sale. Please check the order ID.", "error");
      }
    });
  };

  const getStatusBadgeColor = (status: Sale["status"]) => {
    switch (status) {
      case "draft":
        return "light";
      case "issued":
        return "info";
      case "paid":
        return "success";
      case "overdue":
        return "error";
      case "cancelled":
        return "warning";
      default:
        return "primary";
    }
  };

  const getPaymentStatusBadgeColor = (status: Sale["paymentStatus"]) => {
    switch (status) {
      case "pending":
        return "light";
      case "partial":
        return "warning";
      case "paid":
        return "success";
      case "failed":
        return "error";
      case "refunded":
        return "info";
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales & Invoice</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage sales invoices</p>
        </div>
        <Button onClick={openCreate}>New Invoice</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by invoice number, order ID, or customer..."
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
            {SALE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((status) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No sales found. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {sale.saleNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {sale.orderId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {sale.customerName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getStatusBadgeColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getPaymentStatusBadgeColor(sale.paymentStatus)}>
                        {sale.paymentStatus}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sale.createdAt).toLocaleDateString()}
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
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Invoice</h3>
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
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <Input
                  type="text"
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Optional invoice note"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
