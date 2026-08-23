"use client";

import React, { useState, useTransition, useMemo } from "react";
import { ReportService } from "@/services";
import type { Sale, Inventory } from "@/domain/types";
import { useToast } from "@/components/toast/ToastProvider";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ReportsManagementProps {
  initialSalesSummary: {
    totalOrders: number;
    totalSales: number;
    totalTax: number;
    totalDiscount: number;
    cashSales: number;
    cardSales: number;
    mobileSales: number;
    creditSales: number;
  };
  initialInventorySummary: {
    totalSKUs: number;
    totalQuantity: number;
    lowStockCount: number;
    totalStockValue: number;
    lowStockItems: { productVariantId: string; branchId: string; quantity: number; minStockLevel: number }[];
  };
  initialProfitSummary: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    margin: number;
  };
  initialTopProducts: { productVariantId: string; productName: string; variantName: string; quantity: number; revenue: number }[];
}

type DateRange = {
  from: string;
  to: string;
};

const emptyDateRange: DateRange = {
  from: "",
  to: "",
};

export default function ReportsManagement({
  initialSalesSummary,
  initialInventorySummary,
  initialProfitSummary,
  initialTopProducts,
}: ReportsManagementProps) {
  const [salesSummary, setSalesSummary] = useState(initialSalesSummary);
  const [inventorySummary, setInventorySummary] = useState(initialInventorySummary);
  const [profitSummary, setProfitSummary] = useState(initialProfitSummary);
  const [topProducts, setTopProducts] = useState(initialTopProducts);
  const [dateRange, setDateRange] = useState<DateRange>(emptyDateRange);
  const [branchId, setBranchId] = useState("br-1");
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const from = dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = dateRange.to || new Date().toISOString();
        const [sales, inventory, profit, top] = await Promise.all([
          ReportService.getSalesSummary(branchId, from, to),
          ReportService.getInventorySummary(branchId ? { branchId } : undefined),
          ReportService.getProfitSummary(branchId, from, to),
          ReportService.getTopProducts({ branchId, from, to, limit: 5 }),
        ]);
        setSalesSummary(sales);
        setInventorySummary(inventory);
        setProfitSummary(profit);
        setTopProducts(top);
        addToast("Reports refreshed successfully", "success");
      } catch {
        addToast("Failed to refresh reports", "error");
      }
    });
  };

  const salesChartOptions: ApexOptions = useMemo(() => ({
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val: number) => `${val}` } },
  }), []);

  const salesChartSeries = useMemo(() => [
    { name: "Sales", data: [salesSummary.totalSales * 0.1, salesSummary.totalSales * 0.15, salesSummary.totalSales * 0.08, salesSummary.totalSales * 0.12, salesSummary.totalSales * 0.09, salesSummary.totalSales * 0.11, salesSummary.totalSales * 0.14, salesSummary.totalSales * 0.06, salesSummary.totalSales * 0.13, salesSummary.totalSales * 0.18, salesSummary.totalSales * 0.16, salesSummary.totalSales * 0.07] },
  ], [salesSummary.totalSales]);

  const paymentChartOptions: ApexOptions = useMemo(() => ({
    colors: ["#465fff", "#9CB9FF", "#FFB547", "#FF6B6B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
    },
    labels: ["Cash", "Card", "Mobile", "Credit"],
    legend: { position: "bottom", fontFamily: "Outfit" },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () => formatCurrency(salesSummary.totalSales),
            },
          },
        },
      },
    },
    stroke: { show: false },
  }), [salesSummary.totalSales]);

  const paymentChartSeries = useMemo(() => {
    const total = salesSummary.totalSales || 1;
    return [
      salesSummary.cashSales / total * 100,
      salesSummary.cardSales / total * 100,
      salesSummary.mobileSales / total * 100,
      salesSummary.creditSales / total * 100,
    ];
  }, [salesSummary]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sales, inventory, and profit insights</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Branch ID (e.g. br-1)"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="sm:w-40"
          />
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
            className="sm:w-40"
          />
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
            className="sm:w-40"
          />
          <Button onClick={handleRefresh} disabled={isPending}>
            {isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesSummary.totalSales)}</h4>
          <p className="mt-1 text-xs text-gray-500">{salesSummary.totalOrders} orders</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(profitSummary.netProfit)}</h4>
          <p className="mt-1 text-xs text-gray-500">{profitSummary.margin.toFixed(1)}% margin</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(inventorySummary.totalStockValue)}</h4>
          <p className="mt-1 text-xs text-gray-500">{inventorySummary.totalSKUs} SKUs</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{inventorySummary.lowStockCount}</h4>
          <p className="mt-1 text-xs text-gray-500">Below min level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Overview</h3>
          <div className="max-w-full overflow-x-auto">
            <ReactApexChart options={salesChartOptions} series={salesChartSeries} type="bar" height={350} />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="max-w-full overflow-x-auto">
            <ReactApexChart options={paymentChartOptions} series={paymentChartSeries} type="donut" height={300} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Best performing products by revenue</p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Qty Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No product data available for the selected period.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr key={product.productVariantId}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {index + 1}. {product.productName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{product.variantName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{product.quantity}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profit Breakdown</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue, COGS, expenses, and net profit</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Revenue</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(profitSummary.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Cost of Goods Sold</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(profitSummary.costOfGoodsSold)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Gross Profit</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(profitSummary.grossProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
              <span className="text-sm font-semibold text-red-600">{formatCurrency(profitSummary.totalExpenses)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Profit</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(profitSummary.netProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</span>
              <Badge size="sm" color={profitSummary.margin >= 0 ? "success" : "error"}>
                {profitSummary.margin.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Items below minimum stock level</p>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Variant ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Branch ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Current Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {inventorySummary.lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No low stock items. Inventory levels are healthy.
                  </td>
                </tr>
              ) : (
                inventorySummary.lowStockItems.map((item) => (
                  <tr key={item.productVariantId + item.branchId}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.productVariantId}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.branchId}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.minStockLevel}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge size="sm" color="error">Low Stock</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
