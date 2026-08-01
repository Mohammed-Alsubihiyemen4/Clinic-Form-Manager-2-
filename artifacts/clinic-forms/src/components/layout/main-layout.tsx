import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen text-foreground flex"
      style={{
        background: `
          radial-gradient(ellipse at 10% 0%, rgba(26,158,143,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 90% 100%, rgba(13,54,78,0.05) 0%, transparent 50%),
          hsl(195, 30%, 97%)
        `,
      }}
    >
      <Sidebar />
      <main className="flex-1 pr-64 flex flex-col min-h-screen">
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
