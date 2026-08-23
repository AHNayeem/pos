export type UserRole = "owner" | "manager" | "cashier" | "inventory_manager" | "accountant";

export type OrderStatus = "draft" | "held" | "completed" | "refunded" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "mobile" | "credit" | "voucher";
export type ShiftStatus = "open" | "closed";
export type StockMovementType = "purchase" | "sale" | "adjustment" | "transfer_in" | "transfer_out" | "return";
export type RefundStatus = "pending" | "approved" | "rejected" | "processed";
export type TaxType = "percentage" | "fixed";
export type DiscountType = "percentage" | "fixed";
export type PromotionType = "percentage" | "fixed" | "bogo" | "combo";
export type NotificationType = "info" | "success" | "warning" | "error";
export type BusinessType = "retail" | "restaurant" | "grocery" | "pharmacy" | "other";

export interface Permission {
  id: string;
  key: string;
  description: string;
}

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxId?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address: string;
  phone: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  unit: string;
  attributes: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address: string;
  taxId?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  taxId?: string;
  openingBalance: number;
  currentBalance: number;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: DiscountType;
  lineTotal: number;
}

export interface Cart {
  id: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  discount: number;
  discountType: DiscountType;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  customerId?: string;
  cashierId: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  productVariantId: string;
  branchId: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productVariantId: string;
  branchId: string;
  type: StockMovementType;
  quantity: number;
  referenceId?: string;
  note?: string;
  actorId: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  creditSales: number;
  totalSales: number;
  totalRefunds: number;
  totalCashIn: number;
  totalCashOut: number;
  note?: string;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: TaxType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  value?: number;
  buyQuantity?: number;
  getQuantity?: number;
  comboProductIds?: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  branchId: string;
  category: string;
  amount: number;
  note?: string;
  reference?: string;
  actorId: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  orderId: string;
  orderItemId: string;
  productVariantId: string;
  quantity: number;
  amount: number;
  reason?: string;
  status: RefundStatus;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  items: { productVariantId: string; quantity: number }[];
  reason?: string;
  status: "pending" | "received" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  branchId: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  note?: string;
  createdBy: string;
  receivedBy?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  items: StockTransferItem[];
  status: "pending" | "in_transit" | "completed" | "cancelled";
  sentBy: string;
  receivedBy?: string;
  receivedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableColumn<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
