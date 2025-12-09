import React from "react";

interface PracticeLayoutProps {
  children: React.ReactNode;
}

export function PracticeLayout({ children }: PracticeLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="flex items-center h-14 px-4 border-b shrink-0 gap-2">
        <div className="font-semibold">Practice Configurator</div>
      </div>
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-6 bg-muted/20">
        {children}
      </div>
    </div>
  );
}
