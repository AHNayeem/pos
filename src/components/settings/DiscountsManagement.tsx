"use client";

import React, { useState, useTransition, useMemo } from "react";
import { DiscountService } from "@/services";
import type { Discount } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface DiscountsManagementProps {
  initialDiscounts: Discount[];
}

type DiscountFormData = {
  name: string;
  code: string;
  type: Discount["type"];
  value: string;
  minPurchase: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyForm: DiscountFormData = {
  name: "",
  code: "",
  type: "percentage",
  value: "",
  minPurchase: "",
  maxDiscount: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const DISCOUNT_TYPES: Discount["type"][] = ["percentage", "fixed"];

export default function DiscountsManagement({ initialDiscounts }: DiscountsManagementProps) {
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((discount) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!discount.name.toLowerCase().includes(q) && !discount.code?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterActive !== "all") {
        const isActive = filterActive === "active";
        if (discount.isActive !== isActive) {
          return false;
        }
      }
      return true;
    });
  }, [discounts, searchQuery, filterActive]);

  const openCreate = () => {
    setEditingDiscount(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      code: discount.code || "",
      type: discount.type,
      value: String(discount.value),
      minPurchase: discount.minPurchase !== undefined ? String(discount.minPurchase) : "",
      maxDiscount: discount.maxDiscount !== undefined ? String(discount.maxDiscount) : "",
      startsAt: discount.startsAt || "",
      endsAt: discount.endsAt || "",
      isActive: discount.isActive,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const value = parseFloat(formData.value);
        if (isNaN(value) || value <= 0) {
          addToast("Please enter a valid discount value.", "error");
          return;
        }
        if (formData.type === "percentage" && value > 100) {
          addToast("Percentage discount cannot exceed 100%.", "error");
          return;
        }
        const data: Partial<Discount> = {
          name: formData.name,
          code: formData.code || undefined,
          type: formData.type,
          value,
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
          startsAt: formData.startsAt || undefined,
          endsAt: formData.endsAt || undefined,
          isActive: formData.isActive,
        };
        if (editingDiscount) {
          const updated = await DiscountService.updateDiscount(editingDiscount.id, data);
          if (updated) {
            setDiscounts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            addToast("Discount updated successfully", "success");
          } else {
            addToast("Failed to update discount.", "error");
          }
        } else {
          const created = await DiscountService.createDiscount({
            name: formData.name,
            code: formData.code || undefined,
            type: formData.type,
            value,
            minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
            maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
            startsAt: formData.startsAt || undefined,
            endsAt: formData.endsAt || undefined,
            isActive: formData.isActive,
          });
          setDiscounts((prev) => [...prev, created]);
          addToast("Discount created successfully", "success");
        }
        setIsModalOpen(false);
        setEditingDiscount(null);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to save discount. Please check the form.", "error");
      }
    });
  };

  const getTypeBadgeColor = (type: Discount["type"]) => {
    switch (type) {
      case "percentage":
        return "primary";
      case "fixed":
        return "success";
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Discounts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage discount codes and offers</p>
        </div>
        <Button onClick={openCreate}>New Discount</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Min Purchase</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Max Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No discounts found. Create your first discount to get started.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => (
                  <tr key={discount.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {discount.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {discount.code || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getTypeBadgeColor(discount.type)}>
                        {discount.type}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {discount.type === "percentage" ? `${discount.value}%` : formatCurrency(discount.value)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {discount.minPurchase !== undefined ? formatCurrency(discount.minPurchase) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {discount.maxDiscount !== undefined ? formatCurrency(discount.maxDiscount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={discount.isActive ? "success" : "error"}>
                        {discount.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button variant="outline" size="sm" onClick={() => openEdit(discount)}>
                        Edit
                      </Button>
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
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingDiscount ? "Edit Discount" : "New Discount"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. New Year Sale"
                  required
                />
              </div>
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
                <Input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. NEWYEAR25"
                />
              </div>
              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {DISCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="value" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
                <Input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  min="0"
                  step={0.01}
                  placeholder={formData.type === "percentage" ? "e.g. 25" : "e.g. 50"}
                  required
                />
              </div>
              <div>
                <label htmlFor="minPurchase" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Min Purchase</label>
                <Input
                  type="number"
                  id="minPurchase"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  min="0"
                  step={0.01}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="maxDiscount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Max Discount</label>
                <Input
                  type="number"
                  id="maxDiscount"
                  name="maxDiscount"
                  value={formData.maxDiscount}
                  onChange={handleChange}
                  min="0"
                  step={0.01}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Starts At</label>
                <Input
                  type="datetime-local"
                  id="startsAt"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ends At</label>
                <Input
                  type="datetime-local"
                  id="endsAt"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingDiscount ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
