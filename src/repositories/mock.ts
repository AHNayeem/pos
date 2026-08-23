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
import type {
  ProductRepository,
  CategoryRepository,
  BrandRepository,
  CustomerRepository,
  SupplierRepository,
  OrderRepository,
  PaymentRepository,
  InventoryRepository,
  StockMovementRepository,
  ShiftRepository,
  TaxRepository,
  DiscountRepository,
  PromotionRepository,
  ExpenseRepository,
  RefundRepository,
  ReturnRepository,
  UserRepository,
  RoleRepository,
  BranchRepository,
  BusinessRepository,
  NotificationRepository,
  AuditLogRepository,
  PurchaseOrderRepository,
  StockTransferRepository,
} from "./interfaces";

const now = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 11);

const business: Business = {
  id: "biz-1",
  name: "Demo Mart",
  type: "retail",
  address: "123 Main Street, Dhaka",
  phone: "+880-1711-000000",
  email: "info@demomart.com",
  currency: "BDT",
  taxId: "TAX-123456",
  createdAt: now(),
  updatedAt: now(),
};

const branches: Branch[] = [
  { id: "br-1", businessId: business.id, name: "Main Branch", address: "123 Main Street", phone: "+880-1711-000001", managerId: "usr-2", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "br-2", businessId: business.id, name: "Gulshan Branch", address: "45 Gulshan Ave", phone: "+880-1711-000002", managerId: "usr-3", isActive: true, createdAt: now(), updatedAt: now() },
];

const roles: Role[] = [
  { id: "role-1", name: "owner", description: "Full access", permissions: ["*"] },
  { id: "role-2", name: "manager", description: "Management access", permissions: ["products.read", "products.write", "orders.read", "orders.write", "reports.read", "customers.read", "suppliers.read", "purchases.write", "inventory.read", "inventory.write"] },
  { id: "role-3", name: "cashier", description: "POS access", permissions: ["pos.read", "pos.write", "orders.read", "customers.read"] },
  { id: "role-4", name: "inventory_manager", description: "Inventory access", permissions: ["products.read", "products.write", "inventory.read", "inventory.write", "purchases.read", "purchases.write"] },
  { id: "role-5", name: "accountant", description: "Accounting access", permissions: ["reports.read", "expenses.write", "payments.read"] },
];

const users: User[] = [
  { id: "usr-1", email: "owner@demomart.com", name: "System Owner", role: "owner", branchId: "br-1", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "usr-2", email: "manager@demomart.com", name: "Alice Manager", role: "manager", branchId: "br-1", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "usr-3", email: "manager2@demomart.com", name: "Bob Manager", role: "manager", branchId: "br-2", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "usr-4", email: "cashier@demomart.com", name: "Charlie Cashier", role: "cashier", branchId: "br-1", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "usr-5", email: "inventory@demomart.com", name: "Diana Inventory", role: "inventory_manager", branchId: "br-1", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "usr-6", email: "accountant@demomart.com", name: "Evan Accountant", role: "accountant", branchId: "br-1", isActive: true, createdAt: now(), updatedAt: now() },
];

const categories: Category[] = [
  { id: "cat-1", name: "Beverages", description: "Drinks and beverages", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cat-2", name: "Snacks", description: "Snack items", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cat-3", name: "Dairy", description: "Dairy products", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cat-4", name: "Electronics", description: "Electronic items", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cat-5", name: "Clothing", description: "Apparel items", isActive: true, createdAt: now(), updatedAt: now() },
];

const brands: Brand[] = [
  { id: "brand-1", name: "Coca-Cola", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "brand-2", name: "Pepsi", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "brand-3", name: "Nestle", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "brand-4", name: "Local Brand", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "brand-5", name: "Samsung", isActive: true, createdAt: now(), updatedAt: now() },
];

const products: Product[] = [
  { id: "prod-1", categoryId: "cat-1", brandId: "brand-1", name: "Coca-Cola 500ml", description: "Carbonated soft drink", imageUrl: "/images/products/cola.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
  { id: "prod-2", categoryId: "cat-1", brandId: "brand-2", name: "Pepsi 500ml", description: "Carbonated soft drink", imageUrl: "/images/products/pepsi.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
  { id: "prod-3", categoryId: "cat-2", brandId: "brand-4", name: "Potato Chips", description: "Classic salted chips", imageUrl: "/images/products/chips.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
  { id: "prod-4", categoryId: "cat-3", brandId: "brand-3", name: "Fresh Milk 1L", description: "Full cream milk", imageUrl: "/images/products/milk.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
  { id: "prod-5", categoryId: "cat-4", brandId: "brand-5", name: "Samsung Phone", description: "Smartphone", imageUrl: "/images/products/phone.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
  { id: "prod-6", categoryId: "cat-5", brandId: "brand-4", name: "T-Shirt", description: "Cotton t-shirt", imageUrl: "/images/products/tshirt.png", variants: [], isActive: true, createdAt: now(), updatedAt: now() },
];

const variants: ProductVariant[] = [
  { id: "var-1", productId: "prod-1", name: "500ml", sku: "CC-500", barcode: "1234567890123", costPrice: 20, sellingPrice: 30, taxRate: 5, unit: "pcs", attributes: { size: "500ml" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-2", productId: "prod-1", name: "1L", sku: "CC-1000", barcode: "1234567890124", costPrice: 35, sellingPrice: 50, taxRate: 5, unit: "pcs", attributes: { size: "1L" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-3", productId: "prod-2", name: "500ml", sku: "PP-500", barcode: "1234567890125", costPrice: 20, sellingPrice: 30, taxRate: 5, unit: "pcs", attributes: { size: "500ml" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-4", productId: "prod-3", name: "Regular", sku: "PC-REG", barcode: "1234567890126", costPrice: 15, sellingPrice: 25, taxRate: 5, unit: "pcs", attributes: { size: "regular" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-5", productId: "prod-4", name: "1L", sku: "NM-1L", barcode: "1234567890127", costPrice: 60, sellingPrice: 90, taxRate: 5, unit: "pcs", attributes: { size: "1L" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-6", productId: "prod-5", name: "128GB", sku: "SM-128", barcode: "1234567890128", costPrice: 25000, sellingPrice: 35000, taxRate: 10, unit: "pcs", attributes: { storage: "128GB" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-7", productId: "prod-6", name: "M", sku: "TS-M", barcode: "1234567890129", costPrice: 150, sellingPrice: 300, taxRate: 5, unit: "pcs", attributes: { size: "M" }, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "var-8", productId: "prod-6", name: "L", sku: "TS-L", barcode: "1234567890130", costPrice: 150, sellingPrice: 300, taxRate: 5, unit: "pcs", attributes: { size: "L" }, isActive: true, createdAt: now(), updatedAt: now() },
];

products.forEach((p) => {
  p.variants = variants.filter((v) => v.productId === p.id);
});

const suppliers: Supplier[] = [
  { id: "sup-1", name: "Global Beverages Ltd", contactPerson: "Mr. Karim", email: "karim@globalbev.com", phone: "+880-1711-100001", address: "45 Industrial Area", taxId: "GST-001", openingBalance: 0, currentBalance: 15000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "sup-2", name: "Fresh Dairy Co", contactPerson: "Ms. Rahim", email: "rahim@freshdairy.com", phone: "+880-1711-100002", address: "78 Farm Road", taxId: "GST-002", openingBalance: 5000, currentBalance: 3000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "sup-3", name: "Tech Gadgets Inc", contactPerson: "Mr. Ahmed", email: "ahmed@techgadgets.com", phone: "+880-1711-100003", address: "12 Tech Park", taxId: "GST-003", openingBalance: 0, currentBalance: 50000, isActive: true, createdAt: now(), updatedAt: now() },
];

const customers: Customer[] = [
  { id: "cust-1", name: "John Doe", email: "john@example.com", phone: "+880-1711-200001", address: "101 Oak Street", openingBalance: 0, currentBalance: 0, loyaltyPoints: 120, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cust-2", name: "Jane Smith", email: "jane@example.com", phone: "+880-1711-200002", address: "202 Pine Avenue", openingBalance: 0, currentBalance: 500, loyaltyPoints: 50, isActive: true, createdAt: now(), updatedAt: now() },
  { id: "cust-3", name: "Walk-in Customer", phone: "N/A", openingBalance: 0, currentBalance: 0, loyaltyPoints: 0, isActive: true, createdAt: now(), updatedAt: now() },
];

const taxes: Tax[] = [
  { id: "tax-1", name: "VAT 5%", rate: 5, type: "percentage", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "tax-2", name: "VAT 10%", rate: 10, type: "percentage", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "tax-3", name: "No Tax", rate: 0, type: "percentage", isActive: true, createdAt: now(), updatedAt: now() },
];

const discounts: Discount[] = [
  { id: "disc-1", name: "New Year Sale", code: "NEWYEAR25", type: "percentage", value: 25, minPurchase: 500, maxDiscount: 1000, startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-01-31T23:59:59Z", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "disc-2", name: "Flat 50 Off", code: "FLAT50", type: "fixed", value: 50, minPurchase: 200, startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-12-31T23:59:59Z", isActive: true, createdAt: now(), updatedAt: now() },
];

const promotions: Promotion[] = [
  { id: "promo-1", name: "Buy 2 Get 1 Free", description: "Buy 2 variants of same product, get 1 free", type: "bogo", buyQuantity: 2, getQuantity: 1, startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-12-31T23:59:59Z", isActive: true, createdAt: now(), updatedAt: now() },
  { id: "promo-2", name: "Combo Deal", description: "Cola + Chips combo discount", type: "combo", comboProductIds: ["var-1", "var-4"], value: 10, startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-12-31T23:59:59Z", isActive: true, createdAt: now(), updatedAt: now() },
];

const orders: Order[] = [
  { id: "ord-1", orderNumber: "POS-0001", branchId: "br-1", customerId: "cust-1", cashierId: "usr-4", items: [], subtotal: 120, taxAmount: 6, discountAmount: 0, grandTotal: 126, paymentStatus: "paid", paymentMethod: "cash", paidAmount: 126, changeAmount: 0, status: "completed", createdAt: now(), updatedAt: now() },
  { id: "ord-2", orderNumber: "POS-0002", branchId: "br-1", customerId: "cust-2", cashierId: "usr-4", items: [], subtotal: 35000, taxAmount: 3500, discountAmount: 500, grandTotal: 38000, paymentStatus: "paid", paymentMethod: "card", paidAmount: 38000, changeAmount: 0, status: "completed", createdAt: now(), updatedAt: now() },
  { id: "ord-3", orderNumber: "POS-0003", branchId: "br-1", cashierId: "usr-4", items: [], subtotal: 90, taxAmount: 4.5, discountAmount: 0, grandTotal: 94.5, paymentStatus: "partial", paymentMethod: "cash", paidAmount: 50, changeAmount: 0, status: "completed", createdAt: now(), updatedAt: now() },
];

const payments: Payment[] = [
  { id: "pay-1", orderId: "ord-1", method: "cash", amount: 126, createdAt: now() },
  { id: "pay-2", orderId: "ord-2", method: "card", amount: 38000, createdAt: now() },
  { id: "pay-3", orderId: "ord-3", method: "cash", amount: 50, createdAt: now() },
];

const inventory: Inventory[] = [
  { id: "inv-1", productVariantId: "var-1", branchId: "br-1", quantity: 500, minStockLevel: 50, maxStockLevel: 1000, updatedAt: now() },
  { id: "inv-2", productVariantId: "var-2", branchId: "br-1", quantity: 300, minStockLevel: 30, maxStockLevel: 500, updatedAt: now() },
  { id: "inv-3", productVariantId: "var-3", branchId: "br-1", quantity: 400, minStockLevel: 50, maxStockLevel: 800, updatedAt: now() },
  { id: "inv-4", productVariantId: "var-4", branchId: "br-1", quantity: 200, minStockLevel: 20, maxStockLevel: 400, updatedAt: now() },
  { id: "inv-5", productVariantId: "var-5", branchId: "br-1", quantity: 100, minStockLevel: 10, maxStockLevel: 200, updatedAt: now() },
  { id: "inv-6", productVariantId: "var-6", branchId: "br-1", quantity: 25, minStockLevel: 5, maxStockLevel: 50, updatedAt: now() },
  { id: "inv-7", productVariantId: "var-7", branchId: "br-1", quantity: 80, minStockLevel: 10, maxStockLevel: 200, updatedAt: now() },
  { id: "inv-8", productVariantId: "var-8", branchId: "br-1", quantity: 75, minStockLevel: 10, maxStockLevel: 200, updatedAt: now() },
];

const stockMovements: StockMovement[] = [
  { id: "mov-1", productVariantId: "var-1", branchId: "br-1", type: "purchase", quantity: 500, referenceId: "po-1", actorId: "usr-5", createdAt: now() },
  { id: "mov-2", productVariantId: "var-3", branchId: "br-1", type: "sale", quantity: -50, referenceId: "ord-1", actorId: "usr-4", createdAt: now() },
  { id: "mov-3", productVariantId: "var-6", branchId: "br-1", type: "sale", quantity: -1, referenceId: "ord-2", actorId: "usr-4", createdAt: now() },
];

const shifts: Shift[] = [
  { id: "shift-1", branchId: "br-1", userId: "usr-4", openedAt: now(), openingCash: 5000, cashSales: 126, cardSales: 38000, mobileSales: 0, creditSales: 0, totalSales: 38126, totalRefunds: 0, totalCashIn: 0, totalCashOut: 0, status: "open", createdAt: now(), updatedAt: now() },
];

const expenses: Expense[] = [
  { id: "exp-1", branchId: "br-1", category: "Utilities", amount: 5000, note: "Electricity bill", actorId: "usr-2", createdAt: now() },
  { id: "exp-2", branchId: "br-1", category: "Salary", amount: 25000, note: "Staff salary", actorId: "usr-2", createdAt: now() },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: "po-1", poNumber: "PO-0001", branchId: "br-1", supplierId: "sup-1", items: [], subtotal: 10000, taxAmount: 500, grandTotal: 10500, status: "received", createdBy: "usr-5", receivedBy: "usr-5", receivedAt: now(), createdAt: now(), updatedAt: now() },
];

const notifications: Notification[] = [
  { id: "notif-1", type: "success", title: "Order Completed", message: "Order POS-0002 has been completed", isRead: true, createdAt: now() },
  { id: "notif-2", type: "warning", title: "Low Stock", message: "Samsung Phone is running low on stock", isRead: false, createdAt: now() },
  { id: "notif-3", type: "info", title: "New Supplier", message: "Tech Gadgets Inc has been added", isRead: false, createdAt: now() },
];

const auditLogs: AuditLog[] = [
  { id: "log-1", actorId: "usr-4", actorName: "Charlie Cashier", action: "create", entity: "order", entityId: "ord-1", after: { orderNumber: "POS-0001", grandTotal: 126 }, createdAt: now() },
  { id: "log-2", actorId: "usr-5", actorName: "Diana Inventory", action: "update", entity: "inventory", entityId: "inv-6", before: { quantity: 26 }, after: { quantity: 25 }, reason: "Stock sold", createdAt: now() },
];

const stockTransfers: StockTransfer[] = [];

const returns: Return[] = [];

const refunds: Refund[] = [];

type RepoState = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  customers: Customer[];
  suppliers: Supplier[];
  orders: Order[];
  payments: Payment[];
  inventory: Inventory[];
  stockMovements: StockMovement[];
  shifts: Shift[];
  taxes: Tax[];
  discounts: Discount[];
  promotions: Promotion[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  stockTransfers: StockTransfer[];
  returns: Return[];
  refunds: Refund[];
  users: User[];
  roles: Role[];
  branches: Branch[];
};

const state: RepoState = {
  products,
  categories,
  brands,
  customers,
  suppliers,
  orders,
  payments,
  inventory,
  stockMovements,
  shifts,
  taxes,
  discounts,
  promotions,
  expenses,
  purchaseOrders,
  notifications,
  auditLogs,
  stockTransfers,
  returns,
  refunds,
  users,
  roles,
  branches,
};

const productRepo: ProductRepository = {
  async getAll(filters) {
    let data = state.products.map((p) => ({
      ...p,
      variants: variants.filter((v) => v.productId === p.id),
    }));
    if (filters?.categoryId) data = data.filter((p) => p.categoryId === filters.categoryId);
    if (filters?.brandId) data = data.filter((p) => p.brandId === filters.brandId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return data;
  },
  async getById(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return null;
    return { ...p, variants: variants.filter((v) => v.productId === p.id) };
  },
  async getVariantById(id) {
    return variants.find((v) => v.id === id) || null;
  },
  async create(product) {
    const newProduct: Product = {
      ...product,
      id: `prod-${id()}`,
      createdAt: now(),
      updatedAt: now(),
    };
    newProduct.variants.forEach((v) => {
      const variant: ProductVariant = { ...v, id: `var-${id()}`, productId: newProduct.id, createdAt: now(), updatedAt: now() };
      variants.push(variant);
    });
    state.products.push(newProduct);
    return newProduct;
  },
  async update(id, data) {
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updatedVariants = data.variants;
    state.products[idx] = { ...state.products[idx], ...data, updatedAt: now() };
    if (updatedVariants) {
      for (let i = variants.length - 1; i >= 0; i--) {
        if (variants[i].productId === id) variants.splice(i, 1);
      }
      updatedVariants.forEach((v) => {
        const variant: ProductVariant = { ...v, id: v.id || `var-${Math.random().toString(36).slice(2, 11)}`, productId: id, createdAt: now(), updatedAt: now() };
        variants.push(variant);
      });
    }
    return state.products[idx];
  },
  async archive(id) {
    for (let i = variants.length - 1; i >= 0; i--) {
      if (variants[i].productId === id) variants.splice(i, 1);
    }
    state.products = state.products.filter((p) => p.id !== id);
  },
};

const categoryRepo: CategoryRepository = {
  async getAll() {
    return [...state.categories];
  },
  async getById(id) {
    return state.categories.find((c) => c.id === id) || null;
  },
  async create(category) {
    const newCat: Category = { ...category, id: `cat-${id()}`, createdAt: now(), updatedAt: now() };
    state.categories.push(newCat);
    return newCat;
  },
  async update(id, data) {
    const idx = state.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    state.categories[idx] = { ...state.categories[idx], ...data, updatedAt: now() };
    return state.categories[idx];
  },
  async archive(id) {
    state.categories = state.categories.filter((c) => c.id !== id);
  },
};

const brandRepo: BrandRepository = {
  async getAll() {
    return [...state.brands];
  },
  async getById(id) {
    return state.brands.find((b) => b.id === id) || null;
  },
  async create(brand) {
    const newBrand: Brand = { ...brand, id: `brand-${id()}`, createdAt: now(), updatedAt: now() };
    state.brands.push(newBrand);
    return newBrand;
  },
  async update(id, data) {
    const idx = state.brands.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    state.brands[idx] = { ...state.brands[idx], ...data, updatedAt: now() };
    return state.brands[idx];
  },
  async archive(id) {
    state.brands = state.brands.filter((b) => b.id !== id);
  },
};

const customerRepo: CustomerRepository = {
  async getAll(filters) {
    let data = [...state.customers];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return data;
  },
  async getById(id) {
    return state.customers.find((c) => c.id === id) || null;
  },
  async create(customer) {
    const newCust: Customer = { ...customer, id: `cust-${id()}`, createdAt: now(), updatedAt: now() };
    state.customers.push(newCust);
    return newCust;
  },
  async update(id, data) {
    const idx = state.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    state.customers[idx] = { ...state.customers[idx], ...data, updatedAt: now() };
    return state.customers[idx];
  },
  async archive(id) {
    state.customers = state.customers.filter((c) => c.id !== id);
  },
};

const supplierRepo: SupplierRepository = {
  async getAll(filters) {
    let data = [...state.suppliers];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q));
    }
    return data;
  },
  async getById(id) {
    return state.suppliers.find((s) => s.id === id) || null;
  },
  async create(supplier) {
    const newSup: Supplier = { ...supplier, id: `sup-${id()}`, createdAt: now(), updatedAt: now() };
    state.suppliers.push(newSup);
    return newSup;
  },
  async update(id, data) {
    const idx = state.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    state.suppliers[idx] = { ...state.suppliers[idx], ...data, updatedAt: now() };
    return state.suppliers[idx];
  },
  async archive(id) {
    state.suppliers = state.suppliers.filter((s) => s.id !== id);
  },
};

const orderRepo: OrderRepository = {
  async getAll(filters) {
    let data = [...state.orders];
    if (filters?.status) data = data.filter((o) => o.status === filters.status);
    if (filters?.branchId) data = data.filter((o) => o.branchId === filters.branchId);
    if (filters?.from) data = data.filter((o) => new Date(o.createdAt) >= new Date(filters.from!));
    if (filters?.to) data = data.filter((o) => new Date(o.createdAt) <= new Date(filters.to!));
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getById(id) {
    return state.orders.find((o) => o.id === id) || null;
  },
  async getByNumber(orderNumber) {
    return state.orders.find((o) => o.orderNumber === orderNumber) || null;
  },
  async create(order) {
    const newOrder: Order = { ...order, id: `ord-${id()}`, createdAt: now(), updatedAt: now() };
    state.orders.push(newOrder);
    return newOrder;
  },
  async update(id, data) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    state.orders[idx] = { ...state.orders[idx], ...data, updatedAt: now() };
    return state.orders[idx];
  },
};

const paymentRepo: PaymentRepository = {
  async getAll(filters) {
    let data = [...state.payments];
    if (filters?.orderId) data = data.filter((p) => p.orderId === filters.orderId);
    return data;
  },
  async getById(id) {
    return state.payments.find((p) => p.id === id) || null;
  },
  async create(payment) {
    const newPayment: Payment = { ...payment, id: `pay-${id()}`, createdAt: now() };
    state.payments.push(newPayment);
    return newPayment;
  },
};

const inventoryRepo: InventoryRepository = {
  async getAll(filters) {
    let data = [...state.inventory];
    if (filters?.branchId) data = data.filter((i) => i.branchId === filters.branchId);
    if (filters?.productVariantId) data = data.filter((i) => i.productVariantId === filters.productVariantId);
    if (filters?.lowStock) data = data.filter((i) => i.quantity <= i.minStockLevel);
    return data;
  },
  async getByVariant(variantId, branchId) {
    return state.inventory.find((i) => i.productVariantId === variantId && i.branchId === branchId) || null;
  },
  async adjustStock(variantId, branchId, quantity, type, actorId, referenceId, note) {
    let inv = state.inventory.find((i) => i.productVariantId === variantId && i.branchId === branchId);
    if (!inv) {
      inv = {
        id: `inv-${id()}`,
        productVariantId: variantId,
        branchId,
        quantity: 0,
        minStockLevel: 10,
        maxStockLevel: 1000,
        updatedAt: now(),
      };
      state.inventory.push(inv);
    }
    inv.quantity = Math.max(0, inv.quantity + quantity);
    inv.updatedAt = now();
    state.stockMovements.push({
      id: `mov-${id()}`,
      productVariantId: variantId,
      branchId,
      type,
      quantity,
      referenceId,
      note,
      actorId,
      createdAt: now(),
    });
    return inv;
  },
};

const stockMovementRepo: StockMovementRepository = {
  async getAll(filters) {
    let data = [...state.stockMovements];
    if (filters?.branchId) data = data.filter((m) => m.branchId === filters.branchId);
    if (filters?.productVariantId) data = data.filter((m) => m.productVariantId === filters.productVariantId);
    if (filters?.type) data = data.filter((m) => m.type === filters.type);
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async create(movement) {
    const newMovement: StockMovement = { ...movement, id: `mov-${id()}`, createdAt: now() };
    state.stockMovements.push(newMovement);
    return newMovement;
  },
};

const shiftRepo: ShiftRepository = {
  async getAll(filters) {
    let data = [...state.shifts];
    if (filters?.branchId) data = data.filter((s) => s.branchId === filters.branchId);
    if (filters?.status) data = data.filter((s) => s.status === filters.status);
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getActive(branchId, userId) {
    return state.shifts.find((s) => s.branchId === branchId && s.userId === userId && s.status === "open") || null;
  },
  async getById(id) {
    return state.shifts.find((s) => s.id === id) || null;
  },
  async create(shift) {
    const newShift: Shift = { ...shift, id: `shift-${id()}`, createdAt: now(), updatedAt: now() };
    state.shifts.push(newShift);
    return newShift;
  },
  async update(id, data) {
    const idx = state.shifts.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    state.shifts[idx] = { ...state.shifts[idx], ...data, updatedAt: now() };
    return state.shifts[idx];
  },
};

const taxRepo: TaxRepository = {
  async getAll() {
    return [...state.taxes];
  },
  async getById(id) {
    return state.taxes.find((t) => t.id === id) || null;
  },
  async create(tax) {
    const newTax: Tax = { ...tax, id: `tax-${id()}`, createdAt: now(), updatedAt: now() };
    state.taxes.push(newTax);
    return newTax;
  },
  async update(id, data) {
    const idx = state.taxes.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    state.taxes[idx] = { ...state.taxes[idx], ...data, updatedAt: now() };
    return state.taxes[idx];
  },
};

const discountRepo: DiscountRepository = {
  async getAll(filters) {
    let data = [...state.discounts];
    if (filters?.active !== undefined) data = data.filter((d) => d.isActive === filters.active);
    return data;
  },
  async getById(id) {
    return state.discounts.find((d) => d.id === id) || null;
  },
  async getByCode(code) {
    return state.discounts.find((d) => d.code === code) || null;
  },
  async create(discount) {
    const newDisc: Discount = { ...discount, id: `disc-${id()}`, createdAt: now(), updatedAt: now() };
    state.discounts.push(newDisc);
    return newDisc;
  },
  async update(id, data) {
    const idx = state.discounts.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    state.discounts[idx] = { ...state.discounts[idx], ...data, updatedAt: now() };
    return state.discounts[idx];
  },
};

const promotionRepo: PromotionRepository = {
  async getAll(filters) {
    let data = [...state.promotions];
    if (filters?.active !== undefined) data = data.filter((p) => p.isActive === filters.active);
    return data;
  },
  async getById(id) {
    return state.promotions.find((p) => p.id === id) || null;
  },
  async create(promotion) {
    const newPromo: Promotion = { ...promotion, id: `promo-${id()}`, createdAt: now(), updatedAt: now() };
    state.promotions.push(newPromo);
    return newPromo;
  },
  async update(id, data) {
    const idx = state.promotions.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.promotions[idx] = { ...state.promotions[idx], ...data, updatedAt: now() };
    return state.promotions[idx];
  },
};

const expenseRepo: ExpenseRepository = {
  async getAll(filters) {
    let data = [...state.expenses];
    if (filters?.branchId) data = data.filter((e) => e.branchId === filters.branchId);
    if (filters?.category) data = data.filter((e) => e.category === filters.category);
    if (filters?.from) data = data.filter((e) => new Date(e.createdAt) >= new Date(filters.from!));
    if (filters?.to) data = data.filter((e) => new Date(e.createdAt) <= new Date(filters.to!));
    return data;
  },
  async getById(id) {
    return state.expenses.find((e) => e.id === id) || null;
  },
  async create(expense) {
    const newExp: Expense = { ...expense, id: `exp-${id()}`, createdAt: now() };
    state.expenses.push(newExp);
    return newExp;
  },
};

const refundRepo: RefundRepository = {
  async getAll(filters) {
    let data = [...state.refunds];
    if (filters?.orderId) data = data.filter((r) => r.orderId === filters.orderId);
    if (filters?.status) data = data.filter((r) => r.status === filters.status);
    return data;
  },
  async getById(id) {
    return state.refunds.find((r) => r.id === id) || null;
  },
  async create(refund) {
    const newRefund: Refund = { ...refund, id: `refund-${id()}`, createdAt: now(), updatedAt: now() };
    state.refunds.push(newRefund);
    return newRefund;
  },
  async update(id, data) {
    const idx = state.refunds.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    state.refunds[idx] = { ...state.refunds[idx], ...data, updatedAt: now() };
    return state.refunds[idx];
  },
};

const returnRepo: ReturnRepository = {
  async getAll(filters) {
    let data = [...state.returns];
    if (filters?.orderId) data = data.filter((r) => r.orderId === filters.orderId);
    if (filters?.status) data = data.filter((r) => r.status === filters.status);
    return data;
  },
  async getById(id) {
    return state.returns.find((r) => r.id === id) || null;
  },
  async create(return_) {
    const newReturn: Return = { ...return_, id: `return-${id()}`, createdAt: now(), updatedAt: now() };
    state.returns.push(newReturn);
    return newReturn;
  },
  async update(id, data) {
    const idx = state.returns.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    state.returns[idx] = { ...state.returns[idx], ...data, updatedAt: now() };
    return state.returns[idx];
  },
};

const userRepo: UserRepository = {
  async getAll(filters) {
    let data = [...state.users];
    if (filters?.role) data = data.filter((u) => u.role === filters.role);
    if (filters?.branchId) data = data.filter((u) => u.branchId === filters.branchId);
    return data;
  },
  async getById(id) {
    return state.users.find((u) => u.id === id) || null;
  },
  async getByEmail(email) {
    return state.users.find((u) => u.email === email) || null;
  },
  async create(user) {
    const newUser: User = { ...user, id: `usr-${id()}`, createdAt: now(), updatedAt: now() };
    state.users.push(newUser);
    return newUser;
  },
  async update(id, data) {
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    state.users[idx] = { ...state.users[idx], ...data, updatedAt: now() };
    return state.users[idx];
  },
};

const roleRepo: RoleRepository = {
  async getAll() {
    return [...state.roles];
  },
  async getById(id) {
    return state.roles.find((r) => r.id === id) || null;
  },
  async getByName(name) {
    return state.roles.find((r) => r.name === name) || null;
  },
};

const branchRepo: BranchRepository = {
  async getAll(filters) {
    let data = [...state.branches];
    if (filters?.businessId) data = data.filter((b) => b.businessId === filters.businessId);
    return data;
  },
  async getById(id) {
    return state.branches.find((b) => b.id === id) || null;
  },
  async create(branch) {
    const newBranch: Branch = { ...branch, id: `br-${id()}`, createdAt: now(), updatedAt: now() };
    state.branches.push(newBranch);
    return newBranch;
  },
  async update(id, data) {
    const idx = state.branches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    state.branches[idx] = { ...state.branches[idx], ...data, updatedAt: now() };
    return state.branches[idx];
  },
};

const businessRepo: BusinessRepository = {
  async getById(id) {
    return business.id === id ? { ...business } : null;
  },
  async update(id, data) {
    if (business.id !== id) return null;
    Object.assign(business, data, { updatedAt: now() });
    return { ...business };
  },
};

const notificationRepo: NotificationRepository = {
  async getAll(filters) {
    let data = [...state.notifications];
    if (filters?.isRead !== undefined) data = data.filter((n) => n.isRead === filters.isRead);
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getById(id) {
    return state.notifications.find((n) => n.id === id) || null;
  },
  async create(notification) {
    const newNotif: Notification = { ...notification, id: `notif-${id()}`, createdAt: now() };
    state.notifications.push(newNotif);
    return newNotif;
  },
  async markAsRead(id) {
    const n = state.notifications.find((x) => x.id === id);
    if (n) n.isRead = true;
  },
  async markAllAsRead() {
    state.notifications.forEach((n) => (n.isRead = true));
  },
};

const auditLogRepo: AuditLogRepository = {
  async getAll(filters) {
    let data = [...state.auditLogs];
    if (filters?.entity) data = data.filter((l) => l.entity === filters.entity);
    if (filters?.entityId) data = data.filter((l) => l.entityId === filters.entityId);
    if (filters?.actorId) data = data.filter((l) => l.actorId === filters.actorId);
    if (filters?.from) data = data.filter((l) => new Date(l.createdAt) >= new Date(filters.from!));
    if (filters?.to) data = data.filter((l) => new Date(l.createdAt) <= new Date(filters.to!));
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async create(log) {
    const newLog: AuditLog = { ...log, id: `log-${id()}`, createdAt: now() };
    state.auditLogs.push(newLog);
    return newLog;
  },
};

const purchaseOrderRepo: PurchaseOrderRepository = {
  async getAll(filters) {
    let data = [...state.purchaseOrders];
    if (filters?.status) data = data.filter((p) => p.status === filters.status);
    if (filters?.branchId) data = data.filter((p) => p.branchId === filters.branchId);
    if (filters?.supplierId) data = data.filter((p) => p.supplierId === filters.supplierId);
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getById(id) {
    return state.purchaseOrders.find((p) => p.id === id) || null;
  },
  async create(po) {
    const newPo: PurchaseOrder = { ...po, id: `po-${id()}`, createdAt: now(), updatedAt: now() };
    state.purchaseOrders.push(newPo);
    return newPo;
  },
  async update(id, data) {
    const idx = state.purchaseOrders.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.purchaseOrders[idx] = { ...state.purchaseOrders[idx], ...data, updatedAt: now() };
    return state.purchaseOrders[idx];
  },
};

const stockTransferRepo: StockTransferRepository = {
  async getAll(filters) {
    let data = [...state.stockTransfers];
    if (filters?.status) data = data.filter((t) => t.status === filters.status);
    if (filters?.fromBranchId) data = data.filter((t) => t.fromBranchId === filters.fromBranchId);
    if (filters?.toBranchId) data = data.filter((t) => t.toBranchId === filters.toBranchId);
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async getById(id) {
    return state.stockTransfers.find((t) => t.id === id) || null;
  },
  async create(transfer) {
    const newTransfer: StockTransfer = { ...transfer, id: `transfer-${id()}`, createdAt: now(), updatedAt: now() };
    state.stockTransfers.push(newTransfer);
    return newTransfer;
  },
  async update(id, data) {
    const idx = state.stockTransfers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    state.stockTransfers[idx] = { ...state.stockTransfers[idx], ...data, updatedAt: now() };
    return state.stockTransfers[idx];
  },
};

const repositories = {
  product: productRepo,
  category: categoryRepo,
  brand: brandRepo,
  customer: customerRepo,
  supplier: supplierRepo,
  order: orderRepo,
  payment: paymentRepo,
  inventory: inventoryRepo,
  stockMovement: stockMovementRepo,
  shift: shiftRepo,
  tax: taxRepo,
  discount: discountRepo,
  promotion: promotionRepo,
  expense: expenseRepo,
  refund: refundRepo,
  return: returnRepo,
  user: userRepo,
  role: roleRepo,
  branch: branchRepo,
  business: businessRepo,
  notification: notificationRepo,
  auditLog: auditLogRepo,
  purchaseOrder: purchaseOrderRepo,
  stockTransfer: stockTransferRepo,
};

export { repositories, state, business, branches, users };
