import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetMedicalReport,
  useCreateMedicalReport,
  useUpdateMedicalReport,
  useListDoctors,
  getGetMedicalReportQueryKey,
  MedicalReportGender,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Printer, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ClinicHeader } from "@/components/print/ClinicHeader";

export default function MedicalReportForm() {
  const [, params] = useRoute("/medical-reports/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useGetMedicalReport(id!, {
    query: {
      enabled: !isNew,
      queryKey: getGetMedicalReportQueryKey(id!),
    },
  });

  const { data: doctors } = useListDoctors();

  const createMutation = useCreateMedicalReport();
  const updateMutation = useUpdateMedicalReport();

  const [formData, setFormData] = useState({
    patientName: "",
    age: 0,
    gender: "female" as MedicalReportGender,
    diagnosis: "",
    reportText: "",
    doctorId: undefined as number | undefined,
    reportDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (report) {
      setFormData({
        patientName: report.patientName,
        age: report.age,
        gender: report.gender,
        diagnosis: report.diagnosis,
        reportText: report.reportText,
        doctorId: report.doctorId || undefined,
        reportDate: report.reportDate.split("T")[0],
      });
    }
  }, [report]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "age" ? Number(value) : value }));
  };

  const handleGenderChange = (val: string) => {
    setFormData((prev) => ({ ...prev, gender: val as MedicalReportGender }));
  };

  const handleDoctorChange = (val: string) => {
    setFormData((prev) => ({ ...prev, doctorId: val === "none" ? undefined : Number(val) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate(
        { data: formData },
        {
          onSuccess: (data) => {
            toast({ title: "تم إنشاء التقرير بنجاح" });
            setLocation(`/medical-reports/${data.id}`);
          },
        }
      );
    } else {
      updateMutation.mutate(
        { id, data: formData },
        {
          onSuccess: () => {
            toast({ title: "تم تحديث التقرير بنجاح" });
            queryClient.invalidateQueries({ queryKey: getGetMedicalReportQueryKey(id) });
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

  const selectedDoctor = doctors?.find((d) => d.id === formData.doctorId);

  // YYYY/MM/DD format
  const formatArabicDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  const genderLetter = formData.gender === "female" ? "F" : "M";
  const isFemale = formData.gender === "female";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Button variant="outline" size="icon" onClick={() => setLocation("/medical-reports")}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "إصدار تقرير طبي جديد" : `تعديل تقرير: ${report?.reportNumber}`}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Form Panel */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="patientName">
                  اسم المريض <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">
                  العمر <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  value={formData.age || ""}
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
                    <SelectItem value="male">ذكر (M)</SelectItem>
                    <SelectItem value="female">أنثى (F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="diagnosis">
                  التشخيص <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reportText">
                  نص التقرير الطبي <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reportText"
                  name="reportText"
                  value={formData.reportText}
                  onChange={handleChange}
                  required
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorId">الطبيب المعالج</Label>
                <Select
                  value={formData.doctorId?.toString() || "none"}
                  onValueChange={handleDoctorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطبيب..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {doctors?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDate">
                  تاريخ التقرير <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reportDate"
                  type="date"
                  name="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  required
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
                  طباعة التقرير
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
              padding: "14mm 16mm 14mm 16mm",
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
            }}
          >
            {/* ========== CLINIC HEADER ========== */}
            <ClinicHeader />

            {/* ========== DATE (top right, below header) ========== */}
            <div
              style={{
                textAlign: "right",
                fontSize: "14px",
                marginTop: "8mm",
                marginBottom: "2mm",
              }}
            >
              <span style={{ fontWeight: "700" }}>التاريخ</span>{" "}
              {formatArabicDate(formData.reportDate)}م
            </div>

            {/* ========== TITLE ========== */}
            <div
              style={{
                textAlign: "center",
                marginTop: "4mm",
                marginBottom: "10mm",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  textDecoration: "underline",
                  textUnderlineOffset: "6px",
                }}
              >
                إفادة طبية
              </span>
            </div>

            {/* ========== PATIENT INFO ========== */}
            <div
              style={{
                fontSize: "15px",
                lineHeight: "2.0",
                marginBottom: "8mm",
              }}
            >
              {/* Row 1: patient name + age */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "8px",
                  marginBottom: "2px",
                }}
              >
                <div style={{ flex: "2" }}>
                  <span style={{ fontWeight: "700" }}>اسم المريض :</span>{" "}
                  <span>
                    {formData.patientName || "...................................."}
                  </span>
                </div>
                <div style={{ flex: "1", textAlign: "left" }}>
                  <span style={{ fontWeight: "700" }}>العمر :</span>{" "}
                  <span>{formData.age ? `${formData.age} y` : "...."}</span>
                </div>
              </div>

              {/* Row 2: diagnosis + gender */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "8px",
                }}
              >
                <div style={{ flex: "2" }}>
                  <span style={{ fontWeight: "700" }}>التشخيص :</span>{" "}
                  <span style={{ direction: "ltr", display: "inline-block" }}>
                    {formData.diagnosis || "...................................."}
                  </span>
                </div>
                <div style={{ flex: "1", textAlign: "left" }}>
                  <span style={{ fontWeight: "700" }}>الجنس:</span>{" "}
                  <span style={{ direction: "ltr", display: "inline-block", fontWeight: "700" }}>
                    {genderLetter}
                  </span>
                </div>
              </div>
            </div>

            {/* ========== REPORT BODY ========== */}
            <div
              style={{
                fontSize: "17px",
                lineHeight: "2.2",
                textAlign: "justify",
                marginBottom: "10mm",
                whiteSpace: "pre-wrap",
              }}
            >
              {formData.reportText ||
                (isFemale
                  ? "المـذكورة أعـلاه تعـاني مـن اضـطرابات نفسـية وعصبـية (اكتئـاب)  مـع نوبـات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام ."
                  : "المـذكور أعـلاه يعـاني مـن اضـطرابات نفسـية وعصبـية (اكتئـاب)  مـع نوبـات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام .")}
            </div>

            {/* ========== FOOTER NOTE (underlined) ========== */}
            <div
              style={{
                fontSize: "13px",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                marginBottom: "14mm",
                textAlign: "right",
              }}
            >
              هذا بناً على طلب المريض وحسب التقرير المرفق معه  &nbsp;ولا يعتبر تقرير جنائياً
            </div>

            {/* ========== SIGNATURES (two columns) ========== */}
            <div
              style={{
                position: "absolute",
                bottom: "18mm",
                left: "16mm",
                right: "16mm",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                fontSize: "15px",
                lineHeight: "1.9",
              }}
            >
              {/* Left: treating doctor */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "700" }}>طبيب المعالج</div>
                <div>
                  {selectedDoctor ? `د/${selectedDoctor.name}` : "د/عبدالله عصار"}
                </div>
              </div>

              {/* Right: clinic management */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "700" }}>إدارة المستوصف</div>
                <div>د/إبراهيم عصار</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
