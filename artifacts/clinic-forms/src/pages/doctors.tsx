import { useState } from "react";
import { 
  useListDoctors, 
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  getListDoctorsQueryKey,
  Doctor
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Doctors() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const { data: doctors, isLoading } = useListDoctors(
    { search: search || undefined },
    { query: { queryKey: getListDoctorsQueryKey({ search: search || undefined }) } }
  );

  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();
  const deleteMutation = useDeleteDoctor();

  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    isActive: true
  });

  const openNewDialog = () => {
    setEditingDoctor(null);
    setFormData({ name: "", specialty: "", isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty || "",
      isActive: doctor.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, data: formData }, {
        onSuccess: () => {
          toast({ title: "تم تحديث بيانات الطبيب بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          setIsDialogOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: { name: formData.name, specialty: formData.specialty } }, {
        onSuccess: () => {
          toast({ title: "تم إضافة الطبيب بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
          setIsDialogOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطبيب؟")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "تم حذف الطبيب بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">الأطباء</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات الأطباء في المستوصف.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة طبيب
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDoctor ? "تعديل بيانات طبيب" : "إضافة طبيب جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اسم الطبيب <span className="text-destructive">*</span></Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="د. ..." />
              </div>
              <div className="space-y-2">
                <Label>التخصص</Label>
                <Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
              </div>
              {editingDoctor && (
                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <Label className="cursor-pointer">حالة الطبيب (نشط)</Label>
                  <Switch 
                    checked={formData.isActive} 
                    onCheckedChange={checked => setFormData({...formData, isActive: checked})} 
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingDoctor ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث باسم الطبيب أو تخصصه..." 
              className="pl-3 pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">جاري التحميل...</TableCell>
                </TableRow>
              ) : doctors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">لا يوجد أطباء.</TableCell>
                </TableRow>
              ) : (
                doctors?.map((doctor) => (
                  <TableRow key={doctor.id} className={!doctor.isActive ? "opacity-60" : ""}>
                    <TableCell className="font-bold">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialty || "-"}</TableCell>
                    <TableCell>
                      {doctor.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">موقوف</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(doctor)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doctor.id)}>
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
    </div>
  );
}
