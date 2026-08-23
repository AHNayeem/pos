import type { User, Role } from "@/domain/types";

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const role = rolePermissions.get(user.role);
  if (!role) return false;
  if (role.permissions.includes("*")) return true;
  return role.permissions.includes(permission);
}

export function can(user: User | null, action: string, resource: string): boolean {
  const permission = `${resource}.${action}`;
  return hasPermission(user, permission);
}

export function getRolePermissions(roleName: string): string[] {
  const role = rolePermissions.get(roleName);
  return role ? [...role.permissions] : [];
}

const rolePermissions = new Map<string, Role>([
  ["owner", { id: "role-1", name: "owner", description: "Full access", permissions: ["*"] }],
    ["manager", { id: "role-2", name: "manager", description: "Management access", permissions: ["products.read", "products.write", "orders.read", "orders.write", "reports.read", "reports.write", "customers.read", "customers.write", "suppliers.read", "purchases.write", "inventory.read", "inventory.write", "businesses.read", "businesses.write", "branches.read", "branches.write", "categories.read", "categories.write", "brands.read", "brands.write", "sales.read", "sales.write", "refunds.read", "refunds.write", "returns.read", "returns.write", "shifts.read", "shifts.write", "discounts.read", "discounts.write", "promotions.read", "promotions.write", "taxes.read", "taxes.write", "expenses.read", "expenses.write", "loyalty.read", "loyalty.write", "storeCredit.read", "storeCredit.write", "stockTransfers.read", "stockTransfers.write", "accounting.read", "accounting.write", "notifications.read", "notifications.write", "audit.read", "audit.write", "systemSettings.read", "systemSettings.write"] }],
   ["cashier", { id: "role-3", name: "cashier", description: "POS access", permissions: ["pos.read", "pos.write", "orders.read", "customers.read", "shifts.write"] }],
    ["inventory_manager", { id: "role-4", name: "inventory_manager", description: "Inventory access", permissions: ["products.read", "products.write", "inventory.read", "inventory.write", "purchases.read", "purchases.write", "categories.read", "categories.write", "brands.read", "brands.write", "stockTransfers.read", "stockTransfers.write"] }],
    ["accountant", { id: "role-5", name: "accountant", description: "Accounting access", permissions: ["reports.read", "expenses.read", "expenses.write", "payments.read", "businesses.read", "sales.read", "refunds.read", "shifts.read", "discounts.read", "promotions.read", "taxes.read", "accounting.read", "accounting.write", "notifications.read", "audit.read"] }],
]);

export const POS_PERMISSIONS = {
  POS_READ: "pos.read",
  POS_WRITE: "pos.write",
  ORDERS_READ: "orders.read",
  ORDERS_WRITE: "orders.write",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_WRITE: "customers.write",
  REPORTS_READ: "reports.read",
  REPORTS_WRITE: "reports.write",
  PRODUCTS_READ: "products.read",
  PRODUCTS_WRITE: "products.write",
  CATEGORIES_READ: "categories.read",
  CATEGORIES_WRITE: "categories.write",
  BRANDS_READ: "brands.read",
  BRANDS_WRITE: "brands.write",
  INVENTORY_READ: "inventory.read",
  INVENTORY_WRITE: "inventory.write",
  PURCHASES_READ: "purchases.read",
  PURCHASES_WRITE: "purchases.write",
  SUPPLIERS_READ: "suppliers.read",
  SUPPLIERS_WRITE: "suppliers.write",
  EXPENSES_READ: "expenses.read",
  EXPENSES_WRITE: "expenses.write",
  LOYALTY_READ: "loyalty.read",
  LOYALTY_WRITE: "loyalty.write",
   STORE_CREDIT_READ: "storeCredit.read",
  STORE_CREDIT_WRITE: "storeCredit.write",
  STOCK_TRANSFERS_READ: "stockTransfers.read",
  STOCK_TRANSFERS_WRITE: "stockTransfers.write",
  ACCOUNTING_READ: "accounting.read",
  ACCOUNTING_WRITE: "accounting.write",
  NOTIFICATIONS_READ: "notifications.read",
  NOTIFICATIONS_WRITE: "notifications.write",
  AUDIT_READ: "audit.read",
  AUDIT_WRITE: "audit.write",
  SYSTEM_SETTINGS_READ: "systemSettings.read",
  SYSTEM_SETTINGS_WRITE: "systemSettings.write",
  PAYMENTS_READ: "payments.read",
  PAYMENTS_WRITE: "payments.write",
  SALES_READ: "sales.read",
  SALES_WRITE: "sales.write",
  REFUNDS_READ: "refunds.read",
  REFUNDS_WRITE: "refunds.write",
  RETURNS_READ: "returns.read",
  RETURNS_WRITE: "returns.write",
  SHIFTS_READ: "shifts.read",
  SHIFTS_WRITE: "shifts.write",
  DISCOUNTS_READ: "discounts.read",
  DISCOUNTS_WRITE: "discounts.write",
  PROMOTIONS_READ: "promotions.read",
  PROMOTIONS_WRITE: "promotions.write",
  TAXES_READ: "taxes.read",
  TAXES_WRITE: "taxes.write",
  BUSINESSES_READ: "businesses.read",
  BUSINESSES_WRITE: "businesses.write",
  BRANCHES_READ: "branches.read",
  BRANCHES_WRITE: "branches.write",
} as const;
