# POS SYSTEM — MASTER IMPLEMENTATION INSTRUCTIONS

You are working inside an existing Next.js application template.

Your job is to transform this existing template into a complete, production-structured POS system prototype.

## PRIMARY OBJECTIVE

Build the POS system incrementally, one module at a time.

Each requested Phase represents ONE complete business module.

When implementing a Phase, DO NOT create a superficial UI-only implementation.

The requested module must be implemented END-TO-END inside the existing application so that:

1. The UI is complete.
2. All required user flows work.
3. Business/domain logic is implemented.
4. Mock data is realistic and internally consistent.
5. Data access is abstracted behind services/repositories.
6. Validation is implemented.
7. Loading, empty, success and error states are implemented.
8. Role/permission behavior is respected.
9. Navigation and routes are complete.
10. The module integrates with previously implemented modules.
11. The architecture is ready for real backend APIs.
12. No important workflow inside the requested module is left as a placeholder.

The prototype must behave like a real POS application even though the backend is currently mocked.

---

# 1. EXISTING TEMPLATE IS THE SOURCE OF TRUTH

Before making changes:

* Inspect the entire existing project structure.
* Identify the existing:

  * Next.js version
  * App Router / Pages Router
  * TypeScript configuration
  * Tailwind setup
  * UI component system
  * design tokens
  * layouts
  * sidebar/navigation
  * forms
  * tables
  * dialogs
  * drawers
  * toast/notification system
  * state management
  * data fetching
  * utilities
  * existing authentication
  * existing mock/data layer
  * existing routes
  * existing conventions

DO NOT unnecessarily replace the template architecture.

DO NOT introduce a second design system if the template already has one.

DO NOT rewrite existing components unless required.

Reuse existing components and patterns whenever possible.

The POS must look like a natural extension of the existing template.

---

# 2. BEFORE IMPLEMENTING A PHASE

First analyze the current codebase.

Determine:

* What already exists.
* What can be reused.
* What needs to be extended.
* What needs to be created.
* Whether previous POS modules already provide reusable domain/services/components.

Do not blindly overwrite existing functionality.

If an existing implementation conflicts with the POS architecture, adapt it carefully rather than duplicating it.

---

# 3. MODULE COMPLETENESS RULE

Every Phase must be treated as a COMPLETE MODULE.

Do not stop after creating:

* pages
* cards
* tables
* forms
* mock arrays
* static dashboards

A Phase is NOT complete until its complete business workflow works.

For example, if implementing Products, it must include:

* product listing
* search
* filtering
* sorting
* pagination where appropriate
* create
* edit
* view/details
* delete/archive
* validation
* status
* categories
* pricing
* inventory-related fields
* variants if applicable
* barcode/SKU where applicable
* empty state
* loading state
* error state
* confirmation dialogs
* success feedback
* realistic mock persistence
* service/repository abstraction
* permission handling
* integration with POS/inventory where applicable

Do NOT assume that "CRUD page created" means the module is complete.

---

# 4. DOMAIN-FIRST ARCHITECTURE

Separate UI from business logic.

Preferred architecture:

UI
↓
Feature Service
↓
Domain Logic
↓
Repository
↓
Mock Data Source

Later:

UI
↓
Feature Service
↓
Domain Logic
↓
API Repository
↓
Backend API

The UI should NOT directly manipulate mock arrays.

Avoid:

```ts
const products = [...]
products.push(...)
```

inside UI components.

Instead use repository/service abstractions such as:

```ts
productRepository.getAll()
productRepository.getById()
productRepository.create()
productRepository.update()
productRepository.archive()
```

The exact naming can follow the existing project's conventions.

---

# 5. BACKEND-READY REQUIREMENT

The prototype currently has no real backend.

However, every module must be designed as if a real backend already exists.

Therefore:

* Define proper TypeScript domain types.
* Define request/input types.
* Define response types where useful.
* Define service methods.
* Define repository interfaces where appropriate.
* Keep API boundaries clear.
* Do not expose mock implementation details to UI components.
* Avoid coupling components to static demo data.
* Avoid fake backend behavior that cannot later be replaced cleanly.

When the real API is connected later, the goal should be:

REPLACE MOCK REPOSITORY

rather than:

REWRITE THE FEATURE.

---

# 6. DATA CONSISTENCY

All mock data must behave like a real POS database.

Do not create isolated demo data.

For example:

A product used by POS must also exist in the product repository.

A sale must reference real products.

A sale must affect inventory.

A customer shown in an order must exist in the customer dataset.

A supplier purchase must reference an existing supplier and products.

Inventory quantities must reflect transactions.

Reports must derive from transaction data rather than arbitrary hard-coded numbers whenever practical.

Avoid contradictory mock data.

---

# 7. BUSINESS LOGIC

Business rules must be implemented in domain/service logic rather than UI components.

Examples:

* price calculation
* subtotal
* discount
* tax
* grand total
* stock deduction
* stock restoration
* refund calculation
* payment calculation
* change calculation
* outstanding balance
* profit calculation
* inventory movement
* loyalty calculation
* promotion rules

Do not duplicate these calculations across multiple screens.

Create reusable domain utilities/engines where appropriate.

---

# 8. STATE MANAGEMENT

Use the existing state management solution if one exists.

Do not introduce another state library unnecessarily.

Separate:

### UI state

* dialogs
* filters
* selected rows
* tabs
* temporary form state

### Feature state

* cart
* active shift
* current customer
* checkout state

### Domain/server state

* products
* orders
* inventory
* customers
* suppliers

Keep state ownership clear.

---

# 9. FORMS & VALIDATION

Every important form must include:

* proper TypeScript types
* schema validation
* required fields
* field-level errors
* submit state
* success feedback
* server/API error-ready handling
* reset/cancel behavior
* confirmation where destructive

Use the project's existing form/validation approach when available.

Do not create validation only visually.

---

# 10. UI STATES

Every major page must support:

### Loading

Skeleton or appropriate loading UI.

### Empty

Useful empty state with clear CTA.

### Error

Human-readable error state and retry/action where appropriate.

### Success

Toast/feedback or appropriate confirmation.

### Disabled

Buttons and controls must correctly reflect unavailable actions.

### Permission denied

Users without permission must not see or execute restricted actions.

---

# 11. ROLE & PERMISSION

The POS should be RBAC-ready.

At minimum consider:

* Owner
* Manager
* Cashier
* Inventory Manager
* Accountant

Do not rely only on hiding buttons.

Business actions should also respect permissions at the service/domain boundary where appropriate.

Example:

A Cashier may create a sale but should not arbitrarily change product cost price.

A Manager may approve refunds.

An Inventory Manager may perform stock adjustments.

---

# 12. ROUTING

Every module must have complete routing.

Use the existing routing conventions.

Do not create dead links.

Every navigation item must point to a valid page.

Every important action must lead to a valid destination.

For dynamic routes, make sure:

* valid IDs work
* invalid IDs show a proper not-found state
* breadcrumbs/navigation work
* back navigation is sensible

---

# 13. TABLES

Tables should support appropriate capabilities such as:

* search
* filtering
* sorting
* pagination
* row actions
* bulk actions where useful
* column visibility where useful
* responsive behavior

Do not add unnecessary features just for decoration.

---

# 14. RESPONSIVE DESIGN

The POS dashboard must work on:

* desktop
* laptop
* tablet

The primary POS counter experience should prioritize desktop/tablet usability.

Do not break the existing template's responsive behavior.

---

# 15. ACCESSIBILITY

Follow WCAG 2.2 AA principles where practical.

Ensure:

* keyboard navigation
* visible focus
* accessible labels
* proper button semantics
* dialog accessibility
* form error association
* sufficient contrast
* no interaction that depends exclusively on color

---

# 16. UX REQUIREMENTS

The system should feel like a real business application.

Use:

* clear hierarchy
* consistent terminology
* predictable actions
* confirmation for destructive operations
* meaningful success/error feedback
* sensible defaults
* useful empty states
* realistic sample data

Avoid:

* excessive animations
* decorative UI that reduces usability
* fake interactions
* buttons that do nothing
* placeholder pages
* "Coming Soon" for required functionality

---

# 17. MOCK PERSISTENCE

If the application currently uses mock data, implement persistence in the project's existing preferred way.

If appropriate, use:

* localStorage
* IndexedDB
* mock repository state
* an existing mock API layer

Do not let a page refresh destroy every user-created record unless the existing architecture explicitly requires it.

Mock persistence should mimic backend behavior as closely as practical.

---

# 18. INTEGRATION WITH PREVIOUS PHASES

Before implementing the requested Phase:

* inspect previously implemented POS modules
* reuse their domain types
* reuse repositories/services
* reuse shared components
* reuse existing mock records

Do NOT create duplicate:

* Product types
* Customer types
* Order types
* Inventory types
* User types
* Payment types

There must be one canonical domain model for each business entity.

---

# 19. CROSS-MODULE INTEGRATION

Whenever the current Phase affects another module, integrate it.

Example:

Product creation
→ Product repository
→ Inventory setup
→ POS product catalog

Sale
→ Order
→ Payment
→ Inventory movement
→ Customer history
→ Reports

Purchase
→ Purchase
→ Inventory increase
→ Supplier balance
→ Reports

Refund
→ Refund
→ Payment adjustment
→ Inventory restoration
→ Sales adjustment

Do not build isolated modules.

---

# 20. AUDITABILITY

Important business mutations should be traceable.

Where appropriate capture:

* actor
* timestamp
* action
* entity
* entity ID
* before/after values
* reason

The implementation should be ready for a future backend audit log.

---

# 21. NO HARDCODED BUSINESS LOGIC IN UI

Avoid code such as:

```ts
if (role === "admin") ...
```

repeated throughout components.

Prefer centralized permission definitions/helpers.

Similarly avoid duplicated pricing/tax/discount calculations.

---

# 22. NO FAKE BUTTONS

Every button must either:

* perform a real prototype action
* navigate to a real route
* open a functional dialog/drawer
* trigger a meaningful state change

Do not leave non-functional buttons pretending to work.

If an advanced backend-only capability cannot be realistically implemented in the prototype, clearly isolate it behind an API-ready service boundary instead of faking success.

---

# 23. FILE & CODE QUALITY

Follow the existing project conventions.

Keep:

* components focused
* domain logic reusable
* services testable
* types centralized where appropriate
* utilities reusable

Avoid:

* giant components
* duplicated logic
* unnecessary abstraction
* unnecessary dependencies
* dead code
* unused imports
* temporary hacks

---

# 24. DO NOT OVERWRITE EXISTING TEMPLATE FEATURES

Existing template functionality should continue working unless the Phase explicitly requires modifying it.

Before changing an existing component, determine whether it is shared.

Avoid breaking:

* authentication
* layout
* sidebar
* theme
* existing pages
* shared components

---

# 25. PHASE SCOPE CONTROL

Implement ONLY the requested Phase.

However, if the Phase requires a small supporting change in another module to make the current workflow genuinely functional, implement that integration.

Do not silently start implementing future modules.

Example:

If implementing Sales, you may add the necessary inventory movement integration.

But do not implement the entire Inventory Management module unless that is the requested Phase.

---

# 26. COMPLETION CHECKLIST

Before declaring the Phase complete, verify:

* [ ] Existing architecture was inspected.
* [ ] Existing components were reused where appropriate.
* [ ] All required routes exist.
* [ ] All required pages exist.
* [ ] CRUD/workflows are functional.
* [ ] Domain types are defined.
* [ ] Business rules are implemented.
* [ ] Service/repository boundary exists.
* [ ] Mock data is realistic.
* [ ] Mock data is consistent with other modules.
* [ ] Validation works.
* [ ] Permissions are respected.
* [ ] Loading states exist.
* [ ] Empty states exist.
* [ ] Error states exist.
* [ ] Success feedback exists.
* [ ] Destructive actions have confirmation.
* [ ] No important buttons are fake.
* [ ] Cross-module integration works.
* [ ] Backend replacement point is clear.
* [ ] TypeScript passes.
* [ ] Lint passes.
* [ ] Build passes.
* [ ] No obvious console errors.
* [ ] Existing application functionality still works.

---

# 27. FINAL PHASE REPORT

After implementation, report:

### Implemented

List everything actually completed.

### Routes

List all new/modified routes.

### Domain

List new/modified domain entities and business logic.

### Services / Repositories

List the data-access abstractions created or modified.

### Integration

Explain how this Phase connects with previous modules.

### Mock Data

Explain what data was added and how consistency is maintained.

### Validation

List important validation rules.

### Permissions

List role-based behavior.

### Backend Integration

Explain exactly what repository/service should later be replaced or connected to the real API.

### Verification

Report:

* typecheck
* lint
* build
* relevant flow verification

### Remaining Work

Only mention genuinely out-of-scope items.

Do NOT claim something is complete if it is only partially implemented.

---

# GOLDEN RULE

The requested Phase must be considered complete only when a real user can use that module from start to finish inside the prototype without encountering a dead-end, fake interaction, missing critical state, or hard-coded UI-only implementation.

Build it as a real POS module with a mock backend—not as a static template demo.
