import { repositories } from "@/repositories";
import type { AuditLog } from "@/domain/types";

type AuditServiceError = { code: string; message: string };

export class AuditService {
  static async getAuditLogs(filters?: { entity?: string; entityId?: string; actorId?: string; from?: string; to?: string }) {
    const logs = await repositories.auditLog.getAll(filters);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAuditLog(logId: string): Promise<AuditLog | null> {
    return repositories.auditLog.getById(logId);
  }

  static async createAuditLog(input: {
    actorId: string;
    actorName: string;
    action: string;
    entity: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string;
  }): Promise<AuditLog> {
    if (!input.actorId || input.actorId.trim() === "") {
      throw { code: "INVALID_ACTOR", message: "Actor ID is required" } as AuditServiceError;
    }
    if (!input.actorName || input.actorName.trim() === "") {
      throw { code: "INVALID_ACTOR_NAME", message: "Actor name is required" } as AuditServiceError;
    }
    if (!input.action || input.action.trim() === "") {
      throw { code: "INVALID_ACTION", message: "Action is required" } as AuditServiceError;
    }
    if (!input.entity || input.entity.trim() === "") {
      throw { code: "INVALID_ENTITY", message: "Entity is required" } as AuditServiceError;
    }
    if (!input.entityId || input.entityId.trim() === "") {
      throw { code: "INVALID_ENTITY_ID", message: "Entity ID is required" } as AuditServiceError;
    }
    return repositories.auditLog.create({
      actorId: input.actorId.trim(),
      actorName: input.actorName.trim(),
      action: input.action.trim(),
      entity: input.entity.trim(),
      entityId: input.entityId.trim(),
      before: input.before,
      after: input.after,
      reason: input.reason?.trim() || undefined,
    });
  }
}
