"use client";

import React, { useState, useTransition, useMemo } from "react";
import { PromotionService } from "@/services";
import type { Promotion } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface PromotionsManagementProps {
  initialPromotions: Promotion[];
}

type PromotionFormData = {
  name: string;
  description: string;
  type: Promotion["type"];
  value: string;
  buyQuantity: string;
  getQuantity: string;
  comboProductIds: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyForm: PromotionFormData = {
  name: "",
  description: "",
  type: "percentage",
  value: "",
  buyQuantity: "",
  getQuantity: "",
  comboProductIds: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const PROMOTION_TYPES: Promotion["type"][] = ["percentage", "fixed", "bogo", "combo"];

export default function PromotionsManagement({ initialPromotions }: PromotionsManagementProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!promotion.name.toLowerCase().includes(q) && !promotion.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterActive !== "all") {
        const isActive = filterActive === "active";
        if (promotion.isActive !== isActive) {
          return false;
        }
      }
      return true;
    });
  }, [promotions, searchQuery, filterActive]);

  const openCreate = () => {
    setEditingPromotion(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || "",
      type: promotion.type,
      value: promotion.value !== undefined ? String(promotion.value) : "",
      buyQuantity: promotion.buyQuantity !== undefined ? String(promotion.buyQuantity) : "",
      getQuantity: promotion.getQuantity !== undefined ? String(promotion.getQuantity) : "",
      comboProductIds: promotion.comboProductIds?.join(", ") || "",
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      isActive: promotion.isActive,
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
        const value = formData.value ? parseFloat(formData.value) : undefined;
        if ((formData.type === "percentage" || formData.type === "fixed" || formData.type === "combo") && (value === undefined || value <= 0)) {
          addToast("Please enter a valid promotion value.", "error");
          return;
        }
        if (formData.type === "percentage" && value && value > 100) {
          addToast("Percentage promotion cannot exceed 100%.", "error");
          return;
        }
        if (formData.type === "bogo") {
          if (!formData.buyQuantity || !formData.getQuantity) {
            addToast("BOGO promotions require buy and get quantities.", "error");
            return;
          }
        }
        const data: Partial<Promotion> = {
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          value,
          buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity, 10) : undefined,
          getQuantity: formData.getQuantity ? parseInt(formData.getQuantity, 10) : undefined,
          comboProductIds: formData.comboProductIds ? formData.comboProductIds.split(",").map((id) => id.trim()) : undefined,
          startsAt: formData.startsAt,
          endsAt: formData.endsAt,
          isActive: formData.isActive,
        };
        if (editingPromotion) {
          const updated = await PromotionService.updatePromotion(editingPromotion.id, data);
          if (updated) {
            setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            addToast("Promotion updated successfully", "success");
          } else {
            addToast("Failed to update promotion.", "error");
          }
        } else {
          const created = await PromotionService.createPromotion({
            name: formData.name,
            description: formData.description || undefined,
            type: formData.type,
            value,
            buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity, 10) : undefined,
            getQuantity: formData.getQuantity ? parseInt(formData.getQuantity, 10) : undefined,
            comboProductIds: formData.comboProductIds ? formData.comboProductIds.split(",").map((id) => id.trim()) : undefined,
            startsAt: formData.startsAt,
            endsAt: formData.endsAt,
            isActive: formData.isActive,
          });
          setPromotions((prev) => [...prev, created]);
          addToast("Promotion created successfully", "success");
        }
        setIsModalOpen(false);
        setEditingPromotion(null);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to save promotion. Please check the form.", "error");
      }
    });
  };

  const getTypeBadgeColor = (type: Promotion["type"]) => {
    switch (type) {
      case "percentage":
        return "primary";
      case "fixed":
        return "success";
      case "bogo":
        return "warning";
      case "combo":
        return "info";
      default:
        return "light";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Promotions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage promotions and campaigns</p>
        </div>
        <Button onClick={openCreate}>New Promotion</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name or description..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Starts At</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ends At</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No promotions found. Create your first promotion to get started.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {promotion.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {promotion.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getTypeBadgeColor(promotion.type)}>
                        {promotion.type}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {promotion.type === "bogo" ? `${promotion.buyQuantity} + ${promotion.getQuantity}` : promotion.value !== undefined ? `${promotion.value}${promotion.type === "percentage" ? "%" : ""}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={promotion.isActive ? "success" : "error"}>
                        {promotion.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button variant="outline" size="sm" onClick={() => openEdit(promotion)}>
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
            {editingPromotion ? "Edit Promotion" : "New Promotion"}
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
                  placeholder="e.g. Buy 2 Get 1 Free"
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
                  {PROMOTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description"
                />
              </div>
              {formData.type !== "bogo" && (
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
                   placeholder={formData.type === "percentage" ? "e.g. 10" : "e.g. 50"}
                   required
                   />
                </div>
              )}
              {formData.type === "bogo" && (
                <>
                  <div>
                    <label htmlFor="buyQuantity" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Buy Quantity</label>
                    <Input
                      type="number"
                      id="buyQuantity"
                      name="buyQuantity"
                      value={formData.buyQuantity}
                      onChange={handleChange}
                      min="1"
                      required={formData.type === "bogo"}
                    />
                  </div>
                  <div>
                    <label htmlFor="getQuantity" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Get Quantity</label>
                    <Input
                      type="number"
                      id="getQuantity"
                      name="getQuantity"
                      value={formData.getQuantity}
                      onChange={handleChange}
                      min="1"
                      required={formData.type === "bogo"}
                    />
                  </div>
                </>
              )}
              {formData.type === "combo" && (
                <div className="md:col-span-2">
                  <label htmlFor="comboProductIds" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Combo Product IDs</label>
                  <Input
                    type="text"
                    id="comboProductIds"
                    name="comboProductIds"
                    value={formData.comboProductIds}
                    onChange={handleChange}
                    placeholder="e.g. var-1, var-4"
                  />
                </div>
              )}
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
                {isPending ? "Saving..." : editingPromotion ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
