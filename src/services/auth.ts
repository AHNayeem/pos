import type { User, Role } from "@/domain/types";
import { repositories } from "@/repositories";

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult = {
  user: User;
  role: Role;
  token: string;
};

type AuthServiceError = {
  code: "INVALID_CREDENTIALS" | "USER_INACTIVE" | "UNKNOWN_ERROR";
  message: string;
};

export class AuthService {
  static async login(input: LoginInput): Promise<LoginResult> {
    const user = await repositories.user.getByEmail(input.email.toLowerCase());
    if (!user) {
      throw { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } as AuthServiceError;
    }

    if (!user.isActive) {
      throw { code: "USER_INACTIVE", message: "Your account is inactive. Contact support." } as AuthServiceError;
    }

    const role = await repositories.role.getByName(user.role);
    if (!role) {
      throw { code: "UNKNOWN_ERROR", message: "Role configuration missing" } as AuthServiceError;
    }

    const token = `pos-token-${user.id}-${Date.now()}`;
    return { user, role, token };
  }

  static async getCurrentUser(userId: string): Promise<{ user: User; role: Role } | null> {
    const user = await repositories.user.getById(userId);
    if (!user || !user.isActive) return null;
    const role = await repositories.role.getByName(user.role);
    if (!role) return null;
    return { user, role };
  }

  static async validateToken(token: string): Promise<{ user: User; role: Role } | null> {
    const match = token.match(/^pos-token-(.+)-(\d+)$/);
    if (!match) return null;
    const userId = match[1];
    return this.getCurrentUser(userId);
  }
}
