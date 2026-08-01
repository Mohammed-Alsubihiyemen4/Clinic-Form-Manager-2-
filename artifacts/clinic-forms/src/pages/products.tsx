import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Package, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

export interface Product {
  id: number;
  name: string;
  unit: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}api/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", unit: "عام", price: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setProducts(await fetchProducts());
    } catch {
      toast({ title: "خطأ", description: "تعذّر تحميل الأصناف", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", unit: "عام", price: 0, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, unit: p.unit, price: p.price, isActive: p.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `${BASE}api/products/${editing.id}`
        : `${BASE}api/products`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "تم تحديث الصنف" : "تم إضافة الصنف بنجاح" });
      setDialogOpen(false);
      load();
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الصنف", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`حذف "${p.name}"؟`)) return;
    try {
      await fetch(`${BASE}api/products/${p.id}`, { method: "DELETE" });
      toast({ title: "تم الحذف" });
      load();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
          >
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">الأصناف</h1>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة أصناف وأسعار الفاتورة</p>
          </div>
        </div>
        <Button
          onClick={openNew}
          style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
          className="border-0"
        >
          <Plus className="ml-2 h-4 w-4" /> إضافة صنف جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الصنف</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    لا توجد أصناف. أضف أول صنف الآن.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id} className={!p.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                    <TableCell className="font-mono font-semibold text-primary">
                      {p.price.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary">موقوف</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الصنف" : "إضافة صنف جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label>
                اسم الصنف <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: خدمة استشارة طبية"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الوحدة</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="عام"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  السعر <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <Label className="cursor-pointer">الصنف نشط</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {editing ? "تحديث الصنف" : "إضافة الصنف"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
