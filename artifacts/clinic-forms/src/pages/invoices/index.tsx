import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListInvoices, 
  useDeleteInvoice,
  useRestoreInvoice,
  getListInvoicesQueryKey
} from "@workspace/api-client-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
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
import { Search, Plus, MoreHorizontal, Eye, Printer, Archive, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState<string>("false");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoices, isLoading } = useListInvoices(
    { search, archived: archived === "all" ? undefined : archived },
    { query: { queryKey: getListInvoicesQueryKey({ search, archived: archived === "all" ? undefined : archived }) } }
  );

  const archiveMutation = useDeleteInvoice();
  const restoreMutation = useRestoreInvoice();

  const handleArchive = (id: number) => {
    archiveMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تمت الأرشفة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      }
    });
  };

  const handleRestore = (id: number) => {
    restoreMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تمت الاستعادة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">فواتير البيع النقدية</h1>
          <p className="text-muted-foreground mt-1">إدارة فواتير البيع النقدية للعملاء.</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            إنشاء فاتورة
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث برقم الفاتورة أو العميل..." 
              className="pl-3 pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>الفرع</TableHead>
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
              ) : invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    لا توجد فواتير.
                  </TableCell>
                </TableRow>
              ) : (
                invoices?.map((invoice) => (
                  <TableRow key={invoice.id} className={invoice.isArchived ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDateTime(invoice.invoiceDate).split(' ')[0]}</TableCell>
                    <TableCell>{invoice.customerName || invoice.notes || "عميل نقدي"}</TableCell>
                    <TableCell className="font-bold text-primary">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{invoice.branch || "-"}</TableCell>
                    <TableCell>
                      {invoice.isArchived ? (
                        <Badge variant="secondary">مؤرشفة</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مدفوعة</Badge>
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
                          <DropdownMenuItem onClick={() => setLocation(`/invoices/${invoice.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            عرض / تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/invoices/${invoice.id}?print=true`)}>
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {invoice.isArchived ? (
                            <DropdownMenuItem onClick={() => handleRestore(invoice.id)}>
                              <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                              استعادة
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchive(invoice.id)} className="text-destructive focus:text-destructive">
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
