"use client";

import React, { useState, useTransition, useMemo } from "react";
import { CustomerService } from "@/services";
import type { Customer } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface CustomerManagementProps {
  initialCustomers: Customer[];
}

type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  openingBalance: string;
  loyaltyPoints: string;
  isActive: boolean;
};

const emptyForm: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  openingBalance: "0",
  loyaltyPoints: "0",
  isActive: true,
};

export default function CustomerManagement({ initialCustomers }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const { addToast } = useToast();

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!customer.name.toLowerCase().includes(q) && !customer.phone.includes(q) && !customer.email?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [customers, searchQuery]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
      taxId: customer.taxId || "",
      openingBalance: String(customer.openingBalance),
      loyaltyPoints: String(customer.loyaltyPoints),
      isActive: customer.isActive,
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
        if (editingCustomer) {
          const updated = await CustomerService.updateCustomer(editingCustomer.id, {
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone,
            address: formData.address || undefined,
            taxId: formData.taxId || undefined,
            openingBalance: parseFloat(formData.openingBalance) || 0,
            loyaltyPoints: parseFloat(formData.loyaltyPoints) || 0,
            isActive: formData.isActive,
          });
          setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          addToast("Customer updated successfully", "success");
        } else {
          const created = await CustomerService.createCustomer({
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone,
            address: formData.address || undefined,
            taxId: formData.taxId || undefined,
            openingBalance: parseFloat(formData.openingBalance) || 0,
            loyaltyPoints: parseFloat(formData.loyaltyPoints) || 0,
            isActive: formData.isActive,
          });
          setCustomers((prev) => [...prev, created]);
          addToast("Customer created successfully", "success");
        }
        setIsModalOpen(false);
        setFormData(emptyForm);
        setEditingCustomer(null);
      } catch {
        addToast(editingCustomer ? "Failed to update customer" : "Failed to create customer", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await CustomerService.archiveCustomer(deleteTarget.id);
        setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        addToast("Customer deactivated successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to deactivate customer", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your customer base, balances, and loyalty</p>
        </div>
        <Button onClick={openCreate}>Add Customer</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search customers by name, email, or phone..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No customers found. Create your first customer to get started.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {customer.email || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {customer.currentBalance.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={customer.isActive ? "success" : "error"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(customer)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {customer.isActive && (
                        <button
                          onClick={() => setDeleteTarget(customer)}
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
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingCustomer(null); }} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingCustomer ? "Edit Customer" : "Create Customer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
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
              <div className="md:col-span-2">
                <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
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
              <div>
                <label htmlFor="loyaltyPoints" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Loyalty Points</label>
                <Input
                  type="number"
                  id="loyaltyPoints"
                  name="loyaltyPoints"
                  value={formData.loyaltyPoints}
                  onChange={handleChange}
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
              <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setFormData(emptyForm); setEditingCustomer(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingCustomer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Deactivate Customer</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to deactivate <span className="font-medium">{deleteTarget?.name}</span>? This action can be reversed by editing the customer.
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
