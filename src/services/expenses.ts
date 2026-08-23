import { repositories } from "@/repositories";
import type { Expense } from "@/domain/types";

type ExpenseServiceError = { code: string; message: string };

export class ExpenseService {
  static async getExpenses(filters?: { branchId?: string; category?: string; from?: string; to?: string }) {
    const expenses = await repositories.expense.getAll({
      branchId: filters?.branchId,
      category: filters?.category,
      from: filters?.from,
      to: filters?.to,
    });
    return expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getExpense(expenseId: string): Promise<Expense | null> {
    return repositories.expense.getById(expenseId);
  }

  static async createExpense(input: {
    branchId: string;
    category: string;
    amount: number;
    note?: string;
    reference?: string;
    actorId: string;
  }): Promise<Expense> {
    if (!input.branchId || input.branchId.trim() === "") {
      throw { code: "INVALID_BRANCH", message: "Branch is required" } as ExpenseServiceError;
    }
    if (!input.category || input.category.trim() === "") {
      throw { code: "INVALID_CATEGORY", message: "Category is required" } as ExpenseServiceError;
    }
    if (input.amount === undefined || input.amount === null || input.amount <= 0) {
      throw { code: "INVALID_AMOUNT", message: "Amount must be greater than zero" } as ExpenseServiceError;
    }
    if (!input.actorId || input.actorId.trim() === "") {
      throw { code: "INVALID_ACTOR", message: "Actor is required" } as ExpenseServiceError;
    }
    return repositories.expense.create({
      branchId: input.branchId.trim(),
      category: input.category.trim(),
      amount: input.amount,
      note: input.note?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
      actorId: input.actorId.trim(),
    });
  }
}
