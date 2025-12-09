import React from "react";

interface ModulesLayoutProps {
  children: React.ReactNode;
}

export function ModulesLayout({ children }: ModulesLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="flex items-center h-14 px-4 border-b shrink-0 gap-2">
        <div className="font-semibold">Curriculum</div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
