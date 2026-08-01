import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";

export function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen lg:pr-64">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0d2137 0%, #0a3330 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Logo in top bar */}
          <img
            src={`${import.meta.env.BASE_URL}logo-assar.jpg`}
            alt="مستوصف العصار"
            className="h-9 object-contain"
            style={{ filter: "brightness(1.05)" }}
          />

          {/* Hamburger button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
            aria-label="قائمة التنقل"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
