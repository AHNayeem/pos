"use client";

import React, { useState, useTransition, useMemo } from "react";
import { BrandService } from "@/services";
import type { Brand } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface BrandManagementProps {
  initialBrands: Brand[];
}

type BrandFormData = {
  name: string;
  description: string;
  logoUrl: string;
  isActive: boolean;
};

const emptyForm: BrandFormData = {
  name: "",
  description: "",
  logoUrl: "",
  isActive: true,
};

export default function BrandManagement({ initialBrands }: BrandManagementProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const { addToast } = useToast();

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!brand.name.toLowerCase().includes(q) && !brand.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [brands, searchQuery]);

  const openCreate = () => {
    setEditingBrand(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      isActive: brand.isActive,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (editingBrand) {
          const updated = await BrandService.updateBrand(editingBrand.id, {
            name: formData.name,
            description: formData.description || undefined,
            logoUrl: formData.logoUrl || undefined,
            isActive: formData.isActive,
          });
          setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          addToast("Brand updated successfully", "success");
        } else {
          const created = await BrandService.createBrand({
            name: formData.name,
            description: formData.description || undefined,
            logoUrl: formData.logoUrl || undefined,
            isActive: formData.isActive,
          });
          setBrands((prev) => [...prev, created]);
          addToast("Brand created successfully", "success");
        }
        setIsModalOpen(false);
        setFormData(emptyForm);
        setEditingBrand(null);
      } catch {
        addToast(editingBrand ? "Failed to update brand" : "Failed to create brand", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await BrandService.archiveBrand(deleteTarget.id);
        setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        addToast("Brand deactivated successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to deactivate brand", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brands</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your product brands</p>
        </div>
        <Button onClick={openCreate}>Add Brand</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search brands by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No brands found. Create your first brand to get started.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {brand.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {brand.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={brand.isActive ? "success" : "error"}>
                        {brand.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(brand)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {brand.isActive && (
                        <button
                          onClick={() => setDeleteTarget(brand)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingBrand(null); }} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingBrand ? "Edit Brand" : "Create Brand"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="logoUrl" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
                <Input
                  type="text"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingBrand(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingBrand ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Deactivate Brand</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to deactivate <span className="font-medium">{deleteTarget?.name}</span>? This action can be reversed by editing the brand.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={isPending}>
              {isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
