import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  Receipt,
  Package,
  UserRound,
  ShieldCheck,
  Settings,
  History,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth";

const NAV_ITEMS = [
  {
    href: "/",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    page: "dashboard",
    color: "text-teal-300",
    activeBg: "bg-teal-600/25",
    hoverBg: "hover:bg-teal-600/15",
    dot: "#2dd4bf",
  },
  {
    href: "/training-certificates",
    label: "إفادات التدريب",
    icon: FileText,
    page: "training-certificates",
    color: "text-blue-300",
    activeBg: "bg-blue-600/25",
    hoverBg: "hover:bg-blue-600/15",
    dot: "#60a5fa",
  },
  {
    href: "/medical-reports",
    label: "التقارير الطبية",
    icon: Stethoscope,
    page: "medical-reports",
    color: "text-emerald-300",
    activeBg: "bg-emerald-600/25",
    hoverBg: "hover:bg-emerald-600/15",
    dot: "#6ee7b7",
  },
  {
    href: "/invoices",
    label: "فواتير البيع",
    icon: Receipt,
    page: "invoices",
    color: "text-amber-300",
    activeBg: "bg-amber-600/25",
    hoverBg: "hover:bg-amber-600/15",
    dot: "#fcd34d",
  },
  {
    href: "/products",
    label: "الأصناف",
    icon: Package,
    page: "products",
    color: "text-violet-300",
    activeBg: "bg-violet-600/25",
    hoverBg: "hover:bg-violet-600/15",
    dot: "#c4b5fd",
  },
  {
    href: "/doctors",
    label: "الأطباء",
    icon: UserRound,
    page: "doctors",
    color: "text-cyan-300",
    activeBg: "bg-cyan-600/25",
    hoverBg: "hover:bg-cyan-600/15",
    dot: "#67e8f9",
  },
  {
    href: "/users",
    label: "المستخدمون",
    icon: ShieldCheck,
    page: "users",
    color: "text-indigo-300",
    activeBg: "bg-indigo-600/25",
    hoverBg: "hover:bg-indigo-600/15",
    dot: "#a5b4fc",
  },
  {
    href: "/audit-logs",
    label: "سجل العمليات",
    icon: History,
    page: "audit-logs",
    color: "text-slate-300",
    activeBg: "bg-slate-600/25",
    hoverBg: "hover:bg-slate-600/15",
    dot: "#cbd5e1",
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: Settings,
    page: "settings",
    color: "text-rose-300",
    activeBg: "bg-rose-600/25",
    hoverBg: "hover:bg-rose-600/15",
    dot: "#fda4af",
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.slice(0, 2);
}

function getRoleLabel(role: string) {
  switch (role) {
    case "administrator": return "مدير النظام";
    case "manager": return "مدير";
    case "employee": return "موظف";
    case "viewer": return "مشاهد";
    default: return role;
  }
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout, hasAccess } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => hasAccess(item.page));

  return (
    <aside
      className={cn(
        // Base styles
        "fixed top-0 bottom-0 right-0 w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out",
        // Desktop: always visible
        "lg:translate-x-0",
        // Mobile: slide in/out
        open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}
      style={{
        background: "linear-gradient(180deg, #0d2137 0%, #0a3330 60%, #0d2137 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.4)" : "none",
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        className="shrink-0 flex flex-col items-center justify-center gap-1.5 py-4 px-4 relative"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute left-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <img
          src={`${import.meta.env.BASE_URL}logo-assar.jpg`}
          alt="مستوصف العصار"
          className="w-28 object-contain"
          style={{ filter: "brightness(1.05) drop-shadow(0 2px 8px rgba(26,158,143,0.3))" }}
        />
        <div className="text-center">
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            AL-Assar Medical Clinic
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm group relative",
                isActive
                  ? `${item.activeBg} ${item.color}`
                  : `text-white/60 ${item.hoverBg} hover:text-white/90`
              )}
            >
              {/* Colored dot for active state */}
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full transition-opacity duration-150"
                style={{
                  background: item.dot,
                  opacity: isActive ? 1 : 0,
                }}
              />
              <item.icon
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  isActive ? item.color : "text-white/40 group-hover:text-white/70"
                )}
                style={{ width: "18px", height: "18px" }}
              />
              <span className="truncate">{item.label}</span>

              {/* Active right border accent */}
              {isActive && (
                <span
                  className="absolute right-0 w-0.5 h-6 rounded-l"
                  style={{ background: item.dot }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User info + logout ── */}
      {user && (
        <div
          className="shrink-0 p-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #1a9e8f, #0d6e64)" }}
            >
              {getInitials(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {getRoleLabel(user.role)}
              </p>
            </div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 text-white/40 hover:text-red-400" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
