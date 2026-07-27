import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Stethoscope, 
  Receipt, 
  Users, 
  UserRound, 
  ShieldCheck, 
  Settings,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/training-certificates", label: "إفادات التدريب", icon: FileText },
  { href: "/medical-reports", label: "التقارير الطبية", icon: Stethoscope },
  { href: "/invoices", label: "فواتير البيع", icon: Receipt },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/doctors", label: "الأطباء", icon: UserRound },
  { href: "/users", label: "المستخدمون", icon: ShieldCheck },
  { href: "/audit-logs", label: "سجل العمليات", icon: History },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-64 bg-sidebar border-l border-sidebar-border text-sidebar-foreground flex flex-col z-50">
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold tracking-tight text-white">مستوصف العصار</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-sm font-bold">أ.م</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">أحمد مدير</span>
            <span className="text-xs text-sidebar-foreground/60">مدير النظام</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
