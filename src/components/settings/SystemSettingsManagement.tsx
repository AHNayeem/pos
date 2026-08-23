"use client";

import React, { useState, useTransition } from "react";
import { SystemSettingsService } from "@/services";
import type { SystemSettings, PaymentMethod } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

interface SystemSettingsManagementProps {
  initialSettings: SystemSettings | null;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile" },
  { value: "credit", label: "Credit" },
  { value: "voucher", label: "Voucher" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIMEZONES = [
  { value: "Asia/Dhaka", label: "Asia/Dhaka (UTC+6)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (UTC+5)" },
];

export default function SystemSettingsManagement({ initialSettings }: SystemSettingsManagementProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const [receiptShowLogo, setReceiptShowLogo] = useState(initialSettings?.receiptShowLogo ?? true);
  const [receiptFooter, setReceiptFooter] = useState(initialSettings?.receiptFooter ?? "");
  const [receiptShowTax, setReceiptShowTax] = useState(initialSettings?.receiptShowTax ?? true);
  const [posRequireCustomer, setPosRequireCustomer] = useState(initialSettings?.posRequireCustomer ?? false);
  const [posAllowHoldOrders, setPosAllowHoldOrders] = useState(initialSettings?.posAllowHoldOrders ?? true);
  const [posDefaultPaymentMethod, setPosDefaultPaymentMethod] = useState<PaymentMethod>(initialSettings?.posDefaultPaymentMethod ?? "cash");
  const [dateFormat, setDateFormat] = useState(initialSettings?.dateFormat ?? "MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">(initialSettings?.timeFormat ?? "12h");
  const [timezone, setTimezone] = useState(initialSettings?.timezone ?? "Asia/Dhaka");
  const [currency, setCurrency] = useState(initialSettings?.currency ?? "BDT");
  const [currencySymbol, setCurrencySymbol] = useState(initialSettings?.currencySymbol ?? "৳");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await SystemSettingsService.updateSettings({
          receiptShowLogo,
          receiptFooter,
          receiptShowTax,
          posRequireCustomer,
          posAllowHoldOrders,
          posDefaultPaymentMethod,
          dateFormat,
          timeFormat,
          timezone,
          currency,
          currencySymbol,
        });
        addToast("System settings updated successfully", "success");
      } catch {
        addToast("Failed to update system settings", "error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Receipt Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="receiptShowLogo"
                checked={receiptShowLogo}
                onChange={(e) => setReceiptShowLogo(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="receiptShowLogo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Show logo on receipt</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="receiptShowTax"
                checked={receiptShowTax}
                onChange={(e) => setReceiptShowTax(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="receiptShowTax" className="text-sm font-medium text-gray-700 dark:text-gray-300">Show tax breakdown on receipt</label>
            </div>
            <div>
              <label htmlFor="receiptFooter" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Footer Text</label>
              <textarea
                id="receiptFooter"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="Thank you for shopping with us!"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">POS Behavior</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="posRequireCustomer"
                checked={posRequireCustomer}
                onChange={(e) => setPosRequireCustomer(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="posRequireCustomer" className="text-sm font-medium text-gray-700 dark:text-gray-300">Require customer for checkout</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="posAllowHoldOrders"
                checked={posAllowHoldOrders}
                onChange={(e) => setPosAllowHoldOrders(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="posAllowHoldOrders" className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow hold orders</label>
            </div>
            <div>
              <label htmlFor="posDefaultPaymentMethod" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Default Payment Method</label>
              <select
                id="posDefaultPaymentMethod"
                value={posDefaultPaymentMethod}
                onChange={(e) => setPosDefaultPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Date & Time</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="dateFormat" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date Format</label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeFormat" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Time Format</label>
              <select
                id="timeFormat"
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as "12h" | "24h")}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Currency</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Code</label>
              <Input
                type="text"
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="e.g. BDT"
                required
              />
            </div>
            <div>
              <label htmlFor="currencySymbol" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Symbol</label>
              <Input
                type="text"
                id="currencySymbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. ৳"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
