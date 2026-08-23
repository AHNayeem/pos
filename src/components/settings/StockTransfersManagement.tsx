"use client";

import React, { useState, useTransition, useMemo } from "react";
import { StockTransferService } from "@/services";
import type { StockTransfer, StockTransferItem } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface StockTransfersManagementProps {
  initialTransfers: StockTransfer[];
}

type StockTransferFormData = {
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  items: StockTransferItem[];
  status: StockTransfer["status"];
  sentBy: string;
  receivedBy: string;
  receivedAt: string;
  note: string;
};

const emptyForm: StockTransferFormData = {
  transferNumber: "",
  fromBranchId: "",
  toBranchId: "",
  items: [],
  status: "pending",
  sentBy: "",
  receivedBy: "",
  receivedAt: "",
  note: "",
};

const TRANSFER_STATUSES: StockTransfer["status"][] = ["pending", "in_transit", "completed", "cancelled"];

export default function StockTransfersManagement({ initialTransfers }: StockTransfersManagementProps) {
  const [transfers, setTransfers] = useState<StockTransfer[]>(initialTransfers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const [formData, setFormData] = useState<StockTransferFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [receiveTarget, setReceiveTarget] = useState<StockTransfer | null>(null);
  const [receiveForm, setReceiveForm] = useState({ receivedBy: "" });

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !transfer.transferNumber.toLowerCase().includes(q) &&
          !transfer.fromBranchId.toLowerCase().includes(q) &&
          !transfer.toBranchId.toLowerCase().includes(q) &&
          !transfer.note?.toLowerCase().includes(q) &&
          !transfer.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterStatus !== "all" && transfer.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [transfers, searchQuery, filterStatus]);

  const openCreate = () => {
    setEditingTransfer(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (transfer: StockTransfer) => {
    setEditingTransfer(transfer);
    setFormData({
      transferNumber: transfer.transferNumber,
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      items: transfer.items,
      status: transfer.status,
      sentBy: transfer.sentBy,
      receivedBy: transfer.receivedBy || "",
      receivedAt: transfer.receivedAt || "",
      note: transfer.note || "",
    });
    setIsModalOpen(true);
  };

  const openReceive = (transfer: StockTransfer) => {
    setReceiveTarget(transfer);
    setReceiveForm({ receivedBy: "" });
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget || !receiveForm.receivedBy.trim()) return;
    startTransition(async () => {
      try {
        const updated = await StockTransferService.receiveStockTransfer(receiveTarget.id, receiveForm.receivedBy.trim());
        setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        addToast("Stock transfer received. Inventory updated.", "success");
        setReceiveTarget(null);
        setReceiveForm({ receivedBy: "" });
      } catch {
        addToast("Failed to receive stock transfer.", "error");
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const parsed: StockTransferItem[] = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const [variantId, productName, variantName, quantity] = line.split("|").map((s) => s.trim());
        return {
          id: `sti-${Date.now()}-${index}`,
          productVariantId: variantId || "",
          productName: productName || "",
          variantName: variantName || "",
          quantity: parseInt(quantity || "0", 10),
        };
      });
    setFormData((prev) => ({
      ...prev,
      items: parsed,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (!formData.transferNumber.trim()) {
          addToast("Please enter a transfer number.", "error");
          return;
        }
        if (!formData.fromBranchId.trim() || !formData.toBranchId.trim()) {
          addToast("Please specify both source and destination branches.", "error");
          return;
        }
        if (formData.fromBranchId === formData.toBranchId) {
          addToast("Source and destination branches must be different.", "error");
          return;
        }
        if (!formData.items.length) {
          addToast("Please add at least one item.", "error");
          return;
        }
        for (const item of formData.items) {
          if (!item.productVariantId || item.quantity <= 0) {
            addToast("Each item must have a valid variant ID and quantity greater than zero.", "error");
            return;
          }
        }
        if (editingTransfer) {
          const updated = await StockTransferService.updateStockTransfer(editingTransfer.id, {
            status: formData.status,
            fromBranchId: formData.fromBranchId,
            toBranchId: formData.toBranchId,
            items: formData.items,
            note: formData.note || undefined,
            receivedBy: formData.receivedBy || undefined,
            receivedAt: formData.receivedAt || undefined,
          });
          if (updated) {
            setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            addToast("Stock transfer updated successfully", "success");
          } else {
            addToast("Failed to update stock transfer.", "error");
          }
        } else {
          const created = await StockTransferService.createStockTransfer({
            transferNumber: formData.transferNumber.trim(),
            fromBranchId: formData.fromBranchId.trim(),
            toBranchId: formData.toBranchId.trim(),
            items: formData.items,
            status: formData.status,
            sentBy: formData.sentBy.trim(),
            receivedBy: formData.receivedBy || undefined,
            receivedAt: formData.receivedAt || undefined,
            note: formData.note || undefined,
          });
          setTransfers((prev) => [created, ...prev]);
          addToast("Stock transfer created successfully", "success");
        }
        setIsModalOpen(false);
        setEditingTransfer(null);
        setFormData(emptyForm);
      } catch {
        addToast("Failed to save stock transfer. Please check the form.", "error");
      }
    });
  };

  const getStatusBadgeColor = (status: StockTransfer["status"]) => {
    switch (status) {
      case "pending":
        return "light";
      case "in_transit":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "primary";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Transfers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage branch-to-branch stock transfers</p>
        </div>
        <Button onClick={openCreate}>New Transfer</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by transfer number, branch, or note..."
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
            {TRANSFER_STATUSES.map((status) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Transfer #</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">From Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">To Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No stock transfers found. Create your first transfer to get started.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {transfer.transferNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transfer.fromBranchId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transfer.toBranchId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {transfer.items.length} item(s)
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color={getStatusBadgeColor(transfer.status)}>
                        {transfer.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transfer.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button variant="outline" size="sm" onClick={() => openEdit(transfer)} className="mr-2">
                        Edit
                      </Button>
                      {transfer.status !== "completed" && transfer.status !== "cancelled" && (
                        <Button size="sm" onClick={() => openReceive(transfer)}>
                          Receive
                        </Button>
                      )}
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
            {editingTransfer ? "Edit Stock Transfer" : "New Stock Transfer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="transferNumber" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Number</label>
                <Input
                  type="text"
                  id="transferNumber"
                  name="transferNumber"
                  value={formData.transferNumber}
                  onChange={handleChange}
                  placeholder="e.g. ST-0004"
                  required
                />
              </div>
              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {TRANSFER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fromBranchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">From Branch</label>
                <Input
                  type="text"
                  id="fromBranchId"
                  name="fromBranchId"
                  value={formData.fromBranchId}
                  onChange={handleChange}
                  placeholder="e.g. br-1"
                  required
                />
              </div>
              <div>
                <label htmlFor="toBranchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">To Branch</label>
                <Input
                  type="text"
                  id="toBranchId"
                  name="toBranchId"
                  value={formData.toBranchId}
                  onChange={handleChange}
                  placeholder="e.g. br-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="sentBy" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Sent By</label>
                <Input
                  type="text"
                  id="sentBy"
                  name="sentBy"
                  value={formData.sentBy}
                  onChange={handleChange}
                  placeholder="e.g. usr-5"
                  required
                />
              </div>
              <div>
                <label htmlFor="receivedBy" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Received By</label>
                <Input
                  type="text"
                  id="receivedBy"
                  name="receivedBy"
                  value={formData.receivedBy}
                  onChange={handleChange}
                  placeholder="e.g. usr-3"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="receivedAt" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Received At</label>
                <Input
                  type="datetime-local"
                  id="receivedAt"
                  name="receivedAt"
                  value={formData.receivedAt}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="items" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                <textarea
                  id="items"
                  name="items"
                  value={formData.items.map((item) => `${item.productVariantId}|${item.productName}|${item.variantName}|${item.quantity}`).join("\n")}
                  onChange={handleItemsChange}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="variantId|productName|variantName|quantity"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Format: variantId | productName | variantName | quantity (one per line)</p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Optional note"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingTransfer ? "Update Transfer" : "Create Transfer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal isOpen={!!receiveTarget} onClose={() => { setReceiveTarget(null); setReceiveForm({ receivedBy: "" }); }} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Receive Stock Transfer</h3>
          {receiveTarget && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Receiving transfer <span className="font-medium">{receiveTarget.transferNumber}</span> from <span className="font-medium">{receiveTarget.fromBranchId}</span> to <span className="font-medium">{receiveTarget.toBranchId}</span>.
            </p>
          )}
          <form onSubmit={handleReceiveSubmit} className="space-y-4">
            <div>
              <label htmlFor="receivedBy" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Received By (User ID)</label>
              <Input
                type="text"
                id="receivedBy"
                value={receiveForm.receivedBy}
                onChange={(e) => setReceiveForm((prev) => ({ ...prev, receivedBy: e.target.value }))}
                placeholder="e.g. usr-3"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => { setReceiveTarget(null); setReceiveForm({ receivedBy: "" }); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Receiving..." : "Confirm Receive"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
