import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}/${m}/${day}`;
}

function DotLine({ value, minWidth = "130px" }: { value: string; minWidth?: string }) {
  return (
    <span style={{
      borderBottom: "1.5px solid #000",
      display: "inline-block",
      minWidth,
      paddingBottom: "7px",
      whiteSpace: "nowrap",
      fontFamily: "'Arial', 'Cairo', sans-serif",
      fontWeight: "700",
    }}>
      {value || "\u00A0"}
    </span>
  );
}

export default function MedicalReportForm() {
  const [, params] = useRoute("/medical-reports/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useGetMedicalReport(id!, {
    query: { enabled: !isNew, queryKey: getGetMedicalReportQueryKey(id!) },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.name === "age" ? Number(e.target.value) : e.target.value }));
  const handleGenderChange = (val: string) => setFormData((p) => ({ ...p, gender: val as MedicalReportGender }));
  const handleDoctorChange = (val: string) => setFormData((p) => ({ ...p, doctorId: val === "none" ? undefined : Number(val) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate({ data: formData }, {
        onSuccess: (data) => { toast({ title: "تم إنشاء التقرير بنجاح" }); setLocation(`/medical-reports/${data.id}`); },
      });
    } else {
      updateMutation.mutate({ id, data: formData }, {
        onSuccess: () => { toast({ title: "تم تحديث التقرير بنجاح" }); queryClient.invalidateQueries({ queryKey: getGetMedicalReportQueryKey(id) }); },
      });
    }
  };

  if (isLoading && !isNew) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const selectedDoctor = doctors?.find((d) => d.id === formData.doctorId);
  const isFemale = formData.gender === "female";
  const genderLetter = isFemale ? "F" : "M";
  const letterheadUrl = `${import.meta.env.BASE_URL}letterhead.jpg`;

  /* ─────────────────────────────────────────────────────────────────
     PAGE STYLE — shared between #print-root (portal) and screen preview clone.
     The outer wrapper carries these styles; transform is added only on the
     screen-only clone, never on #print-root.
  ───────────────────────────────────────────────────────────────── */
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
    /* Content starts below letterhead header separator (~46mm from top) */
    paddingTop: "46mm",
    paddingRight: "18mm",
    paddingBottom: "0",
    paddingLeft: "12mm",
    fontFamily: "'Arial', 'Cairo', sans-serif",
    color: "#000",
    backgroundColor: "#fff",
    position: "relative",
  };

  /* ─────────────────────────────────────────────────────────────────
     DOCUMENT INNER CONTENT
     Rendered inside BOTH:
       1. #print-root portal (no transform — prints at 100%)
       2. Screen preview clone (transform: scale(0.65))
  ───────────────────────────────────────────────────────────────── */
  const docContent = (
    <>
      {/* ── DATE (left) + TITLE (center) row ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4mm" }}>
        <tbody>
          <tr>
            <td style={{ width: "35%" }} />
            <td style={{ width: "30%", textAlign: "center", verticalAlign: "middle" }}>
              <span style={{
                fontSize: "26pt",
                fontWeight: "700",
                textDecoration: "underline",
                textDecorationThickness: "2px",
                textUnderlineOffset: "10px",
                letterSpacing: "2px",
                color: "#000",
                fontFamily: "'Arial', 'Cairo', sans-serif",
              }}>
                إفادة طبية
              </span>
            </td>
            <td style={{ width: "35%", textAlign: "left", verticalAlign: "middle" }}>
              <span style={{
                fontSize: "14pt",
                fontWeight: "700",
                color: "#000",
                borderBottom: "1.5px solid #000",
                paddingBottom: "5px",
                whiteSpace: "nowrap",
                fontFamily: "'Arial', 'Cairo', sans-serif",
              }}>
                التاريخ&nbsp;&nbsp;{fmtDate(formData.reportDate)}م
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── PATIENT INFO — two rows, no-wrap so long names stay on one line ── */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "5mm",
        fontSize: "17pt",
        fontWeight: "700",
        color: "#000",
        lineHeight: "2.4",
        fontFamily: "'Arial', 'Cairo', sans-serif",
        tableLayout: "fixed",
      }}>
        <tbody>
          <tr>
            <td style={{ width: "65%", textAlign: "right", verticalAlign: "bottom", overflow: "hidden" }}>
              <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>اسم المريض :</span>&nbsp;
              <DotLine value={formData.patientName} minWidth="100px" />
            </td>
            <td style={{ width: "35%", textAlign: "center", verticalAlign: "bottom", overflow: "hidden" }}>
              <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>العمر :</span>&nbsp;
              <DotLine value={formData.age ? `${formData.age} سنة` : ""} minWidth="55px" />
            </td>
          </tr>
          <tr>
            <td style={{ width: "65%", textAlign: "right", verticalAlign: "bottom", overflow: "hidden" }}>
              <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>التشخيص :</span>&nbsp;
              <DotLine value={formData.diagnosis} minWidth="100px" />
            </td>
            <td style={{ width: "35%", textAlign: "center", verticalAlign: "bottom", overflow: "hidden" }}>
              <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>الجنس :</span>&nbsp;
              <DotLine value={genderLetter} minWidth="40px" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── REPORT BODY TEXT — 20pt, bold, right-aligned, with breathing room ── */}
      <div
        style={{
          fontSize: "20pt",
          fontWeight: "700",
          lineHeight: "1.75",
          textAlign: "right",
          marginTop: "6mm",
          marginBottom: "8mm",
          color: "#000",
          whiteSpace: "pre-wrap",
          fontFamily: "'Arial', 'Cairo', sans-serif",
        }}
        className="text-right mt-[97px] border-t-[0px] border-r-[0px] border-b-[0px] border-l-[0px] rounded-tl-[0px] rounded-tr-[0px] rounded-br-[0px] rounded-bl-[0px] pl-[10px] pr-[10px] pt-[13px] pb-[13px]">
        {formData.reportText ||
          (isFemale
            ? "المذكورة أعلاه تعاني من اضطرابات نفسية وعصبية (اكتئاب)  مع نوبات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام ."
            : "المذكور أعلاه يعاني من اضطرابات نفسية وعصبية (اكتئاب)  مع نوبات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام .")}
      </div>

      {/* ── FOOTER NOTE — border-bottom so line doesn't touch text ── */}
      <div style={{
        fontSize: "14pt",
        fontWeight: "700",
        color: "#000",
        textAlign: "right",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        <span style={{
          borderBottom: "1.5px solid #000",
          paddingBottom: "5px",
          display: "inline",
        }}>
          هذا بناءً على طلب المريض&nbsp;&nbsp;وحسب التقرير المرفق معه&nbsp;&nbsp;ولا يعتبر تقرير جنائياً
        </span>
      </div>

      {/* ── RIGHT SIGNATURE: طبيب المعالج ── */}
      <div style={{
        position: "absolute",
        bottom: "38mm",
        right: "18mm",
        textAlign: "right",
        fontSize: "18pt",
        fontWeight: "700",
        lineHeight: "1.8",
        color: "#000",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        <div>طبيب المعالج</div>
        <div>{selectedDoctor ? `د/${selectedDoctor.name}` : "د/عبدالله عصار"}</div>
      </div>

      {/* ── LEFT SIGNATURE: إدارة المستوصف ── */}
      <div style={{
        position: "absolute",
        bottom: "38mm",
        left: "12mm",
        textAlign: "right",
        fontSize: "18pt",
        fontWeight: "700",
        lineHeight: "1.8",
        color: "#000",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        <div>إدارة المستوصف</div>
        <div>د/إبراهيم عصار</div>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────
     PORTAL — #print-root rendered as direct child of #root.
     No transform here. Print CSS: #root > * { display:none },
     #root > #print-root { display:block; position:fixed; ... }
     This guarantees exactly ONE A4 page, no extra pages.
  ───────────────────────────────────────────────────────────────── */
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
          <Button variant="outline" size="icon" onClick={() => setLocation("/medical-reports")}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "إصدار تقرير طبي جديد" : `تعديل تقرير: ${report?.reportNumber}`}
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Form panel */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="patientName">اسم المريض <span className="text-destructive">*</span></Label>
                  <Input id="patientName" name="patientName" value={formData.patientName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">العمر <span className="text-destructive">*</span></Label>
                  <Input id="age" name="age" type="number" min="0" value={formData.age || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>الجنس <span className="text-destructive">*</span></Label>
                  <Select value={formData.gender} onValueChange={handleGenderChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">أنثى (F)</SelectItem>
                      <SelectItem value="male">ذكر (M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="diagnosis">التشخيص <span className="text-destructive">*</span></Label>
                  <Input id="diagnosis" name="diagnosis" value={formData.diagnosis} onChange={handleChange} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reportText">نص التقرير الطبي <span className="text-destructive">*</span></Label>
                  <Textarea id="reportText" name="reportText" value={formData.reportText} onChange={handleChange} required className="min-h-[150px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorId">الطبيب المعالج</Label>
                  <Select value={formData.doctorId?.toString() || "none"} onValueChange={handleDoctorChange}>
                    <SelectTrigger><SelectValue placeholder="اختر الطبيب..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {doctors?.map((doc) => <SelectItem key={doc.id} value={doc.id.toString()}>{doc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportDate">تاريخ التقرير <span className="text-destructive">*</span></Label>
                  <Input id="reportDate" type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "حفظ وإصدار" : "حفظ التعديلات"}
                </Button>
                {!isNew && (
                  <Button type="button" variant="outline" onClick={() => window.print()} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />طباعة التقرير
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* ── Screen-only scaled preview ──
              Outer wrapper: clips the scaled page, gives it its visual footprint.
              Inner clone: identical styling to #print-root + transform: scale(0.65).
              NOT #print-root — the portal handles the real print element.
          ── */}
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
