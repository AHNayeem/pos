"use client";

import React, { useState, useTransition } from "react";
import { BusinessService } from "@/services";
import type { Business } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

interface BusinessSettingsFormProps {
  initialData: Business;
}

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "restaurant", label: "Restaurant" },
  { value: "grocery", label: "Grocery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "other", label: "Other" },
];

export default function BusinessSettingsForm({ initialData }: BusinessSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: initialData.name,
    type: initialData.type,
    address: initialData.address,
    phone: initialData.phone,
    email: initialData.email,
    currency: initialData.currency,
    taxId: initialData.taxId || "",
    logoUrl: initialData.logoUrl || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await BusinessService.updateBusiness(initialData.id, {
          name: formData.name,
          type: formData.type,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          currency: formData.currency,
          taxId: formData.taxId || undefined,
          logoUrl: formData.logoUrl || undefined,
        });
        addToast("Business settings updated successfully", "success");
      } catch {
        addToast("Failed to update business settings", "error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Business Profile</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Business Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
          <Input
            type="text"
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="taxId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
          <Input
            type="text"
            id="taxId"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="logoUrl" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
          <Input
            type="text"
            id="logoUrl"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
