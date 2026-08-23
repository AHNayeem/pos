"use client";

import React from "react";
import AppHeader from "@/layout/AppHeader";
import { useSidebar } from "@/context/SidebarContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <ProtectedRoute requiredPermission="pos.read">
      <div className="min-h-screen xl:flex">
        <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
          <AppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
