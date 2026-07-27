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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
    isActive: true
  });

  const openNewDialog = () => {
    setEditingUser(null);
    setFormData({ username: "", fullName: "", password: "", role: "employee", isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      password: "", // password omitted for edit unless changed
      role: user.role as UserInputRole,
      isActive: user.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: any = {
        fullName: formData.fullName,
        role: formData.role as UserUpdateRole,
        isActive: formData.isActive
      };
      if (formData.password) {
        updateData.password = formData.password;
      }

      updateMutation.mutate({ id: editingUser.id, data: updateData }, {
        onSuccess: () => {
          toast({ title: "تم تحديث بيانات المستخدم بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setIsDialogOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: formData }, {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">المستخدمون</h1>
          <p className="text-muted-foreground mt-1">إدارة حسابات المستخدمين وصلاحياتهم.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "تعديل بيانات مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {!editingUser && (
                <div className="space-y-2">
                  <Label>اسم المستخدم (الدخول) <span className="text-destructive">*</span></Label>
                  <Input dir="ltr" className="text-right" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                <Input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>{editingUser ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور *"}</Label>
                <Input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} />
              </div>

              <div className="space-y-2">
                <Label>الصلاحية <span className="text-destructive">*</span></Label>
                <Select value={formData.role} onValueChange={(val: UserInputRole) => setFormData({...formData, role: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">مدير نظام (Administrator)</SelectItem>
                    <SelectItem value="manager">مدير (Manager)</SelectItem>
                    <SelectItem value="employee">موظف (Employee)</SelectItem>
                    <SelectItem value="viewer">مشاهد (Viewer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingUser && (
                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label className="cursor-pointer">حالة الحساب (نشط)</Label>
                  <Switch 
                    checked={formData.isActive} 
                    onCheckedChange={checked => setFormData({...formData, isActive: checked})} 
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
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
                <TableHead>آخر دخول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا يوجد مستخدمون.</TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
                    <TableCell className="font-bold">{user.fullName}</TableCell>
                    <TableCell dir="ltr" className="text-right font-mono text-sm">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.lastLogin ? formatDateTime(user.lastLogin) : "-"}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">موقوف</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4 text-primary" />
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
    </div>
  );
}
