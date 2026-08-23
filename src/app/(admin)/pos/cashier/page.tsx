"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { repositories } from "@/repositories";
import type { Product, ProductVariant } from "@/domain/types";
import { useCartStore, useShiftStore } from "@/stores";
import { ShiftService } from "@/services";
import { formatCurrency } from "@/utils/calculator";

export default function PosCashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const shift = useShiftStore((s) => s.activeShift);
  const setShift = useShiftStore((s) => s.setActiveShift);

  useEffect(() => {
    let mounted = true;
    Promise.all([repositories.product.getAll(), repositories.category.getAll()])
      .then(([prods, cats]) => {
        if (!mounted) return;
        setProducts(prods);
        setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (variant: ProductVariant) => {
    const product = products.find((p) => p.id === variant.productId);
    addItem({
      productVariantId: variant.id,
      productName: product?.name ?? "Unknown",
      variantName: variant.name,
      sku: variant.sku,
      quantity: 1,
      unitPrice: variant.sellingPrice,
      taxRate: variant.taxRate,
      discount: 0,
      discountType: "percentage",
    });
  };

  const handleCheckout = () => {
    if (!shift) {
      alert("Please open a shift before checkout.");
      return;
    }
    alert("Checkout flow will be implemented in Phase 9 (POS/Cashier).");
  };

  const handleOpenShift = async () => {
    try {
      const shiftData = await ShiftService.openShift("br-1", "usr-4", 5000);
      setShift(shiftData);
    } catch {
      alert("Could not open shift. You may already have an open shift.");
    }
  };

  return (
    <div className="space-y-4">
      <PageBreadCrumb pageTitle="POS / Cashier" />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!shift && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <p className="font-medium">No active shift</p>
          <p className="mt-1">You need to open a shift before processing sales.</p>
          <button
            onClick={handleOpenShift}
            className="mt-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            Open Shift
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const variant = product.variants[0];
                if (!variant) return null;
                return (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(variant)}
                    className="flex flex-col items-start rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-blue-400 hover:shadow-md transition dark:border-gray-800 dark:bg-gray-900"
                  >
                    {product.imageUrl && (
                      <div className="mb-3 h-24 w-full rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                        Product Image
                      </div>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{variant.name}</p>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(variant.sellingPrice)}</p>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No products found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          <div className="sticky top-[88px] rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Cart</h3>
              {cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.items.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cart is empty.</p>
            ) : (
              <>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantName} - {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          -
                        </button>
                        <span className="text-sm w-6 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Tax</span>
                    <span>{formatCurrency(cart.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{formatCurrency(cart.grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!shift || cart.items.length === 0}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
