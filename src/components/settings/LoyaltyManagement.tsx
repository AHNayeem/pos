"use client";

import React, { useState, useTransition } from "react";
import { LoyaltyService } from "@/services";
import type { LoyaltySettings } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

interface LoyaltyManagementProps {
  initialSettings: LoyaltySettings | null;
}

type LoyaltyFormData = {
  pointsPerCurrency: string;
  redemptionRate: string;
  expirationDays: string;
  isActive: boolean;
};

const emptyForm: LoyaltyFormData = {
  pointsPerCurrency: "",
  redemptionRate: "",
  expirationDays: "",
  isActive: true,
};

export default function LoyaltyManagement({ initialSettings }: LoyaltyManagementProps) {
  const [formData, setFormData] = useState<LoyaltyFormData>(() => {
    if (!initialSettings) return emptyForm;
    return {
      pointsPerCurrency: String(initialSettings.pointsPerCurrency),
      redemptionRate: String(initialSettings.redemptionRate),
      expirationDays: String(initialSettings.expirationDays),
      isActive: initialSettings.isActive,
    };
  });
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const pointsPerCurrency = parseFloat(formData.pointsPerCurrency);
        const redemptionRate = parseFloat(formData.redemptionRate);
        const expirationDays = parseInt(formData.expirationDays, 10);

        if (isNaN(pointsPerCurrency) || pointsPerCurrency < 0) {
          addToast("Please enter a valid points per currency value.", "error");
          return;
        }
        if (isNaN(redemptionRate) || redemptionRate < 0) {
          addToast("Please enter a valid redemption rate.", "error");
          return;
        }
        if (isNaN(expirationDays) || expirationDays < 0) {
          addToast("Please enter a valid expiration days value.", "error");
          return;
        }

        await LoyaltyService.updateLoyaltySettings({
          pointsPerCurrency,
          redemptionRate,
          expirationDays,
          isActive: formData.isActive,
        });

        addToast("Loyalty settings updated successfully", "success");
      } catch {
        addToast("Failed to update loyalty settings. Please check the form.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Loyalty Program Configuration</h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Configure how customers earn and redeem loyalty points</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="pointsPerCurrency" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Points Per Currency</label>
              <Input
                type="number"
                id="pointsPerCurrency"
                name="pointsPerCurrency"
                value={formData.pointsPerCurrency}
                onChange={handleChange}
                min="0"
                step={0.01}
                placeholder="e.g. 1 (1 point per 1 currency unit)"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Number of points earned per currency unit spent</p>
            </div>
            <div>
              <label htmlFor="redemptionRate" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Redemption Rate</label>
              <Input
                type="number"
                id="redemptionRate"
                name="redemptionRate"
                value={formData.redemptionRate}
                onChange={handleChange}
                min="0"
                step={0.01}
                placeholder="e.g. 100 (100 points = 1 currency unit)"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Points required to redeem 1 currency unit</p>
            </div>
            <div>
              <label htmlFor="expirationDays" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Points Expiration (Days)</label>
              <Input
                type="number"
                id="expirationDays"
                name="expirationDays"
                value={formData.expirationDays}
                onChange={handleChange}
                min="0"
                step={1}
                placeholder="e.g. 365"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Number of days before unused points expire (0 = never expire)</p>
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
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
