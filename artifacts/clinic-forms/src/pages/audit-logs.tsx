import { useState } from "react";
import { 
  useListAuditLogs,
  getListAuditLogsQueryKey
} from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AuditLogs() {
  const [formType, setFormType] = useState<string>("all");
  
  const { data: logs, isLoading } = useListAuditLogs(
    { formType: formType === "all" ? undefined : formType },
    { query: { queryKey: getListAuditLogsQueryKey({ formType: formType === "all" ? undefined : formType }) } }
  );

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">إنشاء</Badge>;
      case 'update': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">تحديث</Badge>;
      case 'delete': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">أرشفة</Badge>;
      case 'restore': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">استعادة</Badge>;
      case 'print': return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">طباعة</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getFormTypeName = (type: string) => {
    switch (type) {
      case 'TrainingCertificate': return 'إفادة تدريب';
      case 'MedicalReport': return 'تقرير طبي';
      case 'Invoice': return 'فاتورة بيع';
      case 'Customer': return 'عميل';
      case 'Doctor': return 'طبيب';
      case 'User': return 'مستخدم';
      case 'Settings': return 'إعدادات';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">سجل العمليات</h1>
        <p className="text-muted-foreground mt-1">تتبع كافة العمليات التي تمت على النظام.</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب نوع النموذج..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="TrainingCertificate">إفادات التدريب</SelectItem>
                  <SelectItem value="MedicalReport">التقارير الطبية</SelectItem>
                  <SelectItem value="Invoice">الفواتير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ والوقت</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>العملية</TableHead>
                <TableHead>نوع النموذج</TableHead>
                <TableHead>رقم/معرف النموذج</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا يوجد سجل عمليات.</TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="font-medium">{log.userName || "غير معروف"}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getFormTypeName(log.formType)}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-xs">{log.formNumber}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-xs text-muted-foreground">{log.ipAddress || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
