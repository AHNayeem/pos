import { repositories } from "@/repositories";
import type { SystemSettings } from "@/domain/types";

type SystemSettingsServiceError = { code: string; message: string };

export class SystemSettingsService {
  static async getSettings(): Promise<SystemSettings | null> {
    return repositories.systemSettings.getSettings();
  }

  static async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const updated = await repositories.systemSettings.updateSettings(data);
    if (!updated) {
      throw { code: "NOT_FOUND", message: "System settings not found" } as SystemSettingsServiceError;
    }
    return updated;
  }
}
