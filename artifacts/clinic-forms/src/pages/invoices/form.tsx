import { useState, useEffect } from "react";
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
import { ClinicHeader } from "@/components/print/ClinicHeader";

export default function InvoiceForm() {
  const [, params] = useRoute("/invoices/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useGetInvoice(id!, {
    query: {
      enabled: !isNew,
      queryKey: getGetInvoiceQueryKey(id!),
    },
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
      setFormData((prev) => ({
        ...prev,
        items: [{ itemCode: "", itemName: "", unit: "عام", quantity: 1, bonus: 0, price: 0 }],
      }));
    }
  }, [invoice, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "discount" ? Number(value) : value }));
  };

  const handleCustomerChange = (val: string) => {
    setFormData((prev) => ({ ...prev, customerId: val === "none" ? undefined : Number(val) }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemCode: "", itemName: "", unit: "عام", quantity: 1, bonus: 0, price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateSubtotal = () =>
    formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: "خطأ", description: "يجب إضافة صنف واحد على الأقل", variant: "destructive" });
      return;
    }
    const cleanData = {
      ...formData,
      items: formData.items.filter((item) => item.itemName.trim() !== ""),
    };
    if (isNew) {
      createMutation.mutate(
        { data: cleanData },
        {
          onSuccess: (data) => {
            toast({ title: "تم إنشاء الفاتورة بنجاح" });
            setLocation(`/invoices/${data.id}`);
          },
        }
      );
    } else {
      updateMutation.mutate(
        { id, data: cleanData },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث الفاتورة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
          },
        }
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !isNew) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  const selectedCustomer = customers?.find((c) => c.id === formData.customerId);
  const subtotal = calculateSubtotal();
  const grandTotal = subtotal - (formData.discount || 0);

  const formatArabicDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  // Minimal table row height to match the original
  const MIN_ROWS = 5;
  const fillerRows = Math.max(0, MIN_ROWS - formData.items.length);

  const cellStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "3px 5px",
    textAlign: "center",
    fontSize: "12px",
  };

  const thStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: "700",
    backgroundColor: "#f0f0f0",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Button variant="outline" size="icon" onClick={() => setLocation("/invoices")}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "فاتورة بيع نقدية جديدة" : `تعديل فاتورة: ${invoice?.invoiceNumber}`}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>العميل (اختياري)</Label>
                <Select
                  value={formData.customerId?.toString() || "none"}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">عميل نقدي بدون تسجيل</SelectItem>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الفرع / الإدارة</Label>
                <Input name="branch" value={formData.branch} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                />
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
                  <div
                    key={index}
                    className="flex gap-2 items-start bg-muted/20 p-3 rounded-lg border border-border"
                  >
                    <div className="grid grid-cols-12 gap-2 flex-1">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">رقم الصنف</Label>
                        <Input
                          className="h-8"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(index, "itemCode", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">اسم الصنف</Label>
                        <Input
                          className="h-8"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">الوحدة</Label>
                        <Input
                          className="h-8"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">الكمية</Label>
                        <Input
                          type="number"
                          min="1"
                          className="h-8 p-1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", Number(e.target.value))
                          }
                          required
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">بونص</Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 p-1"
                          value={item.bonus}
                          onChange={(e) =>
                            handleItemChange(index, "bonus", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">السعر</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8 p-1"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", Number(e.target.value))
                          }
                          required
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">الإجمالي</Label>
                        <div className="h-8 flex items-center px-2 bg-muted rounded border text-sm font-medium">
                          {(item.quantity * item.price).toFixed(3)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8 mt-5"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground text-sm border rounded-lg border-dashed">
                    لم يتم إضافة أصناف بعد
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <div className="w-64 space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center text-sm">
                  <span>الإجمالي قبل الخصم:</span>
                  <span className="font-semibold">{subtotal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>قيمة الخصم:</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    className="w-24 h-8 text-left"
                    dir="ltr"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                  <span className="font-bold text-primary">الإجمالي:</span>
                  <span className="font-bold text-xl text-primary">{grandTotal.toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {isNew ? "حفظ الفاتورة" : "حفظ التعديلات"}
              </Button>
              {!isNew && (
                <Button type="button" variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  طباعة الفاتورة
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Print Preview */}
        <div className="bg-muted/30 rounded-xl p-4 flex items-start justify-center print:p-0 print:bg-transparent overflow-x-auto">
          {/* A4 page */}
          <div
            id="print-root"
            dir="rtl"
            style={{
              width: "210mm",
              minHeight: "297mm",
              backgroundColor: "#fff",
              color: "#000",
              fontFamily: "'Cairo', 'Arial', sans-serif",
              padding: "10mm 12mm 10mm 12mm",
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
            }}
          >
            {/* ========== CLINIC HEADER ========== */}
            <ClinicHeader />

            {/* ========== INVOICE TITLE BOX ========== */}
            <div
              style={{
                textAlign: "center",
                margin: "6mm 0 5mm 0",
              }}
            >
              <span
                style={{
                  border: "1px solid #000",
                  padding: "4px 28px",
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                فاتورة بيع نقدية
              </span>
            </div>

            {/* ========== INVOICE METADATA BOX ========== */}
            <div
              style={{
                border: "1px solid #000",
                padding: "5px 8px",
                fontSize: "13px",
                lineHeight: "1.9",
                marginBottom: "4mm",
              }}
            >
              {/* Top row: date (right) + invoice number (right) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <div style={{ flex: "1" }}>
                  <span style={{ fontWeight: "700" }}>الفـرع</span> /&nbsp;
                  {formData.branch}
                </div>
                <div style={{ flex: "1", textAlign: "right" }}>
                  <span style={{ fontWeight: "700" }}>التاريخ</span> /&nbsp;
                  {formatArabicDate(formData.invoiceDate)}م
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <div style={{ flex: "1" }}>
                  <span style={{ fontWeight: "700" }}>المحصـل</span> /&nbsp;
                  {formData.collector}
                </div>
                <div style={{ flex: "1", textAlign: "right" }}>
                  <span style={{ fontWeight: "700" }}>رقم الفاتورة</span>{" "}
                  /&nbsp;
                  <span
                    style={{
                      fontWeight: "900",
                      fontSize: "16px",
                      color: "#c00",
                    }}
                  >
                    {invoice?.invoiceNumber || "—"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <div style={{ flex: "1" }}>
                  <span style={{ fontWeight: "700" }}>ملاحظـات</span> /&nbsp;
                  {formData.notes}
                </div>
                <div style={{ flex: "1", textAlign: "right" }}>
                  <span style={{ fontWeight: "700" }}>القطـاع</span> /&nbsp;
                  {formData.section}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: "1" }}></div>
                <div style={{ flex: "1", textAlign: "right" }}>
                  <span style={{ fontWeight: "700" }}>القسـم</span> /&nbsp;
                  {formData.department}
                </div>
              </div>
            </div>

            {/* ========== CUSTOMER LINE ========== */}
            <div
              style={{
                border: "1px solid #000",
                padding: "4px 8px",
                fontSize: "13px",
                lineHeight: "1.7",
                marginBottom: "3mm",
              }}
            >
              <div>
                <span style={{ fontWeight: "700" }}>رقم العميل</span> /{" "}
                {selectedCustomer?.customerCode || "—"}&emsp;&emsp;
                <span style={{ fontWeight: "700" }}>
                  المطلوب من الأخوة /
                </span>{" "}
                {selectedCustomer?.name || formData.notes || "عميل نقدي"}
              </div>
              <div style={{ display: "flex", gap: "30px" }}>
                <span>
                  <span style={{ fontWeight: "700" }}>علة المستند</span>
                </span>
                <span>
                  <span style={{ fontWeight: "700" }}>العنوان</span> /{" "}
                  {selectedCustomer?.address || ""}
                </span>
                <span>
                  <span style={{ fontWeight: "700" }}>العملة</span> / ريال يمني
                </span>
              </div>
            </div>

            {/* ========== ITEMS TABLE ========== */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "4mm",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "22px" }}>م</th>
                  <th style={{ ...thStyle, width: "70px" }}>رقم الصنف</th>
                  <th style={{ ...thStyle }}>اسم الصنف</th>
                  <th style={{ ...thStyle, width: "40px" }}>الوحدة</th>
                  <th style={{ ...thStyle, width: "40px" }}>الكمية</th>
                  <th style={{ ...thStyle, width: "40px" }}>البونص</th>
                  <th style={{ ...thStyle, width: "55px" }}>السعر</th>
                  <th style={{ ...thStyle, width: "65px" }}>القيمة</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}>{idx + 1}</td>
                    <td style={cellStyle}>{item.itemCode}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{item.itemName}</td>
                    <td style={cellStyle}>{item.unit}</td>
                    <td style={cellStyle}>{item.quantity}</td>
                    <td style={cellStyle}>{item.bonus ?? 0}</td>
                    <td style={cellStyle}>{item.price.toFixed(3)}</td>
                    <td style={cellStyle}>{(item.quantity * item.price).toFixed(3)}</td>
                  </tr>
                ))}
                {/* Filler rows */}
                {Array.from({ length: fillerRows }).map((_, i) => (
                  <tr key={`filler-${i}`}>
                    <td style={{ ...cellStyle, height: "22px" }}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                    <td style={cellStyle}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ========== TOTALS + SIGNATURES ========== */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              {/* Left: Signatures */}
              <div
                style={{
                  flex: "1",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  borderTop: "1px solid #000",
                  paddingTop: "20px",
                  fontSize: "12px",
                  textAlign: "center",
                  gap: "4px",
                }}
              >
                {["المستلم", "المبيعات", "الموزع", "أمين المستودع"].map((label) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: "700", marginBottom: "18px" }}>{label}</div>
                    <div
                      style={{
                        borderTop: "1px solid #888",
                        paddingTop: "2px",
                        margin: "0 4px",
                        fontSize: "10px",
                        color: "#555",
                      }}
                    >
                      التوقيع
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Totals */}
              <div
                style={{
                  width: "150px",
                  border: "1px solid #000",
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #000",
                    padding: "4px 6px",
                  }}
                >
                  <span style={{ fontWeight: "700" }}>الإجمالي قبل الخصم</span>
                  <span>{subtotal.toFixed(3)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #000",
                    padding: "4px 6px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <span style={{ fontWeight: "700" }}>قيمـة الخصـم</span>
                  <span>{(formData.discount || 0).toFixed(3)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 6px",
                    fontWeight: "900",
                    backgroundColor: "#f0f0f0",
                    fontSize: "13px",
                  }}
                >
                  <span>الإجمـالـي</span>
                  <span>{grandTotal.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
