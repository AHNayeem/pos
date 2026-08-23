import type {
  Product,
  ProductVariant,
  Category,
  Brand,
  Customer,
  Supplier,
  Order,
  Payment,
  Inventory,
  StockMovement,
  Shift,
  Tax,
  Discount,
  Promotion,
  Expense,
  Refund,
  Return,
  User,
  Role,
  Branch,
  Business,
  Notification,
  AuditLog,
  PurchaseOrder,
  StockTransfer,
} from "@/domain/types";

export interface ProductRepository {
  getAll(filters?: { categoryId?: string; brandId?: string; search?: string }): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getVariantById(id: string): Promise<ProductVariant | null>;
  create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  archive(id: string): Promise<void>;
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category | null>;
  archive(id: string): Promise<void>;
}

export interface BrandRepository {
  getAll(): Promise<Brand[]>;
  getById(id: string): Promise<Brand | null>;
  create(brand: Omit<Brand, "id" | "createdAt" | "updatedAt">): Promise<Brand>;
  update(id: string, data: Partial<Brand>): Promise<Brand | null>;
  archive(id: string): Promise<void>;
}

export interface CustomerRepository {
  getAll(filters?: { search?: string }): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer | null>;
  archive(id: string): Promise<void>;
}

export interface SupplierRepository {
  getAll(filters?: { search?: string }): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier>;
  update(id: string, data: Partial<Supplier>): Promise<Supplier | null>;
  archive(id: string): Promise<void>;
}

export interface OrderRepository {
  getAll(filters?: { status?: string; branchId?: string; from?: string; to?: string }): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  getByNumber(orderNumber: string): Promise<Order | null>;
  create(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order | null>;
}

export interface PaymentRepository {
  getAll(filters?: { orderId?: string }): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
  create(payment: Omit<Payment, "id" | "createdAt">): Promise<Payment>;
}

export interface InventoryRepository {
  getAll(filters?: { branchId?: string; productVariantId?: string; lowStock?: boolean }): Promise<Inventory[]>;
  getByVariant(variantId: string, branchId: string): Promise<Inventory | null>;
  adjustStock(variantId: string, branchId: string, quantity: number, type: StockMovement["type"], actorId: string, referenceId?: string, note?: string): Promise<Inventory>;
}

export interface StockMovementRepository {
  getAll(filters?: { branchId?: string; productVariantId?: string; type?: string }): Promise<StockMovement[]>;
  create(movement: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement>;
}

export interface ShiftRepository {
  getAll(filters?: { branchId?: string; status?: string }): Promise<Shift[]>;
  getActive(branchId: string, userId: string): Promise<Shift | null>;
  getById(id: string): Promise<Shift | null>;
  create(shift: Omit<Shift, "id" | "createdAt" | "updatedAt">): Promise<Shift>;
  update(id: string, data: Partial<Shift>): Promise<Shift | null>;
}

export interface TaxRepository {
  getAll(): Promise<Tax[]>;
  getById(id: string): Promise<Tax | null>;
  create(tax: Omit<Tax, "id" | "createdAt" | "updatedAt">): Promise<Tax>;
  update(id: string, data: Partial<Tax>): Promise<Tax | null>;
}

export interface DiscountRepository {
  getAll(filters?: { active?: boolean }): Promise<Discount[]>;
  getById(id: string): Promise<Discount | null>;
  getByCode(code: string): Promise<Discount | null>;
  create(discount: Omit<Discount, "id" | "createdAt" | "updatedAt">): Promise<Discount>;
  update(id: string, data: Partial<Discount>): Promise<Discount | null>;
}

export interface PromotionRepository {
  getAll(filters?: { active?: boolean }): Promise<Promotion[]>;
  getById(id: string): Promise<Promotion | null>;
  create(promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">): Promise<Promotion>;
  update(id: string, data: Partial<Promotion>): Promise<Promotion | null>;
}

export interface ExpenseRepository {
  getAll(filters?: { branchId?: string; category?: string; from?: string; to?: string }): Promise<Expense[]>;
  getById(id: string): Promise<Expense | null>;
  create(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense>;
}

export interface RefundRepository {
  getAll(filters?: { orderId?: string; status?: string }): Promise<Refund[]>;
  getById(id: string): Promise<Refund | null>;
  create(refund: Omit<Refund, "id" | "createdAt" | "updatedAt">): Promise<Refund>;
  update(id: string, data: Partial<Refund>): Promise<Refund | null>;
}

export interface ReturnRepository {
  getAll(filters?: { orderId?: string; status?: string }): Promise<Return[]>;
  getById(id: string): Promise<Return | null>;
  create(return_: Omit<Return, "id" | "createdAt" | "updatedAt">): Promise<Return>;
  update(id: string, data: Partial<Return>): Promise<Return | null>;
}

export interface UserRepository {
  getAll(filters?: { role?: string; branchId?: string }): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}

export interface RoleRepository {
  getAll(): Promise<Role[]>;
  getById(id: string): Promise<Role | null>;
  getByName(name: string): Promise<Role | null>;
}

export interface BranchRepository {
  getAll(filters?: { businessId?: string }): Promise<Branch[]>;
  getById(id: string): Promise<Branch | null>;
  create(branch: Omit<Branch, "id" | "createdAt" | "updatedAt">): Promise<Branch>;
  update(id: string, data: Partial<Branch>): Promise<Branch | null>;
}

export interface BusinessRepository {
  getById(id: string): Promise<Business | null>;
  update(id: string, data: Partial<Business>): Promise<Business | null>;
}

export interface NotificationRepository {
  getAll(filters?: { isRead?: boolean }): Promise<Notification[]>;
  getById(id: string): Promise<Notification | null>;
  create(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}

export interface AuditLogRepository {
  getAll(filters?: { entity?: string; entityId?: string; actorId?: string; from?: string; to?: string }): Promise<AuditLog[]>;
  create(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
}

export interface PurchaseOrderRepository {
  getAll(filters?: { status?: string; branchId?: string; supplierId?: string }): Promise<PurchaseOrder[]>;
  getById(id: string): Promise<PurchaseOrder | null>;
  create(po: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">): Promise<PurchaseOrder>;
  update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder | null>;
}

export interface StockTransferRepository {
  getAll(filters?: { status?: string; fromBranchId?: string; toBranchId?: string }): Promise<StockTransfer[]>;
  getById(id: string): Promise<StockTransfer | null>;
  create(transfer: Omit<StockTransfer, "id" | "createdAt" | "updatedAt">): Promise<StockTransfer>;
  update(id: string, data: Partial<StockTransfer>): Promise<StockTransfer | null>;
}
