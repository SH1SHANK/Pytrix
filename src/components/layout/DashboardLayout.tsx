import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="flex items-center h-14 px-4 border-b shrink-0 gap-2">
        <div className="font-semibold">Dashboard</div>
      </div>
      <div className="flex-1 overflow-auto p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {children}
      </div>
    </div>
  );
}
