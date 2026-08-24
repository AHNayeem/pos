# POS REMEDIATION ROADMAP

## IMPORTANT: PLANNING-ONLY DOCUMENT
This document is the result of analyzing the audit (`POS-COMPLETE-IMPLEMENTATION-AUDIT.md`) together with the actual codebase. No application code was modified, refactored, or fixed during this analysis.

---

## 1. Audit Verification Summary

The audit was verified against the actual source code. Key findings confirmed:

| Finding | Verification Status | Evidence |
|---------|---------------------|----------|
| Entire data layer is mock/in-memory | **Confirmed** | `src/repositories/index.ts:1` exports `./mock`; `mock.ts` is 1,192 lines |
| No real authentication | **Confirmed** | `src/services/auth.ts:36` token = `pos-token-${user.id}-${Date.now()}`; no password verification |
| Checkout does not create Sale | **Confirmed** | `src/services/index.ts:176` creates Order; `SaleService.createSale` is never called from checkout |
| Shift totals never updated | **Confirmed** | `src/services/index.ts:114-263` does not update `shift.cashSales/cardSales/mobileSales/creditSales` |
| costPrice hardcoded to 0 | **Confirmed** | `src/services/index.ts:145` and `:283` |
| Refunds do not create refund payments | **Confirmed** | `src/services/refunds.ts:68-100` restores stock only; no payment created |
| Stock transfer source not decreased | **Confirmed** | `src/services/stockTransfer.ts:67-102` only increases destination inventory |
| Customer balance never decreases | **Confirmed** | `src/services/payments.ts:24-74` updates order `paidAmount` but never touches `customer.currentBalance` |
| Partial receive payable wrong | **Confirmed** | `src/services/purchasing.ts:176-188` uses `po.grandTotal` for both full and partial receive |
| Hardcoded IDs in pages | **Confirmed** | `biz-1` in `settings/business/page.tsx:14`; `br-1` in `pos/page.tsx:14`, `reports/page.tsx:18`; `usr-1` in `PurchasingManagement.tsx:221,263`, `InventoryManagement.tsx:143` |
| No tests | **Confirmed** | Zero test files found in project (excluding `node_modules`) |
| Discounts not in POS UI | **Confirmed** | `pos/cashier/page.tsx` has no discount code input; `PricingService.calculateCart` exists but is never called from POS |
| Promotions never evaluated | **Confirmed** | `promotions.ts` defines BOGO/combo but no checkout code evaluates them |
| No cash in/out | **Confirmed** | `ShiftService` has no cash-in/cash-out methods |
| Cart does not persist | **Confirmed** | `src/stores/index.ts` Zustand stores have no `persist` middleware |

One correction to the audit: `PosService.checkout` line 256 calls `repositories.sale.update(savedOrder.id, ...)` using the **order ID** to update a **sale**. Since no sale is created, this call targets a non-existent sale record. The audit correctly notes the missing invoice creation but does not flag the incorrect ID usage; this is an additional bug.

---

## 2. Root Cause Analysis

Do not treat every symptom as a separate phase. The following root causes explain multiple symptoms:

### Root Cause A: POS Transaction Orchestration is Incomplete
**Symptoms:**
- Checkout does not create invoices/sales
- Shift totals are never updated
- costPrice is hardcoded to 0
- Order numbers can collide

**Underlying cause:** `PosService.checkout` stops after creating an `Order` and `Payment`. It never calls `SaleService.createSale`, never updates `Shift` totals, and hardcodes `costPrice: 0`.

### Root Cause B: Inventory Movement Engine is Incomplete
**Symptoms:**
- Stock transfers duplicate stock (source never decreases)
- No auto-creation of inventory when products are created
- No stock counting/physical inventory workflow
- No validation that source branch has sufficient stock before transfer
- Hardcoded `actorId` in stock adjustments

**Underlying cause:** `InventoryService` and `StockTransferService` handle only one side of transfers. There is no unified stock-movement engine that validates, records, and balances all inventory changes.

### Root Cause C: Payment & Financial Integration is Incomplete
**Symptoms:**
- Refunds do not create refund payments
- Customer balances only increase, never decrease
- Partial purchase receive creates payable for full PO amount
- No split payment support

**Underlying cause:** `PaymentService`, `RefundService`, and `PurchasingService` operate in isolation. There is no unified financial-event system that ensures every refund, payment, and purchase receipt creates balanced accounting entries and updates related entities.

### Root Cause D: Data Layer is 100% Mock
**Symptoms:**
- All data is lost on page refresh
- No persistence across sessions
- No real database connection
- `repositories/index.ts` permanently coupled to `./mock`

**Underlying cause:** The repository layer has clean interfaces but only a mock implementation exists. No provider/factory pattern allows swapping implementations.

### Root Cause E: Authentication & Authorization is Insecure
**Symptoms:**
- Passwords are never verified
- Tokens are non-secure strings
- No token expiration or refresh
- Permissions are hardcoded in a Map

**Underlying cause:** `AuthService` is a mock authentication system. The permission map is static and not loaded from the `Role` repository.

### Root Cause F: Pricing Engine is Disconnected from POS
**Symptoms:**
- Discount codes are validated in `PricingService` but never invoked from POS UI
- Promotions (BOGO, combo) are defined but never evaluated during checkout
- Tax calculation exists but no tax groups or exemptions

**Underlying cause:** `PricingService.calculateCart` exists as a static method but is never called from the POS checkout flow. The POS UI has no discount/promotion inputs.

### Root Cause G: Cash Register Operations are Incomplete
**Symptoms:**
- No cash in/out operations
- Shift totals remain zero
- Expenses and refunds are not linked to shifts
- No end-of-day reconciliation

**Underlying cause:** `ShiftService` supports open/close but has no operations for cash movements or linking other financial events to shifts.

### Root Cause H: Returns & Refunds are Not Financially Integrated
**Symptoms:**
- Returns restore stock but create no credit note or refund
- Refunds restore stock but do not refund money or update order payment status
- No link between return and refund records

**Underlying cause:** `ReturnService` and `RefundService` are isolated CRUD wrappers. They do not create `Payment`, `AccountingTransaction`, or `Sale` records.

---

## 3. Dependency Graph

```
Business
  ↓
Branch
  ↓
Users / RBAC
  ↓
Product
  ↓
Inventory
  ↓
Purchasing → Inventory
  ↓
POS → Inventory → Pricing(Tax + Discount + Promotion)
  ↓
Payment → Customer Balance
  ↓
Sale / Invoice
  ↓
Return → Refund → Payment → Inventory Restoration
  ↓
Cash Register (Shift ← Sales, Refunds, Expenses)
  ↓
Reports ← All Transaction Modules
  ↓
Accounting-lite ← All Financial Modules

Note: Authentication & RBAC is a cross-cutting concern that must be
serviceable before or in parallel with all transaction modules.
```

### Module Dependency Matrix

| Module | Depends On |
|--------|-----------|
| Business / Branch | None |
| Users / RBAC | Business, Branch |
| Products | None (standalone CRUD) |
| Inventory | Products, Branch |
| Purchasing | Suppliers, Inventory, Branch |
| Customers | None (standalone CRUD) |
| Suppliers | None (standalone CRUD) |
| POS | Products, Inventory, Pricing, Shift, Branch |
| Pricing | Tax, Discount, Promotion |
| Payments | Orders, Customers, Accounting |
| Sales / Invoice | Orders |
| Returns | Orders |
| Refunds | Orders, Inventory, Payments |
| Shifts | Users, Branch, POS |
| Reports | Orders, Inventory, Refunds, Expenses |
| Accounting | Payments, Purchases, Orders, Expenses |
| Notifications / Audit | All modules (cross-cutting) |
| Settings | None (standalone CRUD) |

---

## 4. Core POS vs Advanced vs Optional

### Core POS
Minimum functionality required for a reliable retail POS prototype:

- Authentication & RBAC
- Business & Branch Management
- Product & Variant Management
- Inventory Management
- Supplier Management
- Purchasing (PO creation, receiving)
- Customer Management
- POS / Cashier (checkout with cart)
- Payment Processing
- Sales & Invoice Generation
- Returns & Refunds
- Cash Register & Shifts
- Tax Calculation
- Basic Reports
- Settings

### Advanced POS
Important but not required for the core transaction engine:

- Advanced promotions (BOGO, combo, stacking)
- Loyalty program (points redemption, tiers)
- Store credit issuance and redemption
- Barcode scanning
- Receipt printing
- Stock counting / physical inventory
- Low stock reordering
- Purchase returns
- Customer ledger
- Supplier payments
- Advanced analytics
- Enhanced notifications & audit automation
- Product bundles / kits

### Optional / Enterprise
Should NOT block the current POS prototype:

- Multi-currency
- Gift cards
- Customer groups / segmentation
- Batch / lot tracking
- Serial number tracking
- Employee management (beyond basic users)
- Multi-language
- Approval workflows
- E-commerce integration
- Marketplace integration
- Delivery integration
- ERP integration
- Advanced warehouse automation

---

## 5. Missing Modules

### Required Missing Modules
Modules without which the POS cannot be considered complete.

| Missing Module | Priority | Why Needed | Dependencies | When |
|---------------|----------|------------|--------------|------|
| Real Data Persistence | P0 | All data is lost on refresh | R0-R5 (business logic must be correct first) | R6 |
| Real Authentication | P0 | Passwords not verified; insecure tokens | None (can start immediately) | R5 |
| Invoice Auto-Generation | P0 | Invoices must be created during POS checkout | R0 | Part of R0 |
| Shift Sales Tracking | P0 | Shift must track cash/card/mobile/credit totals | R0 | Part of R0/R4 |
| Refund Payment Integration | P0 | Refunds must create reverse payments | R0, R2 | Part of R2/R3 |
| Source Stock Decrease on Transfer | P0 | Stock transfers must decrease source inventory | R1 | Part of R1 |
| Split Payment | P0 | Many sales require multiple payment methods | R0 | Part of R2 |
| Receipt Printing | P0 | Core POS requirement | R0 | R11 (Advanced POS) |

### Recommended Missing Modules
Modules that significantly improve completeness.

| Missing Module | Priority | Why Needed | Dependencies | When |
|---------------|----------|------------|--------------|------|
| Cash In/Out Operations | P1 | Required for shift cash management | R0 | R4 |
| Purchase Returns | P1 | Suppliers need return process | R1, R6 | R8 |
| Customer Ledger | P1 | Customers need transaction history | R2, R6 | R9 |
| Supplier Payments | P1 | Suppliers need payment tracking | R1, R6 | R8 |
| Stock Counting | P1 | Physical inventory verification | R1 | R1 |
| Low Stock Reordering | P1 | Auto-suggest reorder quantities | R1 | R1 |
| Promotion Engine Integration | P1 | BOGO/combo must apply at POS | R0 | R7 |
| Barcode Scanning | P1 | Essential for retail efficiency | R0 | R11 |
| Double-Entry Accounting | P1 | Accounting must be mathematically correct | R6, R0-R4 | R10 |

### Advanced Modules
Useful for a more sophisticated POS.

| Module | Priority | When |
|--------|----------|------|
| Loyalty point redemption | P2 | R14 |
| Store credit issuance in POS | P2 | R14 |
| Product bundles / kits | P2 | R11 |
| Customer groups | P2 | R9 |
| Employee management | P2 | R5 |
| Multi-currency | P2 | R12 |
| Batch / lot tracking | P2 | R1 |
| Serial number tracking | P2 | R1 |

### Optional Modules
Enterprise/integration capabilities.

| Module | Priority | When |
|--------|----------|------|
| E-commerce integration | P3 | R12 |
| Delivery integration | P3 | R12 |
| Marketplace integration | P3 | R12 |
| Advanced loyalty tiers/rewards | P3 | R12 |
| Approval workflows | P3 | R12 |
| Multi-language | P3 | R12 |

---

## 6. Remediation Phases

### R0 — Core Transaction & Invoice Engine
**Priority:** P0 — CRITICAL
**Current Coverage:** 42%
**Target Coverage:** 95%
**Dependencies:** None

#### Why This Phase Exists
The POS checkout creates an `Order` but never creates a `Sale`/invoice. Shift totals are never populated. `costPrice` is hardcoded to 0, making all profit calculations incorrect. Order numbers can collide. Without a working checkout that produces real invoices and updates shift totals, the POS cannot be demonstrated as functional.

#### Current Problems
1. `PosService.checkout` creates `Order` and `Payment` but never calls `SaleService.createSale`
2. `PosService.checkout` does not update `Shift.cashSales`, `cardSales`, `mobileSales`, `creditSales`, or `totalSales`
3. `costPrice` is hardcoded to `0` in all order items
4. Order numbers use `Date.now().slice(-6)` which can collide
5. `PosService.checkout` line 256 attempts to update a `sale` using the order ID, but no sale exists
6. `holdOrder` exists but there is no UI to recall held orders

#### Root Cause
`PosService.checkout` orchestrates inventory, payment, accounting, and loyalty, but stops before completing the sales/invoice lifecycle and shift reconciliation.

#### Scope
- Make `PosService.checkout` call `SaleService.createSale` after order creation
- Update active shift totals by payment method during checkout
- Replace hardcoded `costPrice: 0` with actual variant `costPrice`
- Replace `Date.now().slice(-6)` numbering with a sequential or UUID-based scheme
- Remove the erroneous `repositories.sale.update(savedOrder.id, ...)` call
- Add `holdOrder` recall UI and service method
- Ensure checkout validates that a shift is open (already partially implemented)

#### Dependencies
None. Can be implemented immediately on the current mock layer.

#### Affected Existing Modules
- `src/services/index.ts` (PosService)
- `src/app/(admin)/pos/cashier/page.tsx`
- `src/stores/index.ts`
- `src/domain/types.ts`

#### Existing Features To Preserve
- Existing checkout flow (cart validation, stock check, payment creation, accounting entries, loyalty points)
- Existing cart store and shift store interfaces
- Existing `holdOrder` method (extend, don't replace)

#### Acceptance Criteria
1. Every successful POS checkout creates a corresponding `Sale` record with a unique invoice number
2. The active shift's `cashSales`, `cardSales`, `mobileSales`, `creditSales`, and `totalSales` are updated by payment method
3. Every order item stores the actual variant `costPrice`
4. Order numbers and invoice numbers are unique
5. Held orders can be viewed and recalled from the POS UI
6. All existing checkout behavior (inventory adjustment, payment creation, accounting entries, loyalty points) remains intact

#### E2E Scenarios
1. Cashier opens shift → adds items to cart → completes checkout → order is created → invoice/sale is created → shift totals are updated → inventory is reduced
2. Cashier holds an order → recalls the held order → completes checkout → sale is created

#### Backend Readiness
- `SaleService.createSale` interface is already defined and works with repositories
- The checkout orchestration should remain API-call-based so it can be wrapped in a server action or API route when the backend is connected

---

### R1 — Inventory Transaction Engine
**Priority:** P0 — CRITICAL
**Current Coverage:** 52%
**Target Coverage:** 90%
**Dependencies:** R0

#### Why This Phase Exists
Stock transfers duplicate stock because the source branch inventory is never decreased. There is no automatic inventory creation when products are created. No stock counting, valuation, or reorder workflow exists. Without a reliable inventory engine, purchasing, POS, and reports produce incorrect data.

#### Current Problems
1. `StockTransferService.receiveStockTransfer` only increases destination inventory; source is never decreased
2. No validation that source branch has sufficient stock before transfer
3. Creating a product does not automatically create inventory records
4. No stock counting/physical inventory workflow
5. No inventory valuation methods (FIFO, LIFO, weighted average)
6. No reorder point alerts or auto-reorder
7. `actorId` is hardcoded to `"usr-1"` in `InventoryManagement.tsx`
8. `adjustStock` creates inventory on-the-fly with default min/max levels when no record exists

#### Root Cause
Inventory movements are handled as isolated operations in `InventoryService.adjustStock` and `StockTransferService`. There is no unified stock-movement engine that ensures balanced debits/credits across branches.

#### Scope
- Make `StockTransferService.receiveStockTransfer` decrease source branch inventory
- Add pre-transfer validation that source branch has sufficient stock
- Automatically create inventory records when a product or variant is created
- Add stock counting/physical inventory workflow
- Add inventory valuation support (weighted average as default)
- Add reorder point alerts with suggested reorder quantities
- Remove hardcoded `actorId` from `InventoryManagement.tsx`; use current user
- Add stock movement audit trail with branch-scoped validation

#### Dependencies
R0 (core transaction engine must be stable before inventory movements are relied upon by POS)

#### Affected Existing Modules
- `src/services/stockTransfer.ts`
- `src/services/inventory.ts`
- `src/components/settings/InventoryManagement.tsx`
- `src/components/settings/StockTransfersManagement.tsx`
- `src/domain/types.ts`

#### Existing Features To Preserve
- Existing stock adjustment types (purchase, sale, adjustment, transfer_in, transfer_out, return)
- Existing low-stock detection
- Existing `isInStock` validation used by POS checkout

#### Acceptance Criteria
1. Receiving a stock transfer decreases source branch inventory by the transferred quantity
2. Creating a transfer validates that source branch has sufficient stock
3. Creating a product automatically creates an inventory record for each variant at each branch (or a configurable default branch)
4. Stock counting workflow allows entering actual counts and generating variance reports
5. Inventory valuation uses weighted average cost
6. Low stock alerts include suggested reorder quantities
7. All stock movements are attributable to a real user, not a hardcoded ID

#### E2E Scenarios
1. Manager creates product → inventory is auto-created → stock level is visible
2. Manager creates stock transfer from Branch A to Branch B → Branch A stock decreases → Branch B stock increases
3. Cashier sells last unit → low stock alert appears → manager receives reorder suggestion

#### Backend Readiness
- Repository interfaces already support the needed operations
- Stock movements should be persisted as immutable records to support audit and valuation

---

### R2 — Payment & Financial Integration
**Priority:** P0 — CRITICAL
**Current Coverage:** 55%
**Target Coverage:** 90%
**Dependencies:** R0

#### Why This Phase Exists
Refunds restore stock but do not refund money. Customer balances only increase on credit sales and never decrease when payments are received. Partial purchase receives create a payable for the full PO amount instead of the received amount. Without correct payment integration, customer trust and accounting accuracy are compromised.

#### Current Problems
1. `RefundService.updateRefundStatus` restores stock on approval but does not create a refund payment or update order `paidAmount`
2. `PaymentService.createPayment` does not decrease `customer.currentBalance`
3. `PurchasingService.receivePurchaseOrder` creates a payable for `po.grandTotal` even on partial receive
4. No split payment support
5. No payment reversal or refund-method selection

#### Root Cause
`PaymentService`, `RefundService`, and `PurchasingService` are isolated. There is no financial-event coordinator that ensures refunds, payments, and purchase receipts create balanced entries across orders, customers, suppliers, and accounting.

#### Scope
- Make `RefundService.updateRefundStatus` create a refund payment and update order `paidAmount` and `paymentStatus`
- Make `PaymentService.createPayment` decrease `customer.currentBalance` for credit sales
- Fix `PurchasingService.receivePurchaseOrder` to calculate payable based on received quantity, not full PO amount
- Add split payment support (multiple payment methods per order)
- Add payment reversal workflow
- Add refund method selection (original method, cash, store credit)
- Ensure all financial mutations create corresponding accounting transactions

#### Dependencies
R0 (orders and sales must exist before payments can be linked)

#### Affected Existing Modules
- `src/services/payments.ts`
- `src/services/refunds.ts`
- `src/services/purchasing.ts`
- `src/services/customer.ts`
- `src/services/accounting.ts`

#### Existing Features To Preserve
- Existing payment creation for cash payments with accounting integration
- Existing order `paidAmount` and `paymentStatus` updates
- Existing refund quantity validation and stock restoration

#### Acceptance Criteria
1. Approving a refund creates a refund payment record, updates order `paidAmount`, and updates order `paymentStatus`
2. Recording a payment against a credit sale decreases the customer's `currentBalance`
3. Partial purchase receive creates a payable only for the received amount
4. Split payment is supported in the POS checkout UI and service layer
5. Refund method can be selected (original payment method, cash, store credit)
6. All payment, refund, and purchase events create balanced accounting transactions

#### E2E Scenarios
1. Cashier processes credit sale → customer balance increases → customer pays later → payment is recorded → customer balance decreases → accounting entries are created
2. Manager approves refund → refund payment is created → order payment status updates → stock is restored → accounting entry is created
3. Manager partially receives PO → payable is created only for received items → supplier balance increases by received amount only

#### Backend Readiness
- `PaymentService` interface is clean; refund payment creation follows the same pattern
- Split payment can be modeled as multiple `Payment` records linked to one order

---

### R3 — Returns, Refunds & Credit Integration
**Priority:** P0 — CRITICAL
**Current Coverage:** 54%
**Target Coverage:** 90%
**Dependencies:** R0, R2

#### Why This Phase Exists
Returns restore stock but do not create financial credits. Refunds restore stock but do not update order payment status or create refund payments. There is no link between returns and refunds. Without financial integration, returns and refunds are incomplete and potentially abusive.

#### Current Problems
1. `ReturnService.updateReturnStatus` restores stock on completion but does not create a credit transaction or refund
2. `RefundService` does not link to a `Return` record
3. No credit note generation
4. Returns and refunds do not update customer balance or accounting records
5. No return reason categorization or analytics

#### Root Cause
`ReturnService` and `RefundService` are CRUD-only wrappers with no integration to payments, accounting, or sales. They are treated as standalone inventory adjustments rather than financial events.

#### Scope
- Make `ReturnService.updateReturnStatus` create a credit note or refund when completed
- Link `Refund` records to `Return` records (one return can generate one or more refunds)
- Make refunds update order `paidAmount` and `paymentStatus` (coordinate with R2)
- Create accounting entries for returns and refunds
- Add return reason categorization
- Add return approval workflow
- Ensure returned items cannot be refunded twice (quantity validation already exists; preserve it)

#### Dependencies
R0 (orders/sales must exist), R2 (payment integration must exist)

#### Affected Existing Modules
- `src/services/returns.ts`
- `src/services/refunds.ts`
- `src/services/payments.ts`
- `src/services/accounting.ts`
- `src/domain/types.ts`

#### Existing Features To Preserve
- Existing return quantity validation against ordered quantities
- Existing refund quantity validation
- Existing stock restoration on return completion and refund approval

#### Acceptance Criteria
1. Completing a return creates a credit note or initiates a refund
2. Refund approval creates a refund payment, updates order `paidAmount`, and creates an accounting entry
3. Returns and refunds are linked by a common return/refund reference
4. Return reasons are categorized and reportable
5. Return approval workflow is enforced (pending → approved → completed)

#### E2E Scenarios
1. Customer returns item → manager creates return → return is approved → stock is restored → credit note is generated → customer balance is credited
2. Manager processes refund for returned item → refund payment is created → order payment status updates → accounting entry is created

#### Backend Readiness
- Return and refund domain types already exist
- The integration pattern follows the same service-to-repository approach used elsewhere

---

### R4 — Cash Register & Shift Operations
**Priority:** P0 — CRITICAL
**Current Coverage:** 54%
**Target Coverage:** 90%
**Dependencies:** R0, R2, R3

#### Why This Phase Exists
Shifts can be opened and closed, but `cashSales`, `cardSales`, `mobileSales`, `creditSales`, `totalRefunds`, `totalCashIn`, and `totalCashOut` are never populated. There are no cash-in/cash-out operations. Expenses and refunds are not linked to shifts. Without shift tracking, cash reconciliation is impossible.

#### Current Problems
1. `PosService.checkout` does not update shift sales totals
2. `ShiftService` has no cash-in/cash-out methods
3. `ExpenseService` does not link expenses to shifts
4. `RefundService` does not link refunds to shifts
5. No end-of-day reconciliation report
6. `ShiftsManagement.tsx` uses hardcoded `branches` and `users` arrays instead of fetching from services
7. Default opening cash is hardcoded to 5000 in POS

#### Root Cause
`ShiftService` was implemented as a simple open/close state machine without financial event tracking. There is no mechanism to attribute sales, refunds, expenses, and cash movements to a shift.

#### Scope
- Add `ShiftService.recordCashIn` and `ShiftService.recordCashOut` methods
- Update shift totals automatically when sales, refunds, and expenses are recorded
- Link expenses to the active shift
- Link refunds to the active shift
- Add end-of-day reconciliation report
- Replace hardcoded dropdown data in `ShiftsManagement.tsx` with service calls
- Remove hardcoded default opening cash in POS; use system settings or user input

#### Dependencies
R0 (sales must update shifts), R2 (payments/refunds must exist), R3 (refunds must be linked)

#### Affected Existing Modules
- `src/services/index.ts` (ShiftService)
- `src/services/expenses.ts`
- `src/services/refunds.ts`
- `src/components/settings/ShiftsManagement.tsx`
- `src/app/(admin)/pos/cashier/page.tsx`
- `src/stores/index.ts`

#### Existing Features To Preserve
- Existing shift open/close logic
- Existing expected cash calculation
- Existing variance calculation
- Existing duplicate open shift prevention

#### Acceptance Criteria
1. Every POS sale updates the active shift's payment-method totals
2. Cash-in and cash-out operations are recorded and reflected in shift totals
3. Expenses are linked to the active shift
4. Refunds are linked to the active shift
5. End-of-day reconciliation report shows opening cash, sales by method, cash in/out, refunds, expected cash, closing cash, and variance
6. Shift dropdowns show real branches and users from services

#### E2E Scenarios
1. Cashier opens shift → makes cash sale → shift cashSales increases → cashier records cash-out for change → shift totalCashOut increases → cashier closes shift → reconciliation report is accurate
2. Manager processes refund during shift → shift totalRefunds increases → shift expected cash is adjusted

#### Backend Readiness
- Shift domain type already has all necessary fields
- Shift totals should be updated transactionally with sales/refunds/expenses

---

### R5 — Authentication & Security Hardening
**Priority:** P0 — CRITICAL
**Current Coverage:** 45%
**Target Coverage:** 85%
**Dependencies:** None (can run in parallel with R0-R4)

#### Why This Phase Exists
Passwords are never verified. Tokens are insecure non-signed strings. There is no token expiration, refresh, or password reset. Without real authentication, the system is not secure and cannot be connected to a real identity provider.

#### Current Problems
1. `AuthService.login` accepts any password without verification
2. `AuthService.validateToken` validates only the string format via regex
3. No password hashing
4. No JWT or session-based tokens
5. No token expiration or refresh mechanism
6. No password reset flow
7. Permissions are hardcoded in `src/utils/permissions.ts:21-27` instead of loaded from the `Role` repository
8. No rate limiting or account lockout

#### Root Cause
`AuthService` is a mock authentication system designed for UI demonstration, not security.

#### Scope
- Add password hashing (bcrypt or Argon2)
- Replace mock tokens with JWT or secure session tokens
- Add token expiration and refresh mechanism
- Implement password reset flow
- Load permissions from the `Role` repository instead of hardcoded Map
- Add rate limiting on login attempts
- Add server-side permission enforcement (move beyond client-side `ProtectedRoute` only)

#### Dependencies
None. Can be implemented in parallel with transaction fixes.

#### Affected Existing Modules
- `src/services/auth.ts`
- `src/stores/auth.ts`
- `src/utils/permissions.ts`
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/SignUpForm.tsx`
- `src/components/common/ProtectedRoute.tsx`

#### Existing Features To Preserve
- Existing sign-in and sign-up UI
- Existing `useAuthStore` with localStorage persistence
- Existing 5-role permission structure
- Existing `ProtectedRoute` component (enhance, don't replace)

#### Acceptance Criteria
1. Login verifies password against a hashed value
2. Tokens are signed and include expiration
3. Token refresh works transparently for active sessions
4. Password reset flow is functional
5. Permissions are loaded from the `Role` repository and reflect database state
6. Login attempts are rate-limited

#### E2E Scenarios
1. User enters correct password → login succeeds → token is issued → user can access protected routes
2. User enters wrong password 5 times → account is locked for 15 minutes
3. User clicks "Forgot password" → reset email is sent → user sets new password → login succeeds

#### Backend Readiness
- Auth service interface is already clean; implementation needs to be swapped for real crypto
- JWT libraries are standard and well-supported in Next.js

---

### R6 — Data Persistence Layer
**Priority:** P0 — CRITICAL
**Current Coverage:** 30%
**Target Coverage:** 90%
**Dependencies:** R0, R1, R2, R3, R4, R5

#### Why This Phase Exists
All domain data is stored in 1,192 lines of in-memory arrays in `mock.ts`. Data is completely lost on page refresh. No database, no API routes, and no data-fetching abstraction exist. Without persistence, none of the transaction fixes in R0-R4 are durable.

#### Current Problems
1. `src/repositories/index.ts` permanently exports `./mock`
2. No repository provider/factory pattern exists
3. No API client or HTTP abstraction
4. No database connection
5. No server actions or API routes for data mutation
6. No request/response logging or error handling
7. No environment configuration for API endpoints

#### Root Cause
The project was built as a frontend prototype with a mock data layer. The repository interfaces were designed well, but no real implementations were ever created.

#### Scope
- Add a repository provider/factory pattern to allow swapping implementations
- Add an API client layer (fetch/axios wrapper) with auth headers, error handling, and retries
- Implement real repository classes for core entities (Product, Inventory, Order, Payment, Customer, Shift)
- Add Next.js server actions or API routes for mutations
- Add database schema and migrations (SQLite for prototype, PostgreSQL-ready for production)
- Add seed data scripts
- Add validation schemas (Zod) for all service inputs
- Replace mock data incrementally, starting with core transaction entities
- Preserve existing mock data as fallback during transition

#### Dependencies
R0-R4 (business logic must be correct before persisting), R5 (auth must be in place for secure API calls)

#### Affected Existing Modules
- `src/repositories/` (all files)
- `src/services/` (all files)
- `src/app/` (pages that call repositories directly)

#### Existing Features To Preserve
- All 28 repository interfaces (they are well-designed and should remain)
- All service layer logic (it should call repositories, not change)
- All UI components (they should call services, not change)

#### Acceptance Criteria
1. All domain data persists across page refreshes
2. Repository implementations can be swapped without changing service or UI code
3. All mutations go through server actions or API routes with proper validation
4. Error handling is consistent across all API calls
5. Database schema supports all domain types with proper indexes
6. Seed data populates the system with realistic demo data

#### E2E Scenarios
1. Cashier completes sale → data is saved to database → page is refreshed → sale is still visible in reports
2. Manager creates product → page is refreshed → product persists in inventory
3. Two cashiers in different branches make sales → data is isolated by branch

#### Backend Readiness
- This phase IS the backend integration
- The clean repository interfaces make this primarily a data-layer swap
- Services should not need modification if the repository interfaces are honored

---

### R7 — Pricing, Tax & Promotion Engine
**Priority:** P1 — HIGH
**Current Coverage:** 52%
**Target Coverage:** 85%
**Dependencies:** R0

#### Why This Phase Exists
Discount codes are validated in `PricingService.calculateCart` but never invoked from the POS UI. Promotions (BOGO, combo) are defined in the domain and management UI but never evaluated during checkout. Tax calculation exists but lacks groups, exemptions, and inclusive pricing. Without a connected pricing engine, the POS cannot apply real-world pricing rules.

#### Current Problems
1. POS checkout modal has no discount code input
2. `PricingService.calculateCart` is never called from the POS UI
3. No promotion evaluation logic exists
4. No tax group management
5. No tax exemption handling
6. No tax-inclusive pricing mode

#### Root Cause
`PricingService` was built as a utility class but was never integrated into the POS checkout flow. Promotions were designed as domain types without an evaluation engine.

#### Scope
- Add discount code input to the POS checkout modal
- Call `PricingService.calculateCart` from POS checkout with the entered discount code
- Build a promotion evaluation engine that checks active promotions against cart items
- Implement BOGO and combo promotion logic
- Add promotion stacking rules
- Add tax group management
- Add tax exemption handling
- Add tax-inclusive pricing mode toggle

#### Dependencies
R0 (POS checkout must be stable before adding pricing complexity)

#### Affected Existing Modules
- `src/services/index.ts` (PricingService)
- `src/services/promotions.ts`
- `src/app/(admin)/pos/cashier/page.tsx`
- `src/components/settings/DiscountsManagement.tsx`
- `src/components/settings/PromotionsManagement.tsx`

#### Existing Features To Preserve
- Existing discount code validation logic
- Existing promotion CRUD
- Existing tax CRUD and per-item tax calculation

#### Acceptance Criteria
1. Cashier can enter a discount code in the POS checkout modal and see the updated total
2. Active promotions are automatically evaluated and applied to the cart
3. BOGO promotions add free items to the cart
4. Combo promotions apply bundled pricing
5. Tax groups can be configured and applied to products
6. Tax-exempt customers or products can be flagged
7. Tax-inclusive pricing mode can be toggled in settings

#### E2E Scenarios
1. Cashier enters valid discount code → cart total is reduced → checkout completes with discounted amount
2. Active BOGO promotion for Product X → cashier adds Product X to cart → free item is automatically added
3. Tax-exempt customer checks out → tax is not applied

#### Backend Readiness
- `PricingService` is already a static class; promotion evaluation can be added as a new static method
- All pricing calculations should be deterministic and testable

---

### R8 — Purchasing & Supplier Enhancement
**Priority:** P1 — HIGH
**Current Coverage:** 62%
**Target Coverage:** 85%
**Dependencies:** R1, R6

#### Why This Phase Exists
Purchase returns do not exist. Supplier payments are not tracked separately from purchase orders. PO approval workflow is missing. Auto-generated PO numbers are not implemented. Tax on POs is manually entered rather than calculated.

#### Current Problems
1. No purchase return workflow
2. No supplier payment recording or ledger
3. No PO approval workflow
4. PO numbers are manually entered
5. `taxAmount` on POs is input, not calculated from item tax rates
6. `createdBy` and `receivedBy` are hardcoded in `PurchasingManagement.tsx`

#### Root Cause
Purchasing was built as a PO lifecycle manager (draft → ordered → partial → received → cancelled) but was not extended to cover the full procurement-to-pay cycle.

#### Scope
- Add purchase return workflow
- Add supplier payment recording and ledger
- Add PO approval workflow (draft → pending approval → approved → ordered)
- Auto-generate sequential PO numbers
- Calculate PO tax from item tax rates instead of accepting manual input
- Remove hardcoded `createdBy` and `receivedBy`; use current user

#### Dependencies
R1 (inventory must be correct for purchase returns to restore stock), R6 (persistence for payment records)

#### Affected Existing Modules
- `src/services/purchasing.ts`
- `src/services/supplier.ts`
- `src/components/settings/PurchasingManagement.tsx`
- `src/domain/types.ts`

#### Existing Features To Preserve
- Existing PO creation, editing, cancellation, and receiving
- Existing partial receiving with inventory updates
- Existing supplier balance updates on receive
- Existing payable accounting transaction creation

#### Acceptance Criteria
1. Purchase returns can be created and processed, restoring stock and creating credit notes
2. Supplier payments can be recorded and tracked in a supplier ledger
3. PO approval workflow is enforced for configured approval thresholds
4. PO numbers are auto-generated with a configurable prefix
5. PO tax is calculated from item tax rates

#### E2E Scenarios
1. Manager creates PO → PO is auto-approved under threshold → goods are received → inventory increases → supplier balance increases
2. Manager creates PO above threshold → PO requires approval → approver approves → receiving proceeds
3. Supplier returns defective goods → purchase return is created → stock is restored → supplier credit is generated

#### Backend Readiness
- Purchase return domain type does not exist yet; it should be added
- Supplier payment is a new entity but follows the same service/repository pattern

---

### R9 — Customer Management & Receivables
**Priority:** P1 — HIGH
**Current Coverage:** 48%
**Target Coverage:** 75%
**Dependencies:** R2, R6

#### Why This Phase Exists
Customers have no transaction history or ledger. Credit limits are not enforced. Customer groups do not exist. Without customer management beyond basic CRUD, the system cannot support relationship-based pricing or credit control.

#### Current Problems
1. No customer transaction history/ledger
2. No customer payment recording separate from order payments
3. No credit limit enforcement
4. No customer groups or segments
5. No customer notes or interaction history

#### Root Cause
`CustomerService` is a thin CRUD wrapper. The customer domain type includes balance fields but no workflow exists to manage the full customer lifecycle.

#### Scope
- Add customer ledger showing all transactions (sales, payments, returns, refunds)
- Add customer payment recording (payments not tied to a specific order)
- Enforce credit limits at checkout
- Add customer groups/tags
- Add customer notes and interaction history
- Add customer statement generation

#### Dependencies
R2 (payments must work correctly), R6 (persistence for ledger entries)

#### Affected Existing Modules
- `src/services/customer.ts`
- `src/components/settings/CustomerManagement.tsx`
- `src/domain/types.ts`

#### Existing Features To Preserve
- Existing customer CRUD
- Existing opening balance initialization
- Existing duplicate name prevention

#### Acceptance Criteria
1. Customer ledger shows all sales, payments, returns, and refunds
2. Customer payments can be recorded without an associated order
3. Checkout rejects credit sales that would exceed the customer's credit limit
4. Customers can be grouped for targeted pricing/promotions
5. Customer statements can be generated for a date range

#### E2E Scenarios
1. Cashier selects customer with credit limit of 5000 → cart total is 6000 → checkout is blocked for credit payment
2. Manager records a customer payment → customer balance decreases → payment appears in ledger

#### Backend Readiness
- Customer ledger entries can be stored as a new entity or derived from existing transactions
- Credit limit is a field on the Customer type; enforcement is a validation rule in checkout

---

### R10 — Reporting, Analytics & Accounting
**Priority:** P1 — HIGH
**Current Coverage:** 48%
**Target Coverage:** 80%
**Dependencies:** R6, R0, R1, R2, R3, R4

#### Why This Phase Exists
Reports use synthetic/hardcoded data. The dashboard is a static demo. Profit calculations are zero because `costPrice` is 0. Accounting lacks double-entry validation, trial balance, and financial statements. Without reliable reports, business decisions are made on fiction.

#### Current Problems
1. Dashboard (`app/(admin)/page.tsx`) uses hardcoded demo components
2. `ReportsManagement.tsx` chart data uses artificial multipliers (`totalSales * 0.1`, etc.)
3. `ReportService.getProfitSummary` computes COGS from `costPrice` which is always 0
4. No double-entry validation in `AccountingService`
5. No trial balance, income statement, or balance sheet
6. No chart of accounts hierarchy
7. No date range selection in reports UI
8. No report export (PDF, Excel, CSV)

#### Root Cause
Reports were built as UI demos with synthetic data. The accounting system was built as a single-side balance updater without double-entry principles.

#### Scope
- Replace dashboard demo components with real data from `ReportService`
- Replace synthetic chart data with real monthly aggregations
- Add date range selection to all reports
- Add report export (PDF, Excel, CSV)
- Add drill-down from reports to individual transactions
- Implement double-entry bookkeeping in `AccountingService`
- Add trial balance, income statement, and balance sheet
- Add chart of accounts hierarchy
- Add account reconciliation

#### Dependencies
R6 (real data persistence), R0-R4 (correct transaction data)

#### Affected Existing Modules
- `src/app/(admin)/page.tsx`
- `src/components/settings/ReportsManagement.tsx`
- `src/services/index.ts` (ReportService)
- `src/services/accounting.ts`
- `src/components/settings/AccountingManagement.tsx`

#### Existing Features To Preserve
- Existing report aggregation logic (sales summary, inventory summary, profit summary, top products)
- Existing accounting account CRUD and transaction CRUD
- Existing ApexCharts integration

#### Acceptance Criteria
1. Dashboard KPIs and charts reflect real transaction data
2. Sales charts show actual monthly/daily breakdowns
3. Profit calculations use real `costPrice` values
4. Accounting enforces double-entry (debits = credits)
5. Trial balance, income statement, and balance sheet are available
6. Reports can be exported to PDF, Excel, and CSV
7. Users can click a report number to see the underlying transactions

#### E2E Scenarios
1. Manager opens dashboard → sees real sales, profit, and inventory metrics for the current month
2. Manager selects a date range → reports filter correctly → exports to PDF
3. Accountant views trial balance → debits equal credits → no unbalanced entries exist

#### Backend Readiness
- Report aggregation logic is already correct; only data source needs to be real
- Double-entry validation is a service-layer rule that works with any repository

---

### R11 — Notifications, Audit & Advanced POS
**Priority:** P2 — MEDIUM
**Current Coverage:** 42%
**Target Coverage:** 75%
**Dependencies:** R6

#### Why This Phase Exists
Notifications and audit logs are CRUD-only with no automatic triggers. No module calls `NotificationService.create` or `AuditService.create` automatically. Advanced POS features (barcode, receipt printing, hold/recall UI) are missing.

#### Current Problems
1. No automatic notification triggers (low stock, order completion, etc.)
2. No automatic audit logging for mutations
3. No real-time notifications
4. No email/SMS notifications
5. No barcode scanning
6. No receipt printing
7. `holdOrder` exists but has no recall UI
8. No price override at POS
9. No product bundles/kits

#### Root Cause
Notifications and audit were added as standalone management pages without integration into the service layer. Advanced POS features were deprioritized during initial development.

#### Scope
- Add automatic notification triggers for key events (low stock, order completion, refund approval, etc.)
- Add automatic audit logging for all mutations via service interceptors or explicit calls
- Add real-time notification support (polling or WebSocket)
- Add email/SMS notification delivery
- Add barcode scanning support in POS
- Add receipt printing (thermal printer integration)
- Add hold/recall order UI
- Add price override at POS
- Add product bundles/kits

#### Dependencies
R6 (persistence for notifications and audit logs)

#### Affected Existing Modules
- `src/services/notifications.ts`
- `src/services/audit.ts`
- `src/app/(admin)/pos/cashier/page.tsx`
- `src/components/settings/NotificationsManagement.tsx`
- `src/components/settings/AuditManagement.tsx`

#### Existing Features To Preserve
- Existing notification and audit CRUD
- Existing notification filtering and mark-as-read
- Existing audit log detail view with before/after snapshots

#### Acceptance Criteria
1. Low stock automatically generates a notification
2. Every mutation (create, update, delete) in services creates an audit log entry
3. New notifications appear in real-time for active users
4. Receipts can be printed from POS checkout
5. Barcode scanner input is supported in POS product search
6. Held orders can be viewed and recalled from POS

#### E2E Scenarios
1. Stock drops below reorder point → manager receives notification → manager creates purchase order
2. Cashier completes sale → audit log records the sale with before/after snapshots

#### Backend Readiness
- Notification and audit services are already CRUD-based; automation is a service-layer concern
- Receipt printing and barcode scanning are client-side integrations

---

### R12 — Enterprise Features
**Priority:** P3 — LOW / OPTIONAL
**Current Coverage:** Varies
**Target Coverage:** N/A
**Dependencies:** R11

#### Why This Phase Exists
Enterprise features are not required for a functional POS prototype but are needed for scaling to multi-currency, multi-language, and integrated operations.

#### Scope
- Multi-currency support with conversion rates
- Advanced loyalty tiers (bronze, silver, gold) and rewards catalog
- Gift cards
- Approval workflows for POs, refunds, and discounts
- Multi-language support
- E-commerce integration
- Marketplace integration
- Delivery integration
- Advanced warehouse automation

#### Dependencies
R11 (all core and advanced features must be stable)

#### Affected Existing Modules
- Various

#### Existing Features To Preserve
- All existing functionality

#### Acceptance Criteria
Enterprise-specific; defer until core POS is stable and backend is production-ready.

---

## 7. Remediation Roadmap Table

| ID | Remediation | Priority | Current Coverage | Target | Dependencies | Impact |
|---|---|---|---:|---:|---|---|
| R0 | Core Transaction & Invoice Engine | P0 | 42% | 95% | None | Critical — checkout produces invoices and updates shifts |
| R1 | Inventory Transaction Engine | P0 | 52% | 90% | R0 | Critical — stock transfers and inventory movements are correct |
| R2 | Payment & Financial Integration | P0 | 55% | 90% | R0 | Critical — refunds, customer balances, and purchase payables are correct |
| R3 | Returns, Refunds & Credit Integration | P0 | 54% | 90% | R0, R2 | Critical — returns create financial credits |
| R4 | Cash Register & Shift Operations | P0 | 54% | 90% | R0, R2, R3 | Critical — shifts reconcile correctly |
| R5 | Authentication & Security Hardening | P0 | 45% | 85% | None (parallel) | Critical — secure auth and RBAC |
| R6 | Data Persistence Layer | P0 | 30% | 90% | R0-R4, R5 | Critical — data survives refresh |
| R7 | Pricing, Tax & Promotion Engine | P1 | 52% | 85% | R0 | High — POS applies real pricing rules |
| R8 | Purchasing & Supplier Enhancement | P1 | 62% | 85% | R1, R6 | High — purchase returns and supplier payments |
| R9 | Customer Management & Receivables | P1 | 48% | 75% | R2, R6 | High — customer ledgers and credit limits |
| R10 | Reporting, Analytics & Accounting | P1 | 48% | 80% | R6, R0-R4 | High — reports reflect reality |
| R11 | Notifications, Audit & Advanced POS | P2 | 42% | 75% | R6 | Medium — automation and UX improvements |
| R12 | Enterprise Features | P3 | Varies | N/A | R11 | Low — scale and integration |

---

## 8. Before / After Project Score

### Current State (Estimates)

| Metric | Current | Notes |
|--------|---------|-------|
| Core POS Readiness | 58% | UI is complete but critical business flows are broken |
| Business Logic Completeness | 55% | Services have real logic but key integrations are missing |
| Data Consistency | 40% | Mock data, hardcoded IDs, unbalanced transactions |
| Data Persistence | 30% | 100% in-memory; data lost on refresh |
| API / Backend Readiness | 35% | Repository interfaces exist but no real implementation |
| Testing Coverage | 0% | No unit, integration, or E2E tests |
| Overall Implementation | 52% | Audit baseline |

### After P0 Remediation (Estimates)

| Metric | After P0 | Notes |
|--------|----------|-------|
| Core POS Readiness | 85% | Checkout creates invoices, shifts track sales, inventory is correct |
| Business Logic Completeness | 80% | Payments, refunds, returns, and purchasing are financially integrated |
| Data Consistency | 75% | Transactions are balanced but still in-memory |
| Data Persistence | 30% | Still mock; R6 is required for persistence |
| API / Backend Readiness | 35% | Business logic is ready but data layer is still mock |
| Testing Coverage | 0% | No tests added in P0 (testing should follow each phase) |

### After P0 + P1 Remediation (Estimates)

| Metric | After P0+P1 | Notes |
|--------|-------------|-------|
| Core POS Readiness | 90% | Core flows are reliable; advanced features are partial |
| Business Logic Completeness | 88% | All core financial integrations are correct |
| Data Consistency | 85% | Still needs real persistence for full confidence |
| Data Persistence | 30% | R6 must be completed for persistence |
| API / Backend Readiness | 50% | Business logic is ready; persistence is the main blocker |
| Testing Coverage | 0% | Testing should be added alongside remediation |

### After All Remediation (Estimates)

| Metric | Final | Notes |
|--------|-------|-------|
| Core POS Readiness | 92% | Advanced features remain incomplete |
| Business Logic Completeness | 90% | Enterprise features are deferred |
| Data Consistency | 90% | Real database with proper constraints |
| Data Persistence | 90% | Production-ready database with migrations |
| API / Backend Readiness | 85% | Clean repository abstraction with real implementations |
| Testing Coverage | 0% | Assumes tests are added during/after remediation |
| Overall Implementation | 90% | Prototype is functionally complete |

---

## 9. Changes That Should NOT Be Made

### Do Not Do These

1. **Complete rewrite.** The domain model, service layer, and repository interfaces are well-structured. A rewrite would waste significant effort and introduce new bugs.

2. **Replace Next.js architecture unnecessarily.** The App Router structure is sound. Do not migrate to a different framework.

3. **Replace the existing design system.** The UI components are functional and consistent. Focus on business logic, not visual redesign.

4. **Replace working components.** Many components (sidebar, forms, tables) work correctly. Do not rebuild them.

5. **Change routes without necessity.** Routes are already organized and functional. Only add new routes when adding genuinely new capabilities.

6. **Introduce unnecessary libraries.** The current stack (Next.js, Zustand, ApexCharts, Tailwind) is sufficient. Do not add React Query, Redux, or other state management libraries unless justified.

7. **Replace all mock data at once.** Mock data should be replaced incrementally by module, starting with core transaction entities after business logic is correct.

8. **Implement the backend before fixing business logic.** Connecting a real database before fixing checkout, payment, and inventory gaps will persist incorrect data and make fixes harder.

9. **Rebuild already-correct modules.** Product CRUD, category/brand management, and settings are mostly correct. Do not rebuild them.

10. **Add tests after everything is done.** Tests should be added incrementally alongside each remediation phase, not at the end.

---

## 10. Recommended Execution Order

### Phase 1: Foundation Fixes (Parallel)
- **R0** — Core Transaction & Invoice Engine
- **R5** — Authentication & Security Hardening

### Phase 2: Core Engines (Parallel where possible)
- **R1** — Inventory Transaction Engine (depends on R0)
- **R2** — Payment & Financial Integration (depends on R0)
- **R7** — Pricing, Tax & Promotion Engine (depends on R0)

### Phase 3: Financial Integration
- **R3** — Returns, Refunds & Credit Integration (depends on R0, R2)

### Phase 4: Operations
- **R4** — Cash Register & Shift Operations (depends on R0, R2, R3)

### Phase 5: Persistence
- **R6** — Data Persistence Layer (depends on R0-R4, R5)

### Phase 6: Enhancement (Parallel)
- **R8** — Purchasing & Supplier Enhancement (depends on R1, R6)
- **R9** — Customer Management & Receivables (depends on R2, R6)

### Phase 7: Visibility
- **R10** — Reporting, Analytics & Accounting (depends on R6, R0-R4)

### Phase 8: Polish
- **R11** — Notifications, Audit & Advanced POS (depends on R6)

### Phase 9: Enterprise
- **R12** — Enterprise Features (depends on R11)

### Visual Execution Flow

```
R0 ──┐
      ├──→ R1 ──┐
R5 ──┘         │
               ├──→ R8 ──┐
R2 ──┐         │         │
      ├──→ R3 ──┤         │
R7 ──┘         │         │
               ├──→ R9 ──┤
R4 ────────────┤         │
               │         │
               R6 ───────┼──→ R10 ──→ R11 ──→ R12
                          │
                          └──→ R8, R9 (continued after R6)
```

Note: R8 and R9 depend on R6 for persistence. They can start design/UI work after R1/R2 but cannot be fully implemented until R6 is complete.

---

## 11. Stop Condition

Remediation is considered complete when all of the following are true:

1. **All P0 gaps are resolved.**
   - Checkout creates invoices/sales
   - Shift totals are updated during sales
   - Refunds create refund payments and update order status
   - Stock transfers decrease source inventory
   - Customer balances decrease on payment
   - costPrice is actual, not hardcoded
   - Real authentication is in place
   - Data persists across page refreshes

2. **All P1 core POS gaps are resolved.**
   - Split payment is supported
   - Cash in/out operations exist
   - Purchase returns exist
   - Customer ledger exists
   - Supplier payments exist
   - Reports derive from real transaction data
   - Accounting has double-entry validation

3. **Core E2E flows pass reliably.**
   - Flow A: Product → Inventory → POS → Payment → Sale → Invoice
   - Flow B: Supplier → Purchase → Receive → Inventory
   - Flow C: Sale → Return → Refund → Inventory Restoration
   - Flow D: Customer → Credit Sale → Payment → Customer Balance
   - Flow E: Shift → Sales → Cash In/Out → Refund → Close Shift → Reconciliation
   - Flow F: Branch A → Stock Transfer → Branch B

4. **No critical data consistency issues remain.**
   - No unbalanced inventory movements
   - No unbalanced accounting transactions
   - No orphaned orders without sales
   - No duplicate stock across branches

5. **No critical permission issues remain.**
   - Server-side permission enforcement is in place
   - Branch-scoped transactions are enforced at the data layer

6. **Reports derive from transaction data.**
   - No synthetic or hardcoded data in reports or dashboard
   - All aggregations are computed from persisted transactions

7. **Prototype is backend/API ready.**
   - Repository layer can be swapped for a real database
   - Services are API-call-based with proper error handling
   - No hardcoded IDs remain in production code paths

---

## 12. Summary

### Current State
- **Core POS Readiness:** 58%
- **Number of P0 gaps:** 8 (Data Persistence, Auth Security, Invoice Creation, Shift Tracking, Refund Payments, Stock Transfer Balance, Customer Balance, Payment/Financial Integration)
- **Number of P1 gaps:** 8 (Split Payment, Cash In/Out, Purchase Returns, Customer Ledger, Supplier Payments, Stock Counting, Reordering, Promotion Integration)
- **Number of P2 gaps:** 6 (Barcode, Receipt Printing, Loyalty Redemption, Store Credit in POS, Notifications Automation, Audit Automation)
- **Number of missing required modules:** 8
- **Number of recommended remediation phases:** 13 (R0 through R12)
- **Recommended first remediation phase:** R0 — Core Transaction & Invoice Engine

### Key Insight
The biggest architectural issue is not the UI or the domain model — both are solid. The biggest issues are:
1. **Transaction orchestration gaps** (R0-R4) — the services exist but do not complete critical business flows
2. **100% mock data layer** (R6) — everything depends on non-persistent data
3. **Insecure authentication** (R5) — no real identity verification

The remediation strategy is to **fix the business logic first while it is still cheap to change** (on the mock layer), then **persist the corrected logic** with a real data layer, and finally **add advanced features** on top of a stable foundation.

---

*Roadmap completed. No application code was modified during this analysis.*
