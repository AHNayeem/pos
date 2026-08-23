import { repositories } from "@/repositories";
import type { Sale } from "@/domain/types";

type SaleServiceError = { code: string; message: string };

export class SaleService {
  static async getSales(filters?: { branchId?: string; status?: string; paymentStatus?: string; search?: string }) {
    const sales = await repositories.sale.getAll({
      branchId: filters?.branchId,
      status: filters?.status,
      paymentStatus: filters?.paymentStatus,
      search: filters?.search,
    });
    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getSale(saleId: string): Promise<Sale | null> {
    return repositories.sale.getById(saleId);
  }

  static async getSaleByOrder(orderId: string): Promise<Sale | null> {
    return repositories.sale.getByOrderId(orderId);
  }

  static async createSale(input: { orderId: string; note?: string }): Promise<Sale> {
    const order = await repositories.order.getById(input.orderId);
    if (!order) {
      throw { code: "NOT_FOUND", message: "Order not found" } as SaleServiceError;
    }
    const saleNumber = `INV-${String(Date.now()).slice(-6)}`;
    const nowIso = new Date().toISOString();
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const cashier = await repositories.user.getById(order.cashierId);
    const customer = order.customerId ? await repositories.customer.getById(order.customerId) : null;

    const sale: Sale = {
      id: `sale-${Math.random().toString(36).slice(2, 11)}`,
      saleNumber,
      orderId: input.orderId,
      branchId: order.branchId,
      customerId: order.customerId,
      customerName: customer?.name,
      cashierId: order.cashierId,
      cashierName: cashier?.name,
      items: order.items,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      grandTotal: order.grandTotal,
      paidAmount: order.paidAmount,
      changeAmount: order.changeAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.paymentStatus === "paid" ? "paid" : "issued",
      note: input.note,
      issuedAt: nowIso,
      dueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return repositories.sale.create(sale);
  }

  static async updateSaleStatus(saleId: string, status: Sale["status"]) {
    const sale = await repositories.sale.getById(saleId);
    if (!sale) {
      throw { code: "NOT_FOUND", message: "Sale not found" } as SaleServiceError;
    }
    return repositories.sale.update(saleId, { status, updatedAt: new Date().toISOString() });
  }
}
