import React from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { repositories } from "@/repositories";
import { formatCurrency } from "@/utils/calculator";

export const metadata = {
  title: "POS Dashboard | FoodOra POS",
  description: "Point of Sale dashboard",
};

export default async function PosDashboardPage() {
  const orders = await repositories.order.getAll({ status: "completed" });
  const products = await repositories.product.getAll();
  const inventory = await repositories.inventory.getAll({ branchId: "br-1" });
  const lowStock = inventory.filter((i) => i.quantity <= i.minStockLevel);

  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="POS Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Sales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(todayRevenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStock.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()} - {order.paymentMethod}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.grandTotal)}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            {lowStock.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Variant {item.productVariantId}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Branch: {item.branchId}
                  </p>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">{item.quantity} left</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">All items are in stock.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
