#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo " Phase 23 - Final Integration & QA Verify"
echo "=========================================="
echo ""

FAIL=0

check() {
  local label="$1"
  local cmd="$2"
  echo "→ $label"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ PASS"
  else
    echo "  ✗ FAIL"
    FAIL=$((FAIL + 1))
  fi
}

echo "[1] Project structure"
check "settings pages exist (26)" "[ \$(ls 'src/app/(admin)/settings/'*/page.tsx | wc -l | tr -d ' ') = '26' ]"
check "settings components exist (26)" "[ $(ls src/components/settings/*Management.tsx src/components/settings/*SettingsForm.tsx 2>/dev/null | wc -l | tr -d ' ') = '26' ]"
check "service files exist (26)" "[ $(ls src/services/*.ts | wc -l | tr -d ' ') = '26' ]"

echo ""
echo "[2] Service exports"
check "AccountingService exported" "grep -q 'export { AccountingService }' src/services/index.ts"
check "NotificationService exported" "grep -q 'export { NotificationService }' src/services/index.ts"
check "AuditService exported" "grep -q 'export { AuditService }' src/services/index.ts"
check "SystemSettingsService exported" "grep -q 'export { SystemSettingsService }' src/services/index.ts"
check "PosService defined" "grep -q 'export class PosService' src/services/index.ts"
check "ShiftService defined" "grep -q 'export class ShiftService' src/services/index.ts"
check "ReportService defined" "grep -q 'export class ReportService' src/services/index.ts"

echo ""
echo "[3] Repository wiring"
check "repositories object exported" "grep -q 'export { repositories }' src/repositories/index.ts"
check "AccountingRepository exported" "grep -q 'AccountingRepository' src/repositories/index.ts"
check "NotificationRepository exported" "grep -q 'NotificationRepository' src/repositories/index.ts"
check "AuditLogRepository exported" "grep -q 'AuditLogRepository' src/repositories/index.ts"
check "SystemSettingsRepository exported" "grep -q 'SystemSettingsRepository' src/repositories/index.ts"

echo ""
echo "[4] Permissions"
check "notifications.read permission exists" "grep -q 'NOTIFICATIONS_READ' src/utils/permissions.ts"
check "audit.read permission exists" "grep -q 'AUDIT_READ' src/utils/permissions.ts"
check "systemSettings.read permission exists" "grep -q 'SYSTEM_SETTINGS_READ' src/utils/permissions.ts"
check "manager has notifications.write" "grep -q 'notifications.write' src/utils/permissions.ts"
check "accountant has audit.read" "grep -q 'audit.read' src/utils/permissions.ts"

echo ""
echo "[5] Sidebar integration"
check "Accounting sidebar entry" "grep -q 'path: \"/settings/accounting\"' src/layout/AppSidebar.tsx"
check "Notifications sidebar entry" "grep -q 'path: \"/settings/notifications\"' src/layout/AppSidebar.tsx"
check "Audit Log sidebar entry" "grep -q 'path: \"/settings/audit\"' src/layout/AppSidebar.tsx"
check "System Settings sidebar entry" "grep -q 'path: \"/settings/system\"' src/layout/AppSidebar.tsx"

echo ""
echo "[6] ProtectedRoute coverage"
check "accounting.read protected" "grep -r -q 'requiredPermission=\"accounting.read\"' src/app/\(admin\)/settings/accounting/page.tsx"
check "audit.read protected" "grep -r -q 'requiredPermission=\"audit.read\"' src/app/\(admin\)/settings/audit/page.tsx"
check "notifications.read protected" "grep -r -q 'requiredPermission=\"notifications.read\"' src/app/\(admin\)/settings/notifications/page.tsx"
check "systemSettings.read protected" "grep -r -q 'requiredPermission=\"systemSettings.read\"' src/app/\(admin\)/settings/system/page.tsx"

echo ""
echo "[7] TypeScript compilation"
if npx tsc --noEmit >/dev/null 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "[8] Build verification"
if npm run build >/dev/null 2>&1; then
  echo "  ✓ PASS"
else
  echo "  ✗ FAIL"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=========================================="
if [ "$FAIL" -eq 0 ]; then
  echo " All checks passed!"
else
  echo " $FAIL check(s) failed"
fi
echo "=========================================="
exit "$FAIL"
