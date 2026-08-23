import type { Branch } from "@/domain/types";
import { repositories } from "@/repositories";

type CreateBranchInput = {
  businessId: string;
  name: string;
  address: string;
  phone: string;
  managerId?: string;
  isActive?: boolean;
};

type UpdateBranchInput = {
  name?: string;
  address?: string;
  phone?: string;
  managerId?: string;
  isActive?: boolean;
};

type BranchServiceError = {
  code: "NOT_FOUND" | "BUSINESS_NOT_FOUND" | "UPDATE_FAILED";
  message: string;
};

export class BranchService {
  static async getBranches(filters?: { businessId?: string }) {
    return repositories.branch.getAll(filters);
  }

  static async getBranch(branchId: string): Promise<Branch | null> {
    return repositories.branch.getById(branchId);
  }

  static async createBranch(input: CreateBranchInput): Promise<Branch> {
    const business = await repositories.business.getById(input.businessId);
    if (!business) {
      throw { code: "BUSINESS_NOT_FOUND", message: "Business not found" } as BranchServiceError;
    }

    const branch = await repositories.branch.create({
      businessId: input.businessId,
      name: input.name,
      address: input.address,
      phone: input.phone,
      managerId: input.managerId,
      isActive: input.isActive ?? true,
    });

    return branch;
  }

  static async updateBranch(
    branchId: string,
    data: UpdateBranchInput
  ): Promise<Branch> {
    const existing = await repositories.branch.getById(branchId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Branch not found" } as BranchServiceError;
    }

    const updated = await repositories.branch.update(branchId, data);
    if (!updated) {
      throw { code: "UPDATE_FAILED", message: "Failed to update branch" } as BranchServiceError;
    }

    return updated;
  }

  static async archiveBranch(branchId: string): Promise<void> {
    const existing = await repositories.branch.getById(branchId);
    if (!existing) {
      throw { code: "NOT_FOUND", message: "Branch not found" } as BranchServiceError;
    }
    await repositories.branch.update(branchId, { isActive: false });
  }
}
