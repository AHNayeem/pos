"use client";

import React, { useState, useTransition, useMemo } from "react";
import { InventoryService } from "@/services";
import type { Inventory, StockMovement, Product, ProductVariant, Branch } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

interface InventoryManagementProps {
  initialInventory: Inventory[];
  initialMovements: StockMovement[];
  branches: Branch[];
  products: Product[];
}

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

type AdjustmentFormData = {
  quantity: string;
  type: "purchase" | "sale" | "adjustment" | "transfer_in" | "transfer_out" | "return";
  note: string;
  referenceId: string;
};

const emptyAdjustment: AdjustmentFormData = {
  quantity: "",
  type: "adjustment",
  note: "",
  referenceId: "",
};

function getVariant(variants: ProductVariant[], variantId: string): ProductVariant | undefined {
  return variants.find((v) => v.id === variantId);
}

function getProduct(products: Product[], productId: string): Product | undefined {
  return products.find((p) => p.id === productId);
}

function getStockStatus(quantity: number, minStockLevel: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minStockLevel) return "low_stock";
  return "in_stock";
}

function formatMovementType(type: StockMovement["type"]): string {
  const labels: Record<string, string> = {
    purchase: "Purchase",
    sale: "Sale",
    adjustment: "Adjustment",
    transfer_in: "Transfer In",
    transfer_out: "Transfer Out",
    return: "Return",
  };
  return labels[type] || type;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function InventoryManagement({ initialInventory, initialMovements, branches, products }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<Inventory[]>(initialInventory);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [activeTab, setActiveTab] = useState<"levels" | "movements">("levels");
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Inventory | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustmentFormData>(emptyAdjustment);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const allVariants = useMemo(() => {
    return products.flatMap((p) => p.variants.map((v) => ({ ...v, productName: p.name, productId: p.id })));
  }, [products]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const variant = getVariant(allVariants, item.productVariantId);
      const product = variant ? getProduct(products, variant.productId) : undefined;
      const productName = product?.name || "";
      const variantName = variant?.name || "";
      const sku = variant?.sku || "";

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!productName.toLowerCase().includes(q) && !variantName.toLowerCase().includes(q) && !sku.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (branchFilter && item.branchId !== branchFilter) return false;
      if (statusFilter) {
        const status = getStockStatus(item.quantity, item.minStockLevel);
        if (status !== statusFilter) return false;
      }
      return true;
    });
  }, [inventory, searchQuery, branchFilter, statusFilter, allVariants, products]);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      if (branchFilter && movement.branchId !== branchFilter) return false;
      if (movementTypeFilter && movement.type !== movementTypeFilter) return false;
      if (searchQuery) {
        const variant = getVariant(allVariants, movement.productVariantId);
        const product = variant ? getProduct(products, variant.productId) : undefined;
        const q = searchQuery.toLowerCase();
        if (!product?.name.toLowerCase().includes(q) && !variant?.name.toLowerCase().includes(q) && !variant?.sku.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [movements, searchQuery, branchFilter, movementTypeFilter, allVariants, products]);

  const openAdjust = (item: Inventory) => {
    setAdjustTarget(item);
    setAdjustForm(emptyAdjustment);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const quantityDelta = parseFloat(adjustForm.quantity);
    if (isNaN(quantityDelta) || quantityDelta === 0) {
      addToast("Please enter a valid quantity adjustment", "error");
      return;
    }
    startTransition(async () => {
      try {
        await InventoryService.adjustStock(
          adjustTarget.productVariantId,
          adjustTarget.branchId,
          quantityDelta,
          adjustForm.type,
          "usr-1",
          adjustForm.referenceId || undefined,
          adjustForm.note || undefined
        );
        const updated = await InventoryService.getInventory();
        setInventory(updated);
        const updatedMovements = await InventoryService.getStockMovements();
        setMovements(updatedMovements);
        addToast("Stock adjusted successfully", "success");
        setIsAdjustModalOpen(false);
        setAdjustTarget(null);
        setAdjustForm(emptyAdjustment);
      } catch {
        addToast("Failed to adjust stock", "error");
      }
    });
  };

  const getBranchName = (branchId: string) => branches.find((b) => b.id === branchId)?.name || "—";
  const getStatusBadge = (status: StockStatus) => {
    const config = {
      in_stock: { color: "success" as const, label: "In Stock" },
      low_stock: { color: "warning" as const, label: "Low Stock" },
      out_of_stock: { color: "error" as const, label: "Out of Stock" },
    };
    const { color, label } = config[status];
    return <Badge size="sm" color={color}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track stock levels, adjustments, and movements</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by product, variant, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("levels")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "levels"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Stock Levels
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "movements"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Stock Movements
        </button>
      </div>

      {activeTab === "levels" && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Min / Max</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const variant = getVariant(allVariants, item.productVariantId);
                      const product = variant ? getProduct(products, variant.productId) : undefined;
                      const status = getStockStatus(item.quantity, item.minStockLevel);
                      return (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {product?.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {variant?.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {variant?.sku || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {getBranchName(item.branchId)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {item.minStockLevel} / {item.maxStockLevel}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {getStatusBadge(status)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <button
                              onClick={() => openAdjust(item)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "movements" && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="return">Return</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No stock movements found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((movement) => {
                      const variant = getVariant(allVariants, movement.productVariantId);
                      const product = variant ? getProduct(products, variant.productId) : undefined;
                      const qtyColor = movement.quantity >= 0 ? "text-green-600" : "text-red-600";
                      return (
                        <tr key={movement.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(movement.createdAt)}
                          </td>
                          <td className="whitespace-rap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {product?.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {variant?.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatMovementType(movement.type)}
                          </td>
                          <td className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${qtyColor}`}>
                            {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {getBranchName(movement.branchId)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {movement.referenceId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {movement.note || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => { setIsAdjustModalOpen(false); setAdjustTarget(null); }} className="sm:max-w-md">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Adjust Stock
          </h3>
          {adjustTarget && (() => {
            const variant = getVariant(allVariants, adjustTarget.productVariantId);
            const product = variant ? getProduct(products, variant.productId) : undefined;
            return (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Adjusting stock for <span className="font-medium">{product?.name || "—"} - {variant?.name || "—"}</span> at <span className="font-medium">{getBranchName(adjustTarget.branchId)}</span>. Current stock: <span className="font-medium">{adjustTarget.quantity}</span>
              </p>
            );
          })()}
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity Adjustment</label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="e.g. 10 or -5"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                id="type"
                name="type"
                value={adjustForm.type}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value as AdjustmentFormData["type"] }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="adjustment">Adjustment</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="return">Return</option>
              </select>
            </div>
            <div>
              <label htmlFor="referenceId" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference ID (optional)</label>
              <Input
                type="text"
                id="referenceId"
                name="referenceId"
                value={adjustForm.referenceId}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, referenceId: e.target.value }))}
                placeholder="e.g. PO-123 or ORD-456"
              />
            </div>
            <div>
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
              <Input
                type="text"
                id="note"
                name="note"
                value={adjustForm.note}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Reason for adjustment"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => { setIsAdjustModalOpen(false); setAdjustTarget(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adjusting..." : "Adjust Stock"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
