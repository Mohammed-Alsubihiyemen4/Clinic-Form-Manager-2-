import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRoute, useLocation } from "wouter";
import {
  useGetInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useListCustomers,
  getGetInvoiceQueryKey,
  InvoiceItemInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Printer, Save, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}/${m}/${day}`;
}
function fmt3(n: number) { return n.toFixed(3); }

export default function InvoiceForm() {
  const [, params] = useRoute("/invoices/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useGetInvoice(id!, {
    query: { enabled: !isNew, queryKey: getGetInvoiceQueryKey(id!) },
  });
  const { data: customers } = useListCustomers();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    customerId: undefined as number | undefined,
    branch: "الإدارة العامة",
    section: "قطاع عام",
    department: "القسم العام",
    collector: "",
    notes: "",
    discount: 0,
    items: [] as InvoiceItemInput[],
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceDate: invoice.invoiceDate.split("T")[0],
        customerId: invoice.customerId || undefined,
        branch: invoice.branch || "",
        section: invoice.section || "",
        department: invoice.department || "",
        collector: invoice.collector || "",
        notes: invoice.notes || "",
        discount: invoice.discount || 0,
        items: invoice.items.map((item) => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unit,
          quantity: item.quantity,
          bonus: item.bonus || 0,
          price: item.price,
        })),
      });
    } else if (isNew && formData.items.length === 0) {
      setFormData((p) => ({
        ...p,
        items: [{ itemCode: "", itemName: "", unit: "عام", quantity: 1, bonus: 0, price: 0 }],
      }));
    }
  }, [invoice, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.name === "discount" ? Number(e.target.value) : e.target.value }));
  const handleCustomerChange = (val: string) =>
    setFormData((p) => ({ ...p, customerId: val === "none" ? undefined : Number(val) }));
  const handleItemChange = (index: number, field: string, value: string | number) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData((p) => ({ ...p, items }));
  };
  const addItem = () =>
    setFormData((p) => ({ ...p, items: [...p.items, { itemCode: "", itemName: "", unit: "عام", quantity: 1, bonus: 0, price: 0 }] }));
  const removeItem = (index: number) =>
    setFormData((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));

  const subtotal = formData.items.reduce((s, it) => s + it.quantity * it.price, 0);
  const grandTotal = subtotal - (formData.discount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: "خطأ", description: "يجب إضافة صنف واحد على الأقل", variant: "destructive" });
      return;
    }
    const cleanData = { ...formData, items: formData.items.filter((it) => it.itemName.trim()) };
    if (isNew) {
      createMutation.mutate({ data: cleanData }, {
        onSuccess: (data) => { toast({ title: "تم إنشاء الفاتورة بنجاح" }); setLocation(`/invoices/${data.id}`); },
      });
    } else {
      updateMutation.mutate({ id, data: cleanData }, {
        onSuccess: () => { toast({ title: "تم تحديث الفاتورة بنجاح" }); queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) }); },
      });
    }
  };

  if (isLoading && !isNew) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const selectedCustomer = customers?.find((c) => c.id === formData.customerId);
  const letterheadUrl = `${import.meta.env.BASE_URL}letterhead.jpg`;

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    height: "297mm",
    boxSizing: "border-box",
    overflow: "hidden",
    backgroundImage: `url(${letterheadUrl})`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
    paddingTop: "46mm",
    paddingRight: "12mm",
    paddingBottom: "0",
    paddingLeft: "12mm",
    fontFamily: "'Arial', 'Cairo', sans-serif",
    color: "#000",
    backgroundColor: "#fff",
    position: "relative",
  };

  const tdBase: React.CSSProperties = {
    border: "1px solid #000",
    padding: "2px 5px",
    textAlign: "center",
    fontSize: "12pt",
    color: "#000",
    verticalAlign: "middle",
    fontFamily: "'Arial', 'Cairo', sans-serif",
  };
  const thBase: React.CSSProperties = {
    ...tdBase,
    fontWeight: "700",
    backgroundColor: "#1a9e8f",
    color: "#fff",
    fontSize: "13pt",
  };
  const MIN_ROWS = 5;

  /* ─────────────────────────────────────────────────────────────────
     DOCUMENT INNER CONTENT — shared between portal and screen preview
  ───────────────────────────────────────────────────────────────── */
  const docContent = (
    <>
      {/* ── INVOICE TITLE ── */}
      <div style={{ textAlign: "center", marginBottom: "3mm" }}>
        <span style={{
          border: "1px solid #000",
          padding: "3px 30px",
          fontSize: "14pt",
          fontWeight: "700",
          color: "#000",
          display: "inline-block",
          fontFamily: "'Arial', 'Cairo', sans-serif",
        }}>
          فاتورة بيع نقدية
        </span>
      </div>

      {/* ── METADATA BOX — 5 rows ──
          Row 1: Date (full width)
          Row 2: Invoice number in RED (full width)
          Row 3: Branch + Collector
          Row 4: Section + Notes
          Row 5: Department (full width)
      ── */}
      <div style={{ border: "1px solid #000", fontSize: "12pt", lineHeight: "1.8", marginBottom: "2mm", color: "#000", fontFamily: "'Arial', 'Cairo', sans-serif" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>التاريخ</span>&nbsp;/&nbsp;{fmtDate(formData.invoiceDate)}م
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>رقم الفاتورة</span>&nbsp;/&nbsp;
                <span style={{ fontWeight: "900", fontSize: "13pt", color: "#cc0000" }}>
                  {invoice?.invoiceNumber || "—"}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ width: "55%", textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc", borderLeft: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>الفـرع</span>&nbsp;/&nbsp;{formData.branch}
              </td>
              <td style={{ width: "45%", textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>المتحصل</span>&nbsp;/&nbsp;{formData.collector}
              </td>
            </tr>
            <tr>
              <td style={{ width: "55%", textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc", borderLeft: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>القطاع</span>&nbsp;/&nbsp;{formData.section}
              </td>
              <td style={{ width: "45%", textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>ملاحظات</span>&nbsp;/&nbsp;{formData.notes}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", padding: "2px 8px" }}>
                <span style={{ fontWeight: "700" }}>القسم</span>&nbsp;/&nbsp;{formData.department}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── CUSTOMER BOX ── */}
      <div style={{ border: "1px solid #000", fontSize: "12pt", lineHeight: "1.8", marginBottom: "2mm", color: "#000", fontFamily: "'Arial', 'Cairo', sans-serif" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", padding: "2px 8px", borderBottom: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>رقم العميل</span>&nbsp;/&nbsp;{selectedCustomer?.customerCode || "—"}
                &emsp;&emsp;
                <span style={{ fontWeight: "700" }}>المطلوب من الأخوة</span>&nbsp;/&nbsp;{selectedCustomer?.name || "عميل نقدي"}
              </td>
            </tr>
            <tr>
              <td style={{ width: "60%", textAlign: "right", padding: "2px 8px", borderLeft: "1px solid #ccc" }}>
                <span style={{ fontWeight: "700" }}>العنوان</span>&nbsp;/&nbsp;{selectedCustomer?.address || "اليمن"}
              </td>
              <td style={{ width: "40%", textAlign: "right", padding: "2px 8px" }}>
                <span style={{ fontWeight: "700" }}>عملة المستند</span>&nbsp;/&nbsp;ريال يمني
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── ITEMS TABLE — teal header ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2mm" }}>
        <thead>
          <tr>
            <th style={{ ...thBase, width: "22px" }}>م</th>
            <th style={{ ...thBase, width: "68px" }}>رقم الصنف</th>
            <th style={thBase}>اسـم الصنف</th>
            <th style={{ ...thBase, width: "38px" }}>الوحدة</th>
            <th style={{ ...thBase, width: "38px" }}>الكمية</th>
            <th style={{ ...thBase, width: "38px" }}>البونص</th>
            <th style={{ ...thBase, width: "52px" }}>السعر</th>
            <th style={{ ...thBase, width: "60px" }}>القيمة</th>
          </tr>
        </thead>
        <tbody>
          {formData.items.map((item, idx) => (
            <tr key={idx}>
              <td style={tdBase}>{idx + 1}</td>
              <td style={tdBase}>{item.itemCode}</td>
              <td style={{ ...tdBase, textAlign: "right" }}>{item.itemName}</td>
              <td style={tdBase}>{item.unit}</td>
              <td style={tdBase}>{item.quantity}</td>
              <td style={tdBase}>{item.bonus ?? 0}</td>
              <td style={tdBase}>{fmt3(item.price)}</td>
              <td style={tdBase}>{fmt3(item.quantity * item.price)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, MIN_ROWS - formData.items.length) }).map((_, i) => (
            <tr key={`fill-${i}`}>
              {[...Array(8)].map((_, j) => <td key={j} style={{ ...tdBase, height: "20px" }}></td>)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── BOTTOM: Totals + Signatures ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr style={{ verticalAlign: "top" }}>
            <td style={{ paddingTop: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "11pt", fontFamily: "'Arial', 'Cairo', sans-serif" }}>
                <thead>
                  <tr>
                    {["أمين المستودع", "الموزع", "المبيعات", "المستلم"].map((label) => (
                      <th key={label} style={{ fontWeight: "700", padding: "0 4px 16px", color: "#000", fontSize: "11pt", borderBottom: "1px solid #888" }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </td>
            <td style={{ width: "155px", verticalAlign: "top" }}>
              <table style={{ width: "155px", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12pt", fontFamily: "'Arial', 'Cairo', sans-serif" }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "700", padding: "3px 6px", borderBottom: "1px solid #000", textAlign: "right", color: "#000" }}>الإجمالي قبل الخصم</td>
                    <td style={{ padding: "3px 6px", borderBottom: "1px solid #000", textAlign: "center", color: "#000", borderRight: "1px solid #000" }}>{fmt3(subtotal)}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <td style={{ fontWeight: "700", padding: "3px 6px", borderBottom: "1px solid #000", textAlign: "right", color: "#cc0000" }}>قيمـة الخصـم</td>
                    <td style={{ padding: "3px 6px", borderBottom: "1px solid #000", textAlign: "center", color: "#000", borderRight: "1px solid #000" }}>{fmt3(formData.discount || 0)}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#e8e8e8" }}>
                    <td style={{ fontWeight: "900", padding: "4px 6px", textAlign: "right", color: "#000", fontSize: "13pt" }}>الإجمالي</td>
                    <td style={{ fontWeight: "900", padding: "4px 6px", textAlign: "center", color: "#000", fontSize: "13pt", borderRight: "1px solid #000" }}>{fmt3(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const printPortal = createPortal(
    <div id="print-root" dir="rtl" style={pageStyle}>
      {docContent}
    </div>,
    document.getElementById("root")!
  );

  return (
    <>
      {printPortal}

      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6 print:hidden">
          <Button variant="outline" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "فاتورة بيع نقدية جديدة" : `تعديل فاتورة: ${invoice?.invoiceNumber}`}
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Form panel */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>العميل (اختياري)</Label>
                  <Select value={formData.customerId?.toString() || "none"} onValueChange={handleCustomerChange}>
                    <SelectTrigger><SelectValue placeholder="اختر العميل..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">عميل نقدي بدون تسجيل</SelectItem>
                      {customers?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الفرع / الإدارة</Label>
                  <Input name="branch" value={formData.branch} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>القطاع</Label>
                  <Input name="section" value={formData.section} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Input name="department" value={formData.department} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>المحصل</Label>
                  <Input name="collector" value={formData.collector} onChange={handleChange} />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>ملاحظات</Label>
                  <Input name="notes" value={formData.notes} onChange={handleChange} />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">الأصناف</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 ml-1" /> إضافة صنف
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start bg-muted/20 p-3 rounded-lg border border-border">
                      <div className="grid grid-cols-12 gap-2 flex-1">
                        <div className="col-span-2 space-y-1"><Label className="text-xs">رقم الصنف</Label><Input className="h-8" value={item.itemCode} onChange={(e) => handleItemChange(index, "itemCode", e.target.value)} /></div>
                        <div className="col-span-3 space-y-1"><Label className="text-xs">اسم الصنف</Label><Input className="h-8" value={item.itemName} onChange={(e) => handleItemChange(index, "itemName", e.target.value)} required /></div>
                        <div className="col-span-2 space-y-1"><Label className="text-xs">الوحدة</Label><Input className="h-8" value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} /></div>
                        <div className="col-span-1 space-y-1"><Label className="text-xs">الكمية</Label><Input type="number" min="1" className="h-8 p-1" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))} required /></div>
                        <div className="col-span-1 space-y-1"><Label className="text-xs">بونص</Label><Input type="number" min="0" className="h-8 p-1" value={item.bonus} onChange={(e) => handleItemChange(index, "bonus", Number(e.target.value))} /></div>
                        <div className="col-span-1 space-y-1"><Label className="text-xs">السعر</Label><Input type="number" min="0" step="0.001" className="h-8 p-1" value={item.price} onChange={(e) => handleItemChange(index, "price", Number(e.target.value))} required /></div>
                        <div className="col-span-2 space-y-1"><Label className="text-xs">الإجمالي</Label><div className="h-8 flex items-center px-2 bg-muted rounded border text-sm font-medium">{(item.quantity * item.price).toFixed(3)}</div></div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8 mt-5" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {formData.items.length === 0 && <div className="text-center p-4 text-muted-foreground text-sm border rounded-lg border-dashed">لم يتم إضافة أصناف بعد</div>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <div className="w-64 space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center text-sm"><span>الإجمالي قبل الخصم:</span><span className="font-semibold">{subtotal.toFixed(3)}</span></div>
                  <div className="flex justify-between items-center text-sm">
                    <span>قيمة الخصم:</span>
                    <Input type="number" min="0" step="0.001" className="w-24 h-8 text-left" dir="ltr" name="discount" value={formData.discount} onChange={handleChange} />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                    <span className="font-bold text-primary">الإجمالي:</span>
                    <span className="font-bold text-xl text-primary">{grandTotal.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />{isNew ? "حفظ الفاتورة" : "حفظ التعديلات"}
                </Button>
                {!isNew && (
                  <Button type="button" variant="outline" onClick={() => window.print()} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />طباعة الفاتورة
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Screen-only scaled preview — RTL: anchor to top-right */}
          <div className="print:hidden w-full flex justify-center">
            <div
              style={{
                position: "relative",
                width: "calc(210mm * 0.55)",
                height: "calc(297mm * 0.55)",
                overflow: "hidden",
                borderRadius: "4px",
                boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
                flexShrink: 0,
              }}
            >
              <div
                dir="rtl"
                style={{
                  ...pageStyle,
                  position: "absolute",
                  top: 0,
                  right: 0,
                  transform: "scale(0.55)",
                  transformOrigin: "top right",
                }}
              >
                {docContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
