"use client";

import React, { useState, useTransition, useMemo } from "react";
import { SupplierService } from "@/services";
import type { Supplier } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface SupplierManagementProps {
  initialSuppliers: Supplier[];
}

type SupplierFormData = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  openingBalance: string;
  isActive: boolean;
};

const emptyForm: SupplierFormData = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  openingBalance: "0",
  isActive: true,
};

export default function SupplierManagement({ initialSuppliers }: SupplierManagementProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const { addToast } = useToast();

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!supplier.name.toLowerCase().includes(q) && !supplier.phone.includes(q) && !supplier.email?.toLowerCase().includes(q) && !supplier.contactPerson?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [suppliers, searchQuery]);

  const openCreate = () => {
    setEditingSupplier(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone,
      address: supplier.address,
      taxId: supplier.taxId || "",
      openingBalance: String(supplier.openingBalance),
      isActive: supplier.isActive,
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
        if (editingSupplier) {
          const updated = await SupplierService.updateSupplier(editingSupplier.id, {
            name: formData.name,
            contactPerson: formData.contactPerson || undefined,
            email: formData.email || undefined,
            phone: formData.phone,
            address: formData.address,
            taxId: formData.taxId || undefined,
            openingBalance: parseFloat(formData.openingBalance) || 0,
            isActive: formData.isActive,
          });
          setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          addToast("Supplier updated successfully", "success");
        } else {
          const created = await SupplierService.createSupplier({
            name: formData.name,
            contactPerson: formData.contactPerson || undefined,
            email: formData.email || undefined,
            phone: formData.phone,
            address: formData.address,
            taxId: formData.taxId || undefined,
            openingBalance: parseFloat(formData.openingBalance) || 0,
            isActive: formData.isActive,
          });
          setSuppliers((prev) => [...prev, created]);
          addToast("Supplier created successfully", "success");
        }
        setIsModalOpen(false);
        setFormData(emptyForm);
        setEditingSupplier(null);
      } catch {
        addToast(editingSupplier ? "Failed to update supplier" : "Failed to create supplier", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await SupplierService.archiveSupplier(deleteTarget.id);
        setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        addToast("Supplier deactivated successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to deactivate supplier", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suppliers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your vendor base, balances, and contacts</p>
        </div>
        <Button onClick={openCreate}>Add Supplier</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search suppliers by name, email, phone, or contact..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No suppliers found. Create your first supplier to get started.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {supplier.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.contactPerson || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {supplier.currentBalance.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={supplier.isActive ? "success" : "error"}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(supplier)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {supplier.isActive && (
                        <button
                          onClick={() => setDeleteTarget(supplier)}
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
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingSupplier(null); }} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingSupplier ? "Edit Supplier" : "Create Supplier"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
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
                <label htmlFor="contactPerson" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                <Input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
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
                <label htmlFor="taxId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
                <Input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
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
                <label htmlFor="openingBalance" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Balance</label>
                <Input
                  type="number"
                  id="openingBalance"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleChange}
                  required
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
              <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingSupplier(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Deactivate Supplier</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to deactivate <span className="font-medium">{deleteTarget?.name}</span>? This action can be reversed by editing the supplier.
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
