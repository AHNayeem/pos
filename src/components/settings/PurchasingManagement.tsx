"use client";

import React, { useState, useTransition, useMemo } from "react";
import { PurchasingService } from "@/services";
import type { PurchaseOrder, Product, Branch, Supplier } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface PurchasingManagementProps {
  initialPurchaseOrders: PurchaseOrder[];
  branches: Branch[];
  suppliers: Supplier[];
  products: Product[];
}

type PoFormData = {
  poNumber: string;
  branchId: string;
  supplierId: string;
  taxAmount: string;
  note: string;
};

type PoItemFormData = {
  productVariantId: string;
  quantity: string;
  unitCost: string;
};

type ReceiveFormData = {
  receivedItems: { itemId: string; quantity: number }[];
};

const emptyPoForm: PoFormData = {
  poNumber: "",
  branchId: "",
  supplierId: "",
  taxAmount: "0",
  note: "",
};

const emptyItemForm: PoItemFormData = {
  productVariantId: "",
  quantity: "",
  unitCost: "",
};

const emptyReceiveForm: ReceiveFormData = {
  receivedItems: [],
};

export default function PurchasingManagement({ initialPurchaseOrders, branches, suppliers, products }: PurchasingManagementProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [poForm, setPoForm] = useState<PoFormData>(emptyPoForm);
  const [poItems, setPoItems] = useState<PoItemFormData[]>([]);
  const [itemForm, setItemForm] = useState<PoItemFormData>(emptyItemForm);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [receiveForm, setReceiveForm] = useState<ReceiveFormData>(emptyReceiveForm);
  const { addToast } = useToast();

  const allVariants = useMemo(() => {
    return products.flatMap((p) => p.variants.map((v) => ({ ...v, productName: p.name, productId: p.id })));
  }, [products]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!po.poNumber.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && po.status !== statusFilter) return false;
      if (branchFilter && po.branchId !== branchFilter) return false;
      if (supplierFilter && po.supplierId !== supplierFilter) return false;
      return true;
    });
  }, [purchaseOrders, searchQuery, statusFilter, branchFilter, supplierFilter]);

  const getBranchName = (branchId: string) => branches.find((b) => b.id === branchId)?.name || "—";
  const getSupplierName = (supplierId: string) => suppliers.find((s) => s.id === supplierId)?.name || "—";
  const getVariantName = (variantId: string) => {
    const variant = allVariants.find((v) => v.id === variantId);
    return variant ? `${variant.productName} - ${variant.name}` : "—";
  };

  const resetForms = () => {
    setPoForm(emptyPoForm);
    setPoItems([]);
    setEditingItemIndex(null);
    setItemForm(emptyItemForm);
  };

  const openCreate = () => {
    setEditingPo(null);
    setPoForm({ ...emptyPoForm, poNumber: `PO-${String(Date.now()).slice(-6)}` });
    setPoItems([]);
    setEditingItemIndex(null);
    setItemForm(emptyItemForm);
    setIsModalOpen(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditingPo(po);
    setPoForm({
      poNumber: po.poNumber,
      branchId: po.branchId,
      supplierId: po.supplierId,
      taxAmount: String(po.taxAmount),
      note: po.note || "",
    });
    setPoItems(
      po.items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: String(item.quantity),
        unitCost: String(item.unitCost),
      }))
    );
    setEditingItemIndex(null);
    setItemForm(emptyItemForm);
    setIsModalOpen(true);
  };

  const handlePoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!itemForm.productVariantId || !itemForm.quantity || !itemForm.unitCost) {
      addToast("Variant, quantity, and unit cost are required", "error");
      return;
    }
    setPoItems((prev) => {
      if (editingItemIndex !== null) {
        const next = [...prev];
        next[editingItemIndex] = { ...itemForm };
        return next;
      }
      return [...prev, { ...itemForm }];
    });
    setItemForm(emptyItemForm);
    setEditingItemIndex(null);
  };

  const editItem = (index: number) => {
    setEditingItemIndex(index);
    setItemForm(poItems[index]);
  };

  const deleteItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setItemForm(emptyItemForm);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      setEditingItemIndex(editingItemIndex - 1);
    }
  };

  const calculateSubtotal = () => {
    return poItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      addToast("At least one item is required", "error");
      return;
    }

    startTransition(async () => {
      try {
        const taxAmount = parseFloat(poForm.taxAmount) || 0;

        if (editingPo) {
          const updated = await PurchasingService.updatePurchaseOrder(editingPo.id, {
            branchId: poForm.branchId,
            supplierId: poForm.supplierId,
            items: poItems.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: parseFloat(item.quantity) || 0,
              unitCost: parseFloat(item.unitCost) || 0,
              productName: getVariantName(item.productVariantId).split(" - ")[0],
              variantName: getVariantName(item.productVariantId).split(" - ")[1] || "",
            })),
            taxAmount,
            note: poForm.note || undefined,
          });
          setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          addToast("Purchase order updated successfully", "success");
        } else {
          const created = await PurchasingService.createPurchaseOrder({
            poNumber: poForm.poNumber,
            branchId: poForm.branchId,
            supplierId: poForm.supplierId,
            items: poItems.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: parseFloat(item.quantity) || 0,
              unitCost: parseFloat(item.unitCost) || 0,
              productName: getVariantName(item.productVariantId).split(" - ")[0],
              variantName: getVariantName(item.productVariantId).split(" - ")[1] || "",
            })),
            taxAmount,
            note: poForm.note || undefined,
            createdBy: "usr-1",
          });
          setPurchaseOrders((prev) => [...prev, created]);
          addToast("Purchase order created successfully", "success");
        }
        setIsModalOpen(false);
        resetForms();
        setEditingPo(null);
      } catch {
        addToast(editingPo ? "Failed to update purchase order" : "Failed to create purchase order", "error");
      }
    });
  };

  const handleArchive = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        const updated = await PurchasingService.cancelPurchaseOrder(deleteTarget.id);
        setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        addToast("Purchase order cancelled successfully", "success");
        setDeleteTarget(null);
      } catch {
        addToast("Failed to cancel purchase order", "error");
      }
    });
  };

  const openReceive = (po: PurchaseOrder) => {
    setReceiveTarget(po);
    setReceiveForm({
      receivedItems: po.items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
    });
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget) return;
    startTransition(async () => {
      try {
        const updated = await PurchasingService.receivePurchaseOrder(receiveTarget.id, {
          receivedItems: receiveForm.receivedItems,
          receivedBy: "usr-1",
        });
        setPurchaseOrders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        addToast("Purchase order received successfully. Stock updated.", "success");
        setReceiveTarget(null);
        setReceiveForm(emptyReceiveForm);
      } catch {
        addToast("Failed to receive purchase order", "error");
      }
    });
  };

  const updateReceivedQuantity = (itemId: string, quantity: number) => {
    setReceiveForm((prev) => ({
      ...prev,
      receivedItems: prev.receivedItems.map((r) => (r.itemId === itemId ? { ...r, quantity } : r)),
    }));
  };

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    const config = {
      draft: { color: "info" as const, label: "Draft" },
      ordered: { color: "warning" as const, label: "Ordered" },
      partial: { color: "warning" as const, label: "Partial" },
      received: { color: "success" as const, label: "Received" },
      cancelled: { color: "error" as const, label: "Cancelled" },
    };
    const { color, label } = config[status];
    return <Badge size="sm" color={color}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Orders</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage purchase orders, receiving, and supplier payables</p>
        </div>
        <Button onClick={openCreate}>Create Purchase Order</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPurchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No purchase orders found. Create your first purchase order to get started.
                  </td>
                </tr>
              ) : (
                filteredPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {po.poNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getSupplierName(po.supplierId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {getBranchName(po.branchId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(po)}
                        className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {(po.status === "ordered" || po.status === "partial") && (
                        <button
                          onClick={() => openReceive(po)}
                          className="mr-3 text-green-600 hover:text-green-800 dark:text-green-400"
                        >
                          Receive
                        </button>
                      )}
                      {(po.status === "draft" || po.status === "ordered") && (
                        <button
                          onClick={() => setDeleteTarget(po)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Cancel
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
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForms(); setEditingPo(null); }} className="sm:max-w-3xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingPo ? "Edit Purchase Order" : "Create Purchase Order"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="poNumber" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">PO Number</label>
                <Input
                  type="text"
                  id="poNumber"
                  name="poNumber"
                  value={poForm.poNumber}
                  onChange={handlePoChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="branchId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                <select
                  id="branchId"
                  name="branchId"
                  value={poForm.branchId}
                  onChange={handlePoChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="supplierId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                <select
                  id="supplierId"
                  name="supplierId"
                  value={poForm.supplierId}
                  onChange={handlePoChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="taxAmount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Amount</label>
                <Input
                  type="number"
                  id="taxAmount"
                  name="taxAmount"
                  value={poForm.taxAmount}
                  onChange={handlePoChange}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                <Input
                  type="text"
                  id="note"
                  name="note"
                  value={poForm.note}
                  onChange={handlePoChange}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Items</h4>
                <Button type="button" size="sm" variant="outline" onClick={() => { setEditingItemIndex(null); setItemForm(emptyItemForm); }}>
                  Add Item
                </Button>
              </div>

              {poItems.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Unit Cost</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Line Total</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {poItems.map((item, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {getVariantName(item.productVariantId)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(parseFloat(item.unitCost) || 0)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0))}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                            <button type="button" onClick={() => editItem(index)} className="mr-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">Edit</button>
                            <button type="button" onClick={() => deleteItem(index)} className="text-red-600 hover:text-red-800 dark:text-red-400">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(editingItemIndex !== null || poItems.length === 0) && (
                <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h5 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    {editingItemIndex !== null ? "Edit Item" : "Add Item"}
                  </h5>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="productVariantId" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Product Variant</label>
                      <select
                        id="productVariantId"
                        name="productVariantId"
                        value={itemForm.productVariantId}
                        onChange={handleItemChange}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        required
                      >
                        <option value="">Select variant</option>
                        {allVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>{variant.productName} - {variant.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quantity" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                      <Input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={itemForm.quantity}
                        onChange={handleItemChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="unitCost" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Unit Cost</label>
                      <Input
                        type="number"
                        id="unitCost"
                        name="unitCost"
                        value={itemForm.unitCost}
                        onChange={handleItemChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingItemIndex(null); setItemForm(emptyItemForm); }}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={addItem}>
                      {editingItemIndex !== null ? "Update Item" : "Add Item"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Subtotal: {formatCurrency(calculateSubtotal())} | Tax: {formatCurrency(parseFloat(poForm.taxAmount) || 0)} | Total: {formatCurrency(calculateSubtotal() + (parseFloat(poForm.taxAmount) || 0))}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); resetForms(); setEditingPo(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingPo ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal isOpen={!!receiveTarget} onClose={() => { setReceiveTarget(null); setReceiveForm(emptyReceiveForm); }} className="sm:max-w-2xl">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Receive Purchase Order: {receiveTarget?.poNumber}
          </h3>
          {receiveTarget && (
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ordered</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Receive Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {receiveTarget.items.map((item) => {
                      const receivedQty = receiveForm.receivedItems.find((r) => r.itemId === item.id)?.quantity ?? 0;
                      return (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.productName} - {item.variantName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Input
                              type="number"
                              value={String(receivedQty)}
                              onChange={(e) => updateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                              max={String(item.quantity)}
                              min={"0"}
                              required
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => { setReceiveTarget(null); setReceiveForm(emptyReceiveForm); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Receiving..." : "Receive Items"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Cancel Purchase Order</h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to cancel purchase order <span className="font-medium">{deleteTarget?.poNumber}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={isPending}>
              {isPending ? "Cancelling..." : "Cancel PO"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
