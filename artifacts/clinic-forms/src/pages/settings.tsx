import { useState, useEffect } from "react";
import { 
  useGetSettings, 
  useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useGetSettings({ 
    query: { queryKey: getGetSettingsQueryKey() } 
  });

  const updateMutation = useUpdateSettings();

  const [formData, setFormData] = useState({
    clinicName: "",
    clinicNameEn: "",
    address: "",
    phone: "",
    email: "",
    managerName: "",
    currency: "SAR",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || "",
        clinicNameEn: settings.clinicNameEn || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        managerName: settings.managerName || "",
        currency: settings.currency || "SAR",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "تم حفظ الإعدادات بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">إعدادات النظام</h1>
        <p className="text-muted-foreground mt-1">تكوين البيانات الأساسية للمستوصف والتي تظهر على المطبوعات.</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم المستوصف (عربي)</Label>
              <Input 
                value={formData.clinicName} 
                onChange={e => setFormData({...formData, clinicName: e.target.value})} 
                placeholder="مستوصف العصار الطبي"
              />
            </div>
            
            <div className="space-y-2">
              <Label>اسم المستوصف (إنجليزي)</Label>
              <Input 
                dir="ltr"
                className="text-right"
                value={formData.clinicNameEn} 
                onChange={e => setFormData({...formData, clinicNameEn: e.target.value})} 
                placeholder="AL-ASSAR Medical Center"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>العنوان</Label>
              <Input 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input 
                dir="ltr"
                className="text-right"
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input 
                type="email"
                dir="ltr"
                className="text-right"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>اسم المدير</Label>
              <Input 
                value={formData.managerName} 
                onChange={e => setFormData({...formData, managerName: e.target.value})} 
                placeholder="د. ابراهيم عصار"
              />
            </div>

            <div className="space-y-2">
              <Label>العملة الافتراضية</Label>
              <Input 
                dir="ltr"
                className="text-right"
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value})} 
                placeholder="SAR"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-border mt-6">
            <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto min-w-[200px]">
              <Save className="mr-2 h-4 w-4" />
              حفظ الإعدادات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
