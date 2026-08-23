import { create } from "zustand";
import type { Cart, CartItem, Customer, Shift } from "@/domain/types";

type CartStore = {
  cart: Cart;
  setCart: (cart: Cart) => void;
  addItem: (item: Omit<CartItem, "id" | "lineTotal">) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  applyDiscount: (discount: number, discountType: "percentage" | "fixed") => void;
  clearCart: () => void;
  setCustomer: (customerId?: string) => void;
};

export const useCartStore = create<CartStore>((set, get) => ({
  cart: {
    id: "",
    customerId: undefined,
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 0,
    updatedAt: new Date().toISOString(),
  },
  setCart: (cart) => set({ cart }),
  addItem: (item) => {
    const current = get().cart;
    const existingIndex = current.items.findIndex((i) => i.productVariantId === item.productVariantId && i.discountType === item.discountType && i.discount === item.discount);
    let items: CartItem[];
    if (existingIndex >= 0) {
      items = current.items.map((i, idx) => {
        if (idx === existingIndex) {
          const newQty = i.quantity + item.quantity;
          const lineSubtotal = i.unitPrice * newQty;
          const lineDiscount = i.discountType === "percentage" ? (lineSubtotal * i.discount) / 100 : i.discount;
          const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
          const lineTotal = taxableAmount + (taxableAmount * i.taxRate) / 100;
          return { ...i, quantity: newQty, lineTotal };
        }
        return i;
      });
    } else {
      const lineSubtotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discountType === "percentage" ? (lineSubtotal * item.discount) / 100 : item.discount;
      const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
      const lineTotal = taxableAmount + (taxableAmount * item.taxRate) / 100;
      items = [...current.items, { ...item, id: `ci-${Math.random().toString(36).slice(2, 11)}`, lineTotal }];
    }
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const taxAmount = items.reduce((sum, i) => {
      const lineSub = i.unitPrice * i.quantity;
      const lineDisc = i.discountType === "percentage" ? (lineSub * i.discount) / 100 : i.discount;
      return sum + (Math.max(0, lineSub - lineDisc) * i.taxRate) / 100;
    }, 0);
    const discountAmount = current.discountAmount;
    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);
    set({
      cart: {
        ...current,
        items,
        subtotal,
        taxAmount,
        discountAmount,
        grandTotal,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  updateItemQuantity: (itemId, quantity) => {
    const current = get().cart;
    if (quantity <= 0) {
      const items = current.items.filter((i) => i.id !== itemId);
      const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const taxAmount = items.reduce((sum, i) => {
        const lineSub = i.unitPrice * i.quantity;
        const lineDisc = i.discountType === "percentage" ? (lineSub * i.discount) / 100 : i.discount;
        return sum + (Math.max(0, lineSub - lineDisc) * i.taxRate) / 100;
      }, 0);
      const grandTotal = Math.max(0, subtotal - current.discountAmount + taxAmount);
      set({ cart: { ...current, items, subtotal, taxAmount, discountAmount: current.discountAmount, grandTotal, updatedAt: new Date().toISOString() } });
      return;
    }
    const items = current.items.map((i) => {
      if (i.id === itemId) {
        const lineSubtotal = i.unitPrice * quantity;
        const lineDiscount = i.discountType === "percentage" ? (lineSubtotal * i.discount) / 100 : i.discount;
        const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
        const lineTotal = taxableAmount + (taxableAmount * i.taxRate) / 100;
        return { ...i, quantity, lineTotal };
      }
      return i;
    });
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const taxAmount = items.reduce((sum, i) => {
      const lineSub = i.unitPrice * i.quantity;
      const lineDisc = i.discountType === "percentage" ? (lineSub * i.discount) / 100 : i.discount;
      return sum + (Math.max(0, lineSub - lineDisc) * i.taxRate) / 100;
    }, 0);
    const grandTotal = Math.max(0, subtotal - current.discountAmount + taxAmount);
    set({ cart: { ...current, items, subtotal, taxAmount, discountAmount: current.discountAmount, grandTotal, updatedAt: new Date().toISOString() } });
  },
  removeItem: (itemId) => {
    const current = get().cart;
    const items = current.items.filter((i) => i.id !== itemId);
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const taxAmount = items.reduce((sum, i) => {
      const lineSub = i.unitPrice * i.quantity;
      const lineDisc = i.discountType === "percentage" ? (lineSub * i.discount) / 100 : i.discount;
      return sum + (Math.max(0, lineSub - lineDisc) * i.taxRate) / 100;
    }, 0);
    const grandTotal = Math.max(0, subtotal - current.discountAmount + taxAmount);
    set({ cart: { ...current, items, subtotal, taxAmount, discountAmount: current.discountAmount, grandTotal, updatedAt: new Date().toISOString() } });
  },
  applyDiscount: (discount, discountType) => {
    const current = get().cart;
    const discountAmount = discountType === "percentage" ? (current.subtotal * discount) / 100 : discount;
    const grandTotal = Math.max(0, current.subtotal - discountAmount + current.taxAmount);
    set({ cart: { ...current, discountAmount, grandTotal, updatedAt: new Date().toISOString() } });
  },
  clearCart: () =>
    set({
      cart: {
        id: "",
        customerId: undefined,
        items: [],
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        grandTotal: 0,
        updatedAt: new Date().toISOString(),
      },
    }),
  setCustomer: (customerId) => set({ cart: { ...get().cart, customerId } }),
}));

type ShiftStore = {
  activeShift: Shift | null;
  setActiveShift: (shift: Shift | null) => void;
};

export const useShiftStore = create<ShiftStore>((set) => ({
  activeShift: null,
  setActiveShift: (shift) => set({ activeShift: shift }),
}));

type CustomerStore = {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

type CheckoutStore = {
  isCheckoutOpen: boolean;
  paymentMethod: "cash" | "card" | "mobile" | "credit";
  paidAmount: number;
  setIsCheckoutOpen: (open: boolean) => void;
  setPaymentMethod: (method: "cash" | "card" | "mobile" | "credit") => void;
  setPaidAmount: (amount: number) => void;
  reset: () => void;
};

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  isCheckoutOpen: false,
  paymentMethod: "cash",
  paidAmount: 0,
  setIsCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPaidAmount: (amount) => set({ paidAmount: amount }),
  reset: () => set({ isCheckoutOpen: false, paymentMethod: "cash", paidAmount: 0 }),
}));
