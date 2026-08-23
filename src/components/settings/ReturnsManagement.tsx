"use client";

import React, { useState, useTransition, useMemo } from "react";
import { ReturnService } from "@/services";
import type { Return } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface ReturnsManagementProps {
  initialReturns: Return[];
}

type ReturnFormData = {
  orderId: string;
  customerId: string;
  items: string;
  reason: string;
};

const emptyForm: ReturnFormData = {
  orderId: "",
  customerId: "",
  items: "",
  reason: "",
};

const RETURN_STATUSES: Return["status"][] = ["pending", "received", "completed", "cancelled"];

export default function ReturnsManagement({ initialReturns }: ReturnsManagementProps) {
  const [returns, setReturns] = useState<Return[]>(initialReturns);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReturnFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredReturns = useMemo(() => {
    return returns.filter((returnRecord) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!returnRecord.orderId.toLowerCase().includes(q) && !returnRecord.customerId.toLowerCase().includes(q) && !returnRecord.reason?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== "all" && returnRecord.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [returns, searchQuery, filterStatus]);

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
        const items = formData.items
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .map((item) => {
            const [variantId, quantity] = item.split(":");
            return { productVariantId: variantId, quantity: parseInt(quantity, 10) };
          });
        if (!items.length) {
          addToast("Please provide at least one item in variantId:quantity format.", "error");
          return;
        }
        const created = await ReturnService.createReturn({
          orderId: formData.orderId,
          customerId: formData.customerId,
          items,
          reason: formData.reason || undefined,
        });
        setReturns((prev) => [created, ...prev]);
        addToast("Return created successfully", "success");
        setIsModalOpen(false);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to create return. Please check the input.", "error");
      }
    });
  };

  const getStatusBadgeColor = (status: Return["status"]) => {
    switch (status) {
      case "pending":
        return "light";
      case "received":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "primary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Returns</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage product returns</p>
        </div>
        <Button onClick={openCreate}>New Return</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by order ID, customer ID, or reason..."
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
            {RETURN_STATUSES.map((status) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Return ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No returns found. Create your first return to get started.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((returnRecord) => (
                  <tr key={returnRecord.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {returnRecord.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {returnRecord.orderId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {returnRecord.customerId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {returnRecord.items.length} item(s)
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getStatusBadgeColor(returnRecord.status)}>
                        {returnRecord.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {returnRecord.reason || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(returnRecord.createdAt).toLocaleDateString()}
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
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Return</h3>
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
              <div className="md:col-span-2">
                <label htmlFor="items" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                <Input
                  type="text"
                  id="items"
                  name="items"
                  value={formData.items}
                  onChange={handleChange}
                  placeholder="var-1:2, var-2:1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Format: variantId:quantity, separated by commas</p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                <Input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Optional return reason"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Return"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
