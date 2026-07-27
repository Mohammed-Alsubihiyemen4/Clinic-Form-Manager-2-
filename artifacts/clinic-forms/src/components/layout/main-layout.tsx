import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 pr-64 flex flex-col min-h-screen">
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
