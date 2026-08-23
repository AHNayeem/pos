"use client";

import React, { useState, useTransition } from "react";
import { BranchService } from "@/services";
import type { Branch } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface BranchManagementProps {
  initialBranches: Branch[];
  businessId: string;
}

type BranchFormData = {
  name: string;
  address: string;
  phone: string;
  managerId: string;
  isActive: boolean;
};

const emptyForm: BranchFormData = {
  name: "",
  address: "",
  phone: "",
  managerId: "",
  isActive: true,
};

export default function BranchManagement({ initialBranches, businessId }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const { addToast } = useToast();

  const openCreate = () => {
    setEditingBranch(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      managerId: branch.managerId || "",
      isActive: branch.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingBranch) {
          const updated = await BranchService.updateBranch(editingBranch.id, {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            managerId: formData.managerId || undefined,
            isActive: formData.isActive,
          });
          setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          addToast("Branch updated successfully", "success");
        } else {
          const created = await BranchService.createBranch({
            businessId,
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            managerId: formData.managerId || undefined,
            isActive: formData.isActive,
          });
          setBranches((prev) => [...prev, created]);
          addToast("Branch created successfully", "success");
        }
        setIsModalOpen(false);
        setFormData(emptyForm);
        setEditingBranch(null);
      } catch {
        addToast(editingBranch ? "Failed to update branch" : "Failed to create branch", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await BranchService.archiveBranch(deleteTarget.id);
        setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        addToast("Branch deactivated successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to deactivate branch", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branches</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your business locations</p>
        </div>
        <Button onClick={openCreate}>Add Branch</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No branches found. Create your first branch to get started.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {branch.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {branch.address}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {branch.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={branch.isActive ? "success" : "error"}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(branch)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {branch.isActive && (
                        <button
                          onClick={() => setDeleteTarget(branch)}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingBranch ? "Edit Branch" : "Create Branch"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch Name</label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="managerId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Manager ID</label>
              <Input
                type="text"
                id="managerId"
                name="managerId"
                value={formData.managerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, managerId: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingBranch ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Deactivate Branch</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to deactivate <span className="font-medium">{deleteTarget?.name}</span>? This action can be reversed by editing the branch.
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
