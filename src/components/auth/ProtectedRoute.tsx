"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { hasPermission } from "@/utils/permissions";

export default function ProtectedRoute({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredPermission && user) {
      if (!hasPermission(user, requiredPermission)) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, requiredPermission, pathname, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredPermission && user) {
    if (!hasPermission(user, requiredPermission)) {
      return null;
    }
  }

  return <>{children}</>;
}
