"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermission="pos.read">
      {children}
    </ProtectedRoute>
  );
}
