import { useState } from "react";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  getListUsersQueryKey,
  User,
  UserInputRole,
  UserUpdateRole
} from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ALL_PAGES = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "training-certificates", label: "إفادات التدريب" },
  { key: "medical-reports", label: "التقارير الطبية" },
  { key: "invoices", label: "فواتير البيع" },
  { key: "products", label: "الأصناف" },
  { key: "doctors", label: "الأطباء" },
  { key: "users", label: "المستخدمون" },
  { key: "audit-logs", label: "سجل العمليات" },
  { key: "settings", label: "الإعدادات" },
];

export default function Users() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() }
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "employee" as UserInputRole,
    isActive: true,
    permissions: null as string[] | null, // null = all access
  });

  const openNewDialog = () => {
    setEditingUser(null);
    setFormData({ username: "", fullName: "", password: "", role: "employee", isActive: true, permissions: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    let perms: string[] | null = null;
    try {
      const raw = (user as any).permissions;
      perms = raw ? JSON.parse(raw) : null;
    } catch { perms = null; }
    setFormData({
      username: user.username,
      fullName: user.fullName,
      password: "",
      role: user.role as UserInputRole,
      isActive: user.isActive,
      permissions: perms,
    });
    setIsDialogOpen(true);
  };

  const togglePage = (key: string) => {
    const perms = formData.permissions ?? [];
    setFormData({
      ...formData,
      permissions: perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key],
    });
  };

  const isAdminRole = formData.role === "administrator" || formData.role === "manager";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const permissionsJson = isAdminRole
      ? null
      : (formData.permissions && formData.permissions.length > 0
        ? JSON.stringify(formData.permissions)
        : null);

    if (editingUser) {
      const updateData: any = {
        fullName: formData.fullName,
        role: formData.role as UserUpdateRole,
        isActive: formData.isActive,
        permissions: permissionsJson,
      };
      if (formData.password) updateData.password = formData.password;

      updateMutation.mutate({ id: editingUser.id, data: updateData }, {
        onSuccess: () => {
          toast({ title: "تم تحديث بيانات المستخدم بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setIsDialogOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: { ...formData, permissions: permissionsJson } as any }, {
        onSuccess: () => {
          toast({ title: "تم إضافة المستخدم بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setIsDialogOpen(false);
        }
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">مدير نظام</Badge>;
      case 'manager': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">مدير</Badge>;
      case 'employee': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">موظف</Badge>;
      case 'viewer': return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">مشاهد</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
            style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">المستخدمون</h1>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة الحسابات والصلاحيات</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}
              style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)" }}
              className="border-0">
              <Plus className="mr-2 h-4 w-4" /> مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "تعديل بيانات مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {!editingUser && (
                <div className="space-y-1.5">
                  <Label>اسم المستخدم (الدخول) <span className="text-destructive">*</span></Label>
                  <Input dir="ltr" className="text-right" required value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                <Input required value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>{editingUser ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور *"}</Label>
                <Input type="password" required={!editingUser} value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })} minLength={6} />
              </div>

              <div className="space-y-1.5">
                <Label>الصلاحية <span className="text-destructive">*</span></Label>
                <Select value={formData.role} onValueChange={(val: UserInputRole) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">مدير نظام — وصول كامل</SelectItem>
                    <SelectItem value="manager">مدير — وصول كامل</SelectItem>
                    <SelectItem value="employee">موظف — حسب الصلاحيات</SelectItem>
                    <SelectItem value="viewer">مشاهد — حسب الصلاحيات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions — only show for non-admin roles */}
              {!isAdminRole && (
                <div className="space-y-2 border rounded-xl p-4 bg-muted/30">
                  <Label className="text-sm font-semibold">النوافذ المسموح بالوصول إليها</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    اختر النوافذ التي يمكن لهذا المستخدم الوصول إليها
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PAGES.map((page) => (
                      <label key={page.key}
                        className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={(formData.permissions ?? []).includes(page.key)}
                          onCheckedChange={() => togglePage(page.key)}
                        />
                        {page.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isAdminRole && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border">
                  🔓 هذه الصلاحية تمنح وصولاً كاملاً لجميع النوافذ تلقائياً
                </div>
              )}

              {editingUser && (
                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label className="cursor-pointer">حالة الحساب (نشط)</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              )}

              <Button type="submit" className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الصلاحية</TableHead>
                <TableHead>النوافذ</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا يوجد مستخدمون.</TableCell>
                </TableRow>
              ) : (
                users?.map((user) => {
                  let perms: string[] | null = null;
                  try { perms = (user as any).permissions ? JSON.parse((user as any).permissions) : null; } catch { }
                  const isAdmin = user.role === "administrator" || user.role === "manager";
                  return (
                    <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
                      <TableCell className="font-bold">{user.fullName}</TableCell>
                      <TableCell dir="ltr" className="text-right font-mono text-sm">{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {isAdmin
                          ? <span className="text-xs text-green-600 font-medium">كامل</span>
                          : perms
                            ? <span className="text-xs">{perms.length} نافذة</span>
                            : <span className="text-xs text-green-600 font-medium">كامل</span>
                        }
                      </TableCell>
                      <TableCell className="text-sm">{user.lastLogin ? formatDateTime(user.lastLogin) : "-"}</TableCell>
                      <TableCell>
                        {user.isActive
                          ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">نشط</Badge>
                          : <Badge variant="secondary">موقوف</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
