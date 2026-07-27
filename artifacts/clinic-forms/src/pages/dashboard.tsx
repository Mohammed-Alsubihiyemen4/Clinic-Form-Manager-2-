import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { FileText, Stethoscope, Receipt, Activity, Clock, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activities, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">نظرة عامة على نشاط مستوصف العصار الطبي.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="إفادات التدريب" 
          count={stats?.trainingCertificates} 
          icon={FileText} 
          href="/training-certificates" 
          createHref="/training-certificates/new"
          lastActivity={stats?.lastTrainingCertificate}
          loading={statsLoading} 
        />
        <StatCard 
          title="التقارير الطبية" 
          count={stats?.medicalReports} 
          icon={Stethoscope} 
          href="/medical-reports" 
          createHref="/medical-reports/new"
          lastActivity={stats?.lastMedicalReport}
          loading={statsLoading} 
        />
        <StatCard 
          title="فواتير البيع" 
          count={stats?.invoices} 
          icon={Receipt} 
          href="/invoices" 
          createHref="/invoices/new"
          lastActivity={stats?.lastInvoice}
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              سجل النشاطات الحديثة
            </h2>
          </div>
          
          <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
            {activityLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {activity.formType === "TrainingCertificate" && <FileText className="h-5 w-5 text-primary" />}
                      {activity.formType === "MedicalReport" && <Stethoscope className="h-5 w-5 text-primary" />}
                      {activity.formType === "Invoice" && <Receipt className="h-5 w-5 text-primary" />}
                      {(!["TrainingCertificate", "MedicalReport", "Invoice"].includes(activity.formType)) && <Activity className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.userName || "مستخدم غير معروف"} قام بـ {getActivityActionText(activity.action)} 
                        <span className="mx-1 font-semibold text-primary">{activity.formNumber}</span>
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <History className="h-12 w-12 mb-3 text-muted" />
                <p>لا توجد نشاطات حديثة</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            إحصائيات اليوم
          </h2>
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-5xl font-bold text-primary">
              {statsLoading ? <Skeleton className="h-12 w-24" /> : stats?.todayCount || 0}
            </span>
            <span className="text-muted-foreground">نموذج تم إصداره اليوم</span>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-xl shadow-sm p-6 mt-4">
            <h3 className="font-semibold mb-2 opacity-90">إجمالي إيرادات الفواتير</h3>
            <div className="text-3xl font-bold flex items-baseline gap-1">
              {statsLoading ? <Skeleton className="h-8 w-32 bg-primary-foreground/20" /> : (stats?.totalInvoiceAmount || 0).toLocaleString('ar-SA')}
              <span className="text-sm font-normal opacity-80">ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  count, 
  icon: Icon, 
  href, 
  createHref,
  lastActivity,
  loading 
}: { 
  title: string; 
  count?: number; 
  icon: any; 
  href: string; 
  createHref: string;
  lastActivity?: string | null;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2 text-foreground">
              {loading ? <Skeleton className="h-9 w-16" /> : count || 0}
            </h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {loading ? (
            <Skeleton className="h-3 w-24" />
          ) : lastActivity ? (
            <span>آخر نشاط: {formatDateTime(lastActivity)}</span>
          ) : (
            <span>لا توجد سجلات</span>
          )}
        </div>
      </div>
      <div className="bg-muted/30 border-t border-border p-3 flex gap-2">
        <Link href={createHref} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors">
          <PlusCircle className="h-4 w-4" />
          إصدار جديد
        </Link>
        <Link href={href} className="flex-1 bg-background hover:bg-muted border border-border text-foreground text-sm py-2 rounded-lg font-medium flex justify-center items-center transition-colors">
          عرض الكل
        </Link>
      </div>
    </div>
  );
}

function getActivityActionText(action: string) {
  switch (action.toLowerCase()) {
    case 'create': return 'إنشاء';
    case 'update': return 'تحديث';
    case 'delete': return 'أرشفة';
    case 'restore': return 'استعادة';
    case 'print': return 'طباعة';
    default: return action;
  }
}

import { History } from "lucide-react";
