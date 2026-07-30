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

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}/${m}/${day}`;
}

/**
 * Underlined value field — matches Word template's tab-leader underline style.
 * The value sits on a single underline; empty values show a blank underline.
 */
function DotLine({ value, minWidth = "130px" }: { value: string; minWidth?: string }) {
  return (
    <span
      style={{
        borderBottom: "1px solid #000",
        display: "inline-block",
        minWidth,
        paddingBottom: "1px",
        fontFamily: "'Cairo', 'Arial', sans-serif",
        fontWeight: "700",
      }}
    >
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
        onSuccess: (data) => {
          toast({ title: "تم إنشاء التقرير بنجاح" });
          setLocation(`/medical-reports/${data.id}`);
        },
      });
    } else {
      updateMutation.mutate({ id, data: formData }, {
        onSuccess: () => {
          toast({ title: "تم تحديث التقرير بنجاح" });
          queryClient.invalidateQueries({ queryKey: getGetMedicalReportQueryKey(id) });
        },
      });
    }
  };

  if (isLoading && !isNew) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const selectedDoctor = doctors?.find((d) => d.id === formData.doctorId);
  const isFemale = formData.gender === "female";
  const genderLetter = isFemale ? "F" : "M";
  const letterheadUrl = `${import.meta.env.BASE_URL}letterhead.jpg`;

  /* ─────────────────────────────────────────────────────────────────
     PRINT TEMPLATE — Visual reference: original Word document
     Fixed A4 canvas: 210mm × 297mm.
     No flexbox. No grid. No responsive layout.
     paddingTop: 46mm — content starts below letterhead header separator.
     Font: Arial (document font), fallback Cairo.
     Sizes from DOCX: title=26pt, patient info=18pt, body=22pt, footer note=14pt.
     Date is LEFT-aligned (physically left side of page per original).
  ───────────────────────────────────────────────────────────────── */
  const printPage = (
    <div
      id="print-root"
      dir="rtl"
      style={{
        /* ── Exact A4 ── */
        width: "210mm",
        height: "297mm",
        boxSizing: "border-box",
        overflow: "hidden",
        /* ── Letterhead background covers the full page ── */
        backgroundImage: `url(${letterheadUrl})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        /* ── Content starts BELOW the header separator (~46mm) ── */
        paddingTop: "46mm",
        paddingRight: "18mm",
        paddingBottom: "0",
        paddingLeft: "12mm",
        /* ── Typography: Arial matches the DOCX font ── */
        fontFamily: "'Arial', 'Cairo', sans-serif",
        color: "#000",
        backgroundColor: "#fff",
        /* ── Screen-only shadow ── */
        boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
        /* ── Preview scale is applied via transform on this element ── */
        transform: "scale(0.65)",
        transformOrigin: "top left",
        position: "relative",
      }}
    >

      {/* ══════════════════════════════════════════
          ROW: DATE (LEFT) + TITLE (CENTER)
          Original: date appears on physical LEFT side of page,
          title centered. Both at approximately same vertical level
          (date y=46-54mm, title y=51-62mm in source PDF).
      ══════════════════════════════════════════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4mm" }}>
        <tbody>
          <tr>
            {/* RIGHT cell (RTL first) — empty */}
            <td style={{ width: "35%" }} />
            {/* CENTER cell — Title */}
            <td style={{ width: "30%", textAlign: "center", verticalAlign: "middle" }}>
              <span style={{
                fontSize: "26pt",
                fontWeight: "700",
                textDecoration: "underline",
                textDecorationThickness: "2px",
                textUnderlineOffset: "4px",
                letterSpacing: "2px",
                color: "#000",
                fontFamily: "'Arial', 'Cairo', sans-serif",
              }}>
                إفادة طبية
              </span>
            </td>
            {/* LEFT cell (RTL last) — Date */}
            <td style={{ width: "35%", textAlign: "left", verticalAlign: "middle" }}>
              <span style={{
                fontSize: "14pt",
                fontWeight: "700",
                color: "#000",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                fontFamily: "'Arial', 'Cairo', sans-serif",
              }}>
                التاريخ&nbsp;&nbsp;
                <span>{fmtDate(formData.reportDate)}م</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══════════════════════════════════════════
          PATIENT INFO TABLE
          Two rows:
            Row 1: اسم المريض (right, 65%) | العمر (left, 35%)
            Row 2: التشخيص (right, 65%)   | الجنس (left, 35%)
          Font: 18pt, bold — from DOCX.
          All values underlined (tab-leader style from Word).
      ══════════════════════════════════════════ */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "6mm",
        fontSize: "18pt",
        fontWeight: "700",
        color: "#000",
        lineHeight: "2.0",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        <tbody>
          {/* Row 1: Patient name (right, wider) + Age (left) */}
          <tr>
            <td style={{ width: "65%", textAlign: "right", verticalAlign: "bottom", paddingLeft: "6mm" }}>
              <span style={{ fontWeight: "700" }}>اسم المريض :</span>&nbsp;
              <DotLine value={formData.patientName} minWidth="120px" />
            </td>
            <td style={{ width: "35%", textAlign: "right", verticalAlign: "bottom" }}>
              <span style={{ fontWeight: "700" }}>العمر :</span>&nbsp;
              <DotLine value={formData.age ? `y ${formData.age}` : ""} minWidth="55px" />
            </td>
          </tr>
          {/* Row 2: Diagnosis (right, wider) + Gender (left) */}
          <tr>
            <td style={{ width: "65%", textAlign: "right", verticalAlign: "bottom", paddingLeft: "6mm" }}>
              <span style={{ fontWeight: "700" }}>التشخيص :</span>&nbsp;
              <span style={{ direction: "ltr", display: "inline-block" }}>
                <DotLine value={formData.diagnosis} minWidth="120px" />
              </span>
            </td>
            <td style={{ width: "35%", textAlign: "right", verticalAlign: "bottom" }}>
              <span style={{ fontWeight: "700" }}>الجنس :</span>&nbsp;
              <DotLine value={genderLetter} minWidth="40px" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══════════════════════════════════════════
          REPORT BODY TEXT
          Font: Arial 22pt, bold. Line-spacing ~1.35 (276/240 auto in Word,
          measured pitch: 10.3mm / 7.75mm font = 1.33×).
          Text: justified.
      ══════════════════════════════════════════ */}
      <div style={{
        fontSize: "22pt",
        fontWeight: "700",
        lineHeight: "1.55",
        textAlign: "justify",
        marginBottom: "6mm",
        color: "#000",
        whiteSpace: "pre-wrap",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        {formData.reportText ||
          (isFemale
            ? "المذكورة أعلاه تعاني من اضطرابات نفسية وعصبية (اكتئاب)  مع نوبات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام ."
            : "المذكور أعلاه يعاني من اضطرابات نفسية وعصبية (اكتئاب)  مع نوبات تشنجات متكررة (صرع)وبحاجة إلى عمل تخطيط للدماغ وعلاجات باستمرار مع متابعة عيادة الباطنية و الأعصاب بانتظام .")}
      </div>

      {/* ══════════════════════════════════════════
          FOOTER NOTE — right-aligned, underlined
          Font: 14pt bold, underlined. From DOCX measurement.
      ══════════════════════════════════════════ */}
      <div style={{
        fontSize: "14pt",
        fontWeight: "700",
        textDecoration: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "3px",
        marginBottom: "0",
        color: "#000",
        textAlign: "right",
        fontFamily: "'Arial', 'Cairo', sans-serif",
      }}>
        هذا بناءً على طلب المريض&nbsp;&nbsp;وحسب التقرير المرفق معه&nbsp;&nbsp;ولا يعتبر تقرير جنائياً
      </div>

      {/* ══════════════════════════════════════════
          SIGNATURES — absolute-positioned at bottom
          Two columns:
            طبيب المعالج (physical RIGHT side — primary Arabic side)
            إدارة المستوصف (physical LEFT side)
          Measured from PDF: signatures at y≈220-238mm from top.
          bottom = 297 - 238 = 59mm → use bottom: "40mm" for signature base.
      ══════════════════════════════════════════ */}

      {/* RIGHT signature — طبيب المعالج */}
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

      {/* LEFT signature — إدارة المستوصف */}
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

    </div>
  );

  return (
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
        {/* ── Form Panel (screen only) ── */}
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
                    {doctors?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>{doc.name}</SelectItem>
                    ))}
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

        {/* ── Print Preview (screen only) ──
            Outer wrapper: clips overflow so only the scaled A4 area is shown.
            Inner #print-root: transform scale(0.65), reset to none on print via CSS.
        ── */}
        <div
          className="print:hidden"
          style={{
            overflow: "hidden",
            width: "calc(210mm * 0.65)",
            height: "calc(297mm * 0.65)",
            borderRadius: "4px",
          }}
        >
          {printPage}
        </div>
      </div>
    </div>
  );
}
