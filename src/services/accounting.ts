import { repositories } from "@/repositories";
import type { Account, Transaction, AccountType, TransactionType } from "@/domain/types";

type AccountingServiceError = { code: string; message: string };

export class AccountingService {
  static async getAccounts(filters?: { type?: AccountType; branchId?: string }): Promise<Account[]> {
    return repositories.accounting.getAllAccounts({
      type: filters?.type,
      branchId: filters?.branchId,
    });
  }

  static async getAccount(accountId: string): Promise<Account | null> {
    return repositories.accounting.getAccountById(accountId);
  }

  static async createAccount(input: {
    name: string;
    type: AccountType;
    branchId: string;
    balance?: number;
    isActive?: boolean;
  }): Promise<Account> {
    if (!input.name || input.name.trim() === "") {
      throw { code: "INVALID_NAME", message: "Account name is required" } as AccountingServiceError;
    }
    if (!input.branchId || input.branchId.trim() === "") {
      throw { code: "INVALID_BRANCH", message: "Branch is required" } as AccountingServiceError;
    }
    return repositories.accounting.createAccount({
      name: input.name.trim(),
      type: input.type,
      branchId: input.branchId.trim(),
      balance: input.balance ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  static async getTransactions(filters?: {
    accountId?: string;
    type?: TransactionType;
    referenceType?: Transaction["referenceType"];
    from?: string;
    to?: string;
  }): Promise<Transaction[]> {
    return repositories.accounting.getAllTransactions({
      accountId: filters?.accountId,
      type: filters?.type,
      referenceType: filters?.referenceType,
      from: filters?.from,
      to: filters?.to,
    });
  }

  static async getTransaction(transactionId: string): Promise<Transaction | null> {
    return repositories.accounting.getTransactionById(transactionId);
  }

  static async createTransaction(input: {
    accountId: string;
    type: TransactionType;
    amount: number;
    referenceId?: string;
    referenceType?: Transaction["referenceType"];
    note?: string;
    actorId: string;
  }): Promise<Transaction> {
    const account = await repositories.accounting.getAccountById(input.accountId);
    if (!account) {
      throw { code: "NOT_FOUND", message: "Account not found" } as AccountingServiceError;
    }
    if (input.amount === undefined || input.amount === null || input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Amount must be greater than zero" } as AccountingServiceError;
    }
    if (!input.actorId || input.actorId.trim() === "") {
      throw { code: "INVALID_ACTOR", message: "Actor is required" } as AccountingServiceError;
    }
    return repositories.accounting.createTransaction({
      accountId: input.accountId,
      type: input.type,
      amount: input.amount,
      referenceId: input.referenceId?.trim() || undefined,
      referenceType: input.referenceType,
      note: input.note?.trim() || undefined,
      actorId: input.actorId.trim(),
    });
  }

  static async getReceivableSummary(branchId?: string) {
    const accounts = await repositories.accounting.getAllAccounts({ type: "receivable", branchId });
    const totalReceivable = accounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      totalAccounts: accounts.length,
      totalReceivable,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, branchId: a.branchId, balance: a.balance })),
    };
  }

  static async getPayableSummary(branchId?: string) {
    const accounts = await repositories.accounting.getAllAccounts({ type: "payable", branchId });
    const totalPayable = accounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      totalAccounts: accounts.length,
      totalPayable,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, branchId: a.branchId, balance: a.balance })),
    };
  }

  static async getCashSummary(branchId?: string) {
    const accounts = await repositories.accounting.getAllAccounts({ type: "cash", branchId });
    const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      totalAccounts: accounts.length,
      totalCash,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, branchId: a.branchId, balance: a.balance })),
    };
  }

  static async getBankSummary(branchId?: string) {
    const accounts = await repositories.accounting.getAllAccounts({ type: "bank", branchId });
    const totalBank = accounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      totalAccounts: accounts.length,
      totalBank,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, branchId: a.branchId, balance: a.balance })),
    };
  }
}
