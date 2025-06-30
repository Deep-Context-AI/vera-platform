import React from 'react';
import { BoltNewBadge } from "@/components/ui/BoltNewBadge";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
      
      {/* Bolt Badge */}
      <BoltNewBadge position="bottom-right" variant="light" size="medium" />
    </div>
  );
} 