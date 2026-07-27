import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetTrainingCertificate,
  useCreateTrainingCertificate,
  useUpdateTrainingCertificate,
  getGetTrainingCertificateQueryKey,
  TrainingCertificate,
  TrainingCertificateGender,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Printer, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ClinicHeader } from "@/components/print/ClinicHeader";

export default function TrainingCertificateForm() {
  const [, params] = useRoute("/training-certificates/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cert, isLoading } = useGetTrainingCertificate(id!, {
    query: {
      enabled: !isNew,
      queryKey: getGetTrainingCertificateQueryKey(id!),
    },
  });

  const createMutation = useCreateTrainingCertificate();
  const updateMutation = useUpdateTrainingCertificate();

  const [formData, setFormData] = useState({
    traineeName: "",
    gender: "female" as TrainingCertificateGender,
    department: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    trainingOrg: "",
  });

  useEffect(() => {
    if (cert) {
      setFormData({
        traineeName: cert.traineeName,
        gender: cert.gender,
        department: cert.department,
        startDate: cert.startDate,
        endDate: cert.endDate,
        trainingOrg: cert.trainingOrg || "",
      });
    }
  }, [cert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (val: string) => {
    setFormData((prev) => ({ ...prev, gender: val as TrainingCertificateGender }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate(
        { data: formData },
        {
          onSuccess: (data) => {
            toast({ title: "تم إنشاء الإفادة بنجاح" });
            setLocation(`/training-certificates/${data.id}`);
          },
        }
      );
    } else {
      updateMutation.mutate(
        { id, data: formData },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث الإفادة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getGetTrainingCertificateQueryKey(id) });
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

  const isFemale = formData.gender === "female";

  // Gregorian date formatting → arabic style YYYY/MM/DD
  const formatArabicDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header — hidden on print */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Button variant="outline" size="icon" onClick={() => setLocation("/training-certificates")}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "إصدار إفادة تدريب جديدة" : `تعديل إفادة: ${cert?.certificateNumber}`}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="traineeName">
                  اسم المتدرب/ـة <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="traineeName"
                  name="traineeName"
                  value={formData.traineeName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  الجنس <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  القسم <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">
                  من تاريخ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  إلى تاريخ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="trainingOrg">جهة المتدرب (اختياري)</Label>
                <Input
                  id="trainingOrg"
                  name="trainingOrg"
                  value={formData.trainingOrg}
                  onChange={handleChange}
                  placeholder="مثال: جامعة صنعاء"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {isNew ? "حفظ وإصدار" : "حفظ التعديلات"}
              </Button>
              {!isNew && (
                <Button type="button" variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  طباعة الإفادة
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Print Preview Panel */}
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
              padding: "14mm 16mm 14mm 16mm",
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
            }}
          >
            {/* ========== CLINIC HEADER ========== */}
            <ClinicHeader />

            {/* ========== TITLE ========== */}
            <div
              style={{
                textAlign: "center",
                marginTop: "18mm",
                marginBottom: "10mm",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: "900",
                  textDecoration: "underline",
                  textUnderlineOffset: "6px",
                  letterSpacing: "4px",
                }}
              >
                إفـادة تـدريـب
              </span>
            </div>

            {/* ========== ATTESTATION HEADING ========== */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "6mm",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "900",
                  fontFamily: "'Cairo', 'Arial', sans-serif",
                }}
              >
                يشهد مستوصف العصار الطبي
              </span>
            </div>

            {/* ========== TRAINEE LINE ========== */}
            <div
              style={{
                textAlign: "center",
                fontSize: "16px",
                marginBottom: "8mm",
              }}
            >
              {isFemale ? "أن الطالبة" : "أن الطالب"} &nbsp;/&nbsp;
              <span style={{ fontWeight: "700" }}>
                {formData.traineeName || "................................"}
              </span>
            </div>

            {/* ========== TRAINING PERIOD ========== */}
            <div
              style={{
                fontSize: "16px",
                lineHeight: "2.1",
                textAlign: "justify",
                marginBottom: "6mm",
              }}
            >
              <span>
                قـد تـدربـت لـديـنا بالمستوصـف خـلال الفترة من تـاريـخ
              </span>{" "}
              <span style={{ fontWeight: "700" }}>
                {formatArabicDate(formData.startDate)}م
              </span>{" "}
              <span>إلى تاريخ</span>{" "}
              <span style={{ fontWeight: "700" }}>
                {formatArabicDate(formData.endDate)}م
              </span>
            </div>

            {/* ========== PRAISE PARAGRAPH ========== */}
            <div
              style={{
                fontSize: "16px",
                lineHeight: "2.1",
                textAlign: "justify",
                marginBottom: "12mm",
              }}
            >
              {isFemale
                ? "والمـذكورة مثـالاً لحسـن السـلوك والالتـزام والعمـل الجمـاعي والاحترام المتبادل بيـن زملائهـا وحريصـة على اكتسـاب المهارات الطبية  ولاستفادة منها ."
                : "والمـذكور مثـالاً لحسـن السـلوك والالتـزام والعمـل الجمـاعي والاحترام المتبادل بيـن زملائـه وحريصـاً على اكتسـاب المهارات الطبية  ولاستفادة منها ."}
            </div>

            {/* ========== CLOSING ========== */}
            <div
              style={{
                textAlign: "center",
                fontSize: "22px",
                fontWeight: "900",
                marginBottom: "16mm",
              }}
            >
              متمنين {isFemale ? "لها" : "له"} التوفيق في حياته{isFemale ? "ا" : ""} العلمية والعملية
            </div>

            {/* ========== SIGNATURES ========== */}
            <div
              style={{
                position: "absolute",
                bottom: "18mm",
                right: "16mm",
                fontSize: "15px",
                lineHeight: "1.9",
              }}
            >
              <div style={{ fontWeight: "600" }}>إدارة المستوصف</div>
              <div>د/ إبراهيم عصار</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
