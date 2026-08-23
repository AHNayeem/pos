import { repositories } from "@/repositories";
import type { StoreCreditTransaction } from "@/domain/types";

type StoreCreditServiceError = { code: string; message: string };

export class StoreCreditService {
  static async getStoreCreditTransactions(filters?: { customerId?: string; type?: string; from?: string; to?: string }) {
    const transactions = await repositories.storeCredit.getAll({
      customerId: filters?.customerId,
      type: filters?.type,
      from: filters?.from,
      to: filters?.to,
    });
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getStoreCreditTransaction(transactionId: string): Promise<StoreCreditTransaction | null> {
    return repositories.storeCredit.getById(transactionId);
  }

  static async getCustomerBalance(customerId: string): Promise<number> {
    const transactions = await repositories.storeCredit.getAll({ customerId });
    return transactions.reduce((balance, t) => {
      if (t.type === "issued") return balance + t.amount;
      if (t.type === "redeemed") return balance - t.amount;
      return balance;
    }, 0);
  }

  static async issueStoreCredit(input: {
    customerId: string;
    amount: number;
    note?: string;
    reference?: string;
  }): Promise<StoreCreditTransaction> {
    if (!input.customerId || input.customerId.trim() === "") {
      throw { code: "INVALID_CUSTOMER", message: "Customer is required" } as StoreCreditServiceError;
    }
    if (input.amount === undefined || input.amount === null || input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Amount must be greater than zero" } as StoreCreditServiceError;
    }
    return repositories.storeCredit.create({
      customerId: input.customerId.trim(),
      amount: input.amount,
      type: "issued",
      note: input.note?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
    });
  }

  static async redeemStoreCredit(input: {
    customerId: string;
    amount: number;
    note?: string;
    reference?: string;
  }): Promise<StoreCreditTransaction> {
    if (!input.customerId || input.customerId.trim() === "") {
      throw { code: "INVALID_CUSTOMER", message: "Customer is required" } as StoreCreditServiceError;
    }
    if (input.amount === undefined || input.amount === null || input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Amount must be greater than zero" } as StoreCreditServiceError;
    }

    const balance = await this.getCustomerBalance(input.customerId);
    if (balance < input.amount) {
      throw { code: "INSUFFICIENT_BALANCE", message: `Insufficient store credit balance. Available: ${balance}` } as StoreCreditServiceError;
    }

    return repositories.storeCredit.create({
      customerId: input.customerId.trim(),
      amount: input.amount,
      type: "redeemed",
      note: input.note?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
    });
  }
}
