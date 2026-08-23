"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TaxService } from "@/services";
import type { Tax } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface TaxesManagementProps {
  initialTaxes: Tax[];
}

type TaxFormData = {
  name: string;
  rate: string;
  type: Tax["type"];
  isActive: boolean;
};

const emptyForm: TaxFormData = {
  name: "",
  rate: "",
  type: "percentage",
  isActive: true,
};

const TAX_TYPES: Tax["type"][] = ["percentage", "fixed"];

export default function TaxesManagement({ initialTaxes }: TaxesManagementProps) {
  const [taxes, setTaxes] = useState<Tax[]>(initialTaxes);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState<TaxFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredTaxes = useMemo(() => {
    return taxes.filter((tax) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!tax.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterActive !== "all") {
        const isActive = filterActive === "active";
        if (tax.isActive !== isActive) {
          return false;
        }
      }
      return true;
    });
  }, [taxes, searchQuery, filterActive]);

  const openCreate = () => {
    setEditingTax(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (tax: Tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: String(tax.rate),
      type: tax.type,
      isActive: tax.isActive,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const rate = formData.rate ? parseFloat(formData.rate) : undefined;
        if (!formData.name.trim()) {
          addToast("Please enter a tax name.", "error");
          return;
        }
        if (rate === undefined || rate < 0) {
          addToast("Please enter a valid tax rate.", "error");
          return;
        }
        if (formData.type === "percentage" && rate > 100) {
          addToast("Percentage tax rate cannot exceed 100%.", "error");
          return;
        }
        const data: Partial<Tax> = {
          name: formData.name.trim(),
          rate,
          type: formData.type,
          isActive: formData.isActive,
        };
        if (editingTax) {
          const updated = await TaxService.updateTax(editingTax.id, data);
          if (updated) {
            setTaxes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            addToast("Tax updated successfully", "success");
          } else {
            addToast("Failed to update tax.", "error");
          }
        } else {
          const created = await TaxService.createTax({
            name: formData.name.trim(),
            rate,
            type: formData.type,
            isActive: formData.isActive,
          });
          setTaxes((prev) => [...prev, created]);
          addToast("Tax created successfully", "success");
        }
        setIsModalOpen(false);
        setEditingTax(null);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to save tax. Please check the form.", "error");
      }
    });
  };

  const getTypeBadgeColor = (type: Tax["type"]) => {
    switch (type) {
      case "percentage":
        return "primary";
      case "fixed":
        return "success";
      default:
        return "light";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Taxes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage tax rates and configurations</p>
        </div>
        <Button onClick={openCreate}>New Tax</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No taxes found. Create your first tax to get started.
                  </td>
                </tr>
              ) : (
                filteredTaxes.map((tax) => (
                  <tr key={tax.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {tax.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getTypeBadgeColor(tax.type)}>
                        {tax.type}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {tax.type === "percentage" ? `${tax.rate}%` : `Fixed: ${tax.rate}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={tax.isActive ? "success" : "error"}>
                        {tax.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button variant="outline" size="sm" onClick={() => openEdit(tax)}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingTax ? "Edit Tax" : "New Tax"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. VAT 5%"
                required
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
                {TAX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rate</label>
              <Input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                min="0"
                step={0.01}
                placeholder={formData.type === "percentage" ? "e.g. 5" : "e.g. 10"}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingTax ? "Update Tax" : "Create Tax"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
