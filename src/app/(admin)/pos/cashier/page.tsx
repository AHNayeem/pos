"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { repositories } from "@/repositories";
import type { Customer, Product, ProductVariant } from "@/domain/types";
import { useCartStore, useShiftStore } from "@/stores";
import { useAuthStore } from "@/stores/auth";
import { ShiftService, PosService } from "@/services";
import { formatCurrency } from "@/utils/calculator";
import { useToast } from "@/components/toast/ToastProvider";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

type CartItemRow = {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: "percentage" | "fixed";
  lineTotal: number;
  imageUrl?: string;
};

const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    categoryId: "cat-meals",
    brandId: "brand-4",
    name: "Deep Fried Wonton",
    description: "Crispy wonton served with sauce",
    imageUrl: "/images/product/product-01.jpg",
    variants: [
      { id: "demo-var-1", productId: "demo-1", name: "Regular", sku: "DW-REG", costPrice: 10, sellingPrice: 15, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    categoryId: "cat-meals",
    brandId: "brand-4",
    name: "Stir-Fried Noodles",
    description: "Wok tossed noodles",
    imageUrl: "/images/product/product-02.jpg",
    variants: [
      { id: "demo-var-2", productId: "demo-2", name: "Regular", sku: "SFN-REG", costPrice: 14, sellingPrice: 21, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    categoryId: "cat-meals",
    brandId: "brand-4",
    name: "Spicy Chicken Tendon",
    description: "Spicy chicken with tendon",
    imageUrl: "/images/product/product-03.jpg",
    variants: [
      { id: "demo-var-3", productId: "demo-3", name: "Regular", sku: "SCT-REG", costPrice: 20, sellingPrice: 31, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-4",
    categoryId: "cat-meals",
    brandId: "brand-4",
    name: "Fried Rice with Pork",
    description: "Classic pork fried rice",
    imageUrl: "/images/product/product-04.jpg",
    variants: [
      { id: "demo-var-4", productId: "demo-4", name: "Regular", sku: "FRP-REG", costPrice: 26, sellingPrice: 40, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "demo-5",
    categoryId: "cat-appetizer",
    brandId: "brand-4",
    name: "Sausages",
    description: "Grilled sausages",
    imageUrl: "/images/product/product-05.jpg",
    variants: [
      { id: "demo-var-5", productId: "demo-5", name: "Regular", sku: "SAU-REG", costPrice: 10, sellingPrice: 15, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-6",
    categoryId: "cat-meals",
    brandId: "brand-4",
    name: "Lambreta Burger",
    description: "Double patty burger",
    imageUrl: "/images/product/product-01.jpg",
    variants: [
      { id: "demo-var-6", productId: "demo-6", name: "Regular", sku: "LB-REG", costPrice: 18, sellingPrice: 30, taxRate: 0, unit: "pcs", attributes: {}, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES = [
  { id: "all", name: "All Menu", icon: "📦" },
  { id: "cat-meals", name: "Meals", icon: "🍽️" },
  { id: "cat-soups", name: "Soups", icon: "🥣" },
  { id: "cat-1", name: "Beverages", icon: "🥤" },
  { id: "cat-appetizer", name: "Appetizer", icon: "🍤" },
  { id: "cat-5", name: "Side Dish", icon: "🍟" },
];

const RECENT_ORDERS = [
  { id: "219022", items: 4, status: "Ready to serve", statusColor: "bg-emerald-500" },
  { id: "219021", items: 3, status: "In Progress", statusColor: "bg-orange-400" },
  { id: "219020", items: 2, status: "In Progress", statusColor: "bg-orange-400" },
];

export default function PosCashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile" | "credit" | "voucher">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const shift = useShiftStore((s) => s.activeShift);
  const setShift = useShiftStore((s) => s.setActiveShift);
  const { user } = useAuthStore();
  const { addToast } = useToast();

  useEffect(() => {
    let mounted = true;
    Promise.all([repositories.product.getAll(), repositories.category.getAll(), repositories.customer.getAll()])
      .then(([prods, cats, custs]) => {
        if (!mounted) return;
        const merged = [...DEMO_PRODUCTS, ...prods];
        setProducts(merged);
        setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
        setCustomers(custs);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts(DEMO_PRODUCTS);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const displayCategories = useMemo(() => {
    const existing = new Set(categories.map((c) => c.id));
    const merged: { id: string; name: string; icon?: string }[] = [...CATEGORIES];
    categories.forEach((c) => {
      if (!existing.has(c.id)) {
        merged.push({ id: c.id, name: c.name });
      }
    });
    return merged;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartItemMap = useMemo(() => {
    const map = new Map<string, CartItemRow>();
    cart.items.forEach((item) => {
      const product = products.find((p) => p.variants.some((v) => v.id === item.productVariantId));
      map.set(item.productVariantId, {
        ...item,
        imageUrl: product?.imageUrl,
      });
    });
    return map;
  }, [cart.items, products]);

  const handleAddToCart = (variant: ProductVariant, product: Product) => {
    addItem({
      productVariantId: variant.id,
      productName: product.name,
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
      addToast("Please open a shift before checkout.", "error");
      return;
    }
    if (cart.items.length === 0) {
      addToast("Cart is empty.", "error");
      return;
    }
    setSelectedCustomerId(cart.customerId || "");
    setPaidAmount(String(Math.ceil(cart.grandTotal)));
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!user || !shift) return;
    const paid = parseFloat(paidAmount);
    if (isNaN(paid) || paid < 0) {
      addToast("Please enter a valid paid amount.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const order = await PosService.checkout(
        cart,
        paymentMethod,
        paid,
        user.id,
        user.branchId,
        selectedCustomerId || undefined
      );
      clearCart();
      setCustomer(undefined);
      setIsPaymentModalOpen(false);
      setPaidAmount("");
      setSelectedCustomerId("");
      addToast(`Order ${order.orderNumber} placed successfully!`, "success");
    } catch {
      addToast("Failed to place order. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      const shiftData = await ShiftService.openShift("br-1", "usr-4", 5000);
      setShift(shiftData);
      addToast("Shift opened successfully", "success");
    } catch {
      addToast("Could not open shift. You may already have an open shift.", "error");
    }
  };

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = cart.items.reduce((sum, item) => {
    const lineSub = item.unitPrice * item.quantity;
    const lineDisc = item.discountType === "percentage" ? (lineSub * item.discount) / 100 : item.discount;
    return sum + (Math.max(0, lineSub - lineDisc) * item.taxRate) / 100;
  }, 0);
  const discountAmount = cart.items.reduce((sum, item) => {
    const lineSub = item.unitPrice * item.quantity;
    return sum + (item.discountType === "percentage" ? (lineSub * item.discount) / 100 : item.discount);
  }, 0);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  return (
    <div className="space-y-5">
      <PageBreadCrumb pageTitle="POS / Cashier" />

      {!shift && (
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/40 dark:bg-orange-900/20">
          <div>
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">No active shift</p>
            <p className="mt-1 text-xs text-orange-800 dark:text-orange-300">You need to open a shift before processing sales.</p>
          </div>
          <button
            onClick={handleOpenShift}
            className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
          >
            Open Shift
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Analytic</h3>
              <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">{RECENT_ORDERS.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="text-blue-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">#{order.id}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{order.items} Items</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${order.statusColor}`}>
                    {order.status}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Menu Items</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">({filteredProducts.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {displayCategories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))
              ) : (
                filteredProducts.map((product) => {
                  const variant = product.variants[0];
                  if (!variant) return null;
                  const inCart = cartItemMap.has(variant.id);
                  const cartItem = cartItemMap.get(variant.id);
                  return (
                    <div
                      key={product.id}
                      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg dark:bg-gray-900 ${
                        inCart ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">No Image</div>
                        )}
                        {inCart && (
                          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">${variant.sellingPrice.toFixed(1)}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          {inCart && cartItem ? (
                            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 dark:border-blue-900/40 dark:bg-blue-900/20">
                              <button
                                onClick={() => updateItemQuantity(cartItem.id, cartItem.quantity - 1)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(cartItem.id, cartItem.quantity + 1)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(variant, product)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              Add Item
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {!isLoading && filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">No menu items found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[380px] shrink-0">
          <div className="sticky top-[88px] rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Order&apos;s Summary</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">#{shift?.id ? `#${shift.id.slice(-4)}` : "#219021"}</p>
              </div>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
            </div>

            <div className="px-5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Items</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">({totalItems})</span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto px-5 py-2">
              {cart.items.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No items added yet.</div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const product = products.find((p) => p.variants.some((v) => v.id === item.productVariantId));
                    const img = product?.imageUrl;
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2 dark:border-gray-800">
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          {img ? (
                            <Image src={img} alt={item.productName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-gray-400">Img</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">(${item.unitPrice.toFixed(1)}) x{item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-200 p-5 pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Price</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Taxes</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Discount</span>
                <span className="font-medium text-gray-900 dark:text-white">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={handleCheckout}
                disabled={!shift || cart.items.length === 0 || isProcessing}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} className="sm:max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Checkout</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {(["cash", "card", "mobile", "credit", "voucher"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                      paymentMethod === method
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="customer" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer (Optional)</label>
              <select
                id="customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="paidAmount" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Amount</label>
              <Input
                type="number"
                id="paidAmount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                min="0"
                step={0.01}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Total due: {formatCurrency(total)}
              </p>
              {parseFloat(paidAmount) > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Change: {formatCurrency(Math.max(0, parseFloat(paidAmount) - total))}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCheckout} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
