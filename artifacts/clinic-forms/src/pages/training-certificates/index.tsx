import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListTrainingCertificates, 
  useDeleteTrainingCertificate,
  useRestoreTrainingCertificate
} from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Eye, Edit, Printer, Archive, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListTrainingCertificatesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function TrainingCertificates() {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState<string>("false");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Basic implementation of date filtering based on preset
  let from, to;
  const today = new Date();
  if (dateFilter === "today") {
    from = today.toISOString().split('T')[0];
    to = from;
  } else if (dateFilter === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    from = weekAgo.toISOString().split('T')[0];
    to = today.toISOString().split('T')[0];
  } else if (dateFilter === "month") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    from = monthAgo.toISOString().split('T')[0];
    to = today.toISOString().split('T')[0];
  }

  const { data: certificates, isLoading } = useListTrainingCertificates(
    { search, archived: archived === "all" ? undefined : archived, from, to },
    { query: { queryKey: getListTrainingCertificatesQueryKey({ search, archived: archived === "all" ? undefined : archived, from, to }) } }
  );

  const archiveMutation = useDeleteTrainingCertificate();
  const restoreMutation = useRestoreTrainingCertificate();

  const handleArchive = (id: number) => {
    archiveMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تمت الأرشفة بنجاح", description: "تم نقل الإفادة إلى الأرشيف" });
        queryClient.invalidateQueries({ queryKey: getListTrainingCertificatesQueryKey() });
      }
    });
  };

  const handleRestore = (id: number) => {
    restoreMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تمت الاستعادة بنجاح", description: "تمت استعادة الإفادة من الأرشيف" });
        queryClient.invalidateQueries({ queryKey: getListTrainingCertificatesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">إفادات التدريب</h1>
          <p className="text-muted-foreground mt-1">إدارة الإفادات التدريبية الخاصة بالمتدربين.</p>
        </div>
        <Button asChild>
          <Link href="/training-certificates/new">
            <Plus className="mr-2 h-4 w-4" />
            إصدار إفادة جديدة
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث برقم الإفادة أو اسم المتدرب..." 
              className="pl-3 pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية بالتاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأوقات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant={archived === "false" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setArchived("false")}
            >
              النشطة
            </Button>
            <Button 
              variant={archived === "true" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setArchived("true")}
            >
              الأرشيف
            </Button>
            <Button 
              variant={archived === "all" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setArchived("all")}
            >
              الكل
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الإفادة</TableHead>
                <TableHead>اسم المتدرب</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>تاريخ التدريب</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : certificates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    لا توجد إفادات تدريب.
                  </TableCell>
                </TableRow>
              ) : (
                certificates?.map((cert) => (
                  <TableRow key={cert.id} className={cert.isArchived ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                    <TableCell>{cert.traineeName}</TableCell>
                    <TableCell>{cert.department}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>من: {cert.startDate}</span>
                        <span>إلى: {cert.endDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(cert.issuedAt).split(' ')[0]}</TableCell>
                    <TableCell>
                      {cert.isArchived ? (
                        <Badge variant="secondary">مؤرشفة</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">نشطة</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">فتح القائمة</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setLocation(`/training-certificates/${cert.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            عرض / تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/training-certificates/${cert.id}?print=true`)}>
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {cert.isArchived ? (
                            <DropdownMenuItem onClick={() => handleRestore(cert.id)}>
                              <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                              استعادة
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchive(cert.id)} className="text-destructive focus:text-destructive">
                              <Archive className="mr-2 h-4 w-4" />
                              أرشفة
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
