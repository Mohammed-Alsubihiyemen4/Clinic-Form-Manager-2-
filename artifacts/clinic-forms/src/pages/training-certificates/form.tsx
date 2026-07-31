import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRoute, useLocation } from "wouter";
import {
  useGetTrainingCertificate,
  useCreateTrainingCertificate,
  useUpdateTrainingCertificate,
  getGetTrainingCertificateQueryKey,
  TrainingCertificateGender,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Printer, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}/${m}/${day}`;
}

export default function TrainingCertificateForm() {
  const [, params] = useRoute("/training-certificates/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? null : Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cert, isLoading } = useGetTrainingCertificate(id!, {
    query: { enabled: !isNew, queryKey: getGetTrainingCertificateQueryKey(id!) },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleGenderChange = (val: string) =>
    setFormData((p) => ({ ...p, gender: val as TrainingCertificateGender }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate({ data: formData }, {
        onSuccess: (data) => { toast({ title: "تم إنشاء الإفادة بنجاح" }); setLocation(`/training-certificates/${data.id}`); },
      });
    } else {
      updateMutation.mutate({ id, data: formData }, {
        onSuccess: () => { toast({ title: "تم تحديث الإفادة بنجاح" }); queryClient.invalidateQueries({ queryKey: getGetTrainingCertificateQueryKey(id) }); },
      });
    }
  };

  if (isLoading && !isNew) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const isFemale = formData.gender === "female";
  const letterheadUrl = `${import.meta.env.BASE_URL}letterhead.jpg`;

  /*
   * Font substitution:
   *   Original DOCX: DecoType Naskh Variants / Andalus → web sub: Amiri (Google Fonts)
   *   Body text: Arial → Cairo (web safe Arabic)
   */
  const NASKH = "'Amiri', 'Cairo', serif";
  const BODY  = "'Arial', 'Cairo', sans-serif";

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
    paddingTop: "46mm",
    paddingRight: "18mm",
    paddingBottom: "0",
    paddingLeft: "18mm",
    fontFamily: BODY,
    color: "#000",
    backgroundColor: "#fff",
    position: "relative",
  };

  /* ─────────────────────────────────────────────────────────────────
     DOCUMENT INNER CONTENT — shared between portal and screen preview.
     Font sizes from DOCX:
       Title "إفادة تدريب"         : 36pt, DecoType Naskh (→ Amiri), underlined
       "يشهد مستوصف العصار الطبي" : 36pt, Andalus (→ Amiri)
       Trainee name line           : 20pt, Arial, name underlined
       Body paragraphs             : 18pt, Arial, bold
       Closing sentence            : 24pt, DecoType Naskh (→ Amiri)
       Signature                   : 18pt, Arial
  ───────────────────────────────────────────────────────────────── */
  const docContent = (
    <>
      {/* ── TITLE ── */}
      <div style={{ textAlign: "center", marginBottom: "6mm" }}>
        <span style={{
          fontSize: "36pt",
          fontWeight: "700",
          fontFamily: NASKH,
          textDecoration: "underline",
          textDecorationThickness: "2px",
          textUnderlineOffset: "10px",
          letterSpacing: "6px",
          color: "#000",
        }}>
          إفـادة تـدريب
        </span>
      </div>

      {/* ── ATTESTATION HEADING ── */}
      <div style={{ textAlign: "center", marginBottom: "8mm" }}>
        <span style={{ fontSize: "36pt", fontWeight: "700", fontFamily: NASKH, color: "#000" }}>
          يشهد مستوصف العصار الطبي
        </span>
      </div>

      {/* ── TRAINEE NAME LINE — name underlined ── */}
      <div style={{
        textAlign: "center",
        fontSize: "20pt",
        fontWeight: "700",
        marginBottom: "8mm",
        color: "#000",
        fontFamily: BODY,
      }}>
        {isFemale ? "أن الطالبة" : "أن الطالب"}&nbsp;/&nbsp;
        <span style={{
          fontWeight: "700",
          display: "inline-block",
          minWidth: "160px",
          borderBottom: "1.5px solid #000",
          paddingBottom: "7px",
          whiteSpace: "nowrap",
        }}>
          {formData.traineeName || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
        </span>
      </div>

      {/* ── TRAINING PERIOD ── */}
      <div style={{ fontSize: "18pt", fontWeight: "700", lineHeight: "1.7", textAlign: "right", marginBottom: "0", color: "#000", fontFamily: BODY }}>
        قد {isFemale ? "تدربت" : "تدرب"} لدينا بالمستوصف خلال الفترة من تاريخ&nbsp;
        <span style={{ fontWeight: "700" }}>{fmtDate(formData.startDate)}م</span>
        &nbsp;إلى تاريخ&nbsp;
        <span style={{ fontWeight: "700" }}>{fmtDate(formData.endDate)}م</span>
      </div>

      {/* ── PRAISE PARAGRAPH ── */}
      <div style={{ fontSize: "18pt", fontWeight: "700", lineHeight: "1.7", textAlign: "right", marginBottom: "10mm", color: "#000", fontFamily: BODY }}>
        {isFemale
          ? "والمذكورة مثالاً لحسن السلوك والالتزام والعمل الجماعي والاحترام المتبادل بين زملائها وحريصة على اكتساب المهارات الطبية  ولاستفادة منها."
          : "والمذكور مثالاً لحسن السلوك والالتزام والعمل الجماعي والاحترام المتبادل بين زملائه وحريصاً على اكتساب المهارات الطبية  ولاستفادة منها."}
      </div>

      {/* ── CLOSING SENTENCE — Amiri 24pt ── */}
      <div style={{ textAlign: "center", fontSize: "24pt", fontWeight: "700", fontFamily: NASKH, marginBottom: "14mm", color: "#000" }}>
        متمنين {isFemale ? "لها" : "له"} التوفيق في حياته{isFemale ? "ا" : ""} العلمية والعملية
      </div>

      {/* ── SIGNATURE ── */}
      <div style={{
        position: "absolute",
        bottom: "38mm",
        left: "18mm",
        textAlign: "right",
        fontSize: "18pt",
        fontWeight: "700",
        lineHeight: "1.8",
        color: "#000",
        fontFamily: BODY,
      }}>
        <div>إدارة المستوصف</div>
        <div>د/ إبراهيم عصار</div>
      </div>
    </>
  );

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
          <Button variant="outline" size="icon" onClick={() => setLocation("/training-certificates")}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNew ? "إصدار إفادة تدريب جديدة" : `تعديل إفادة: ${cert?.certificateNumber}`}
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Form panel */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 print:hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="traineeName">اسم المتدرب/ـة <span className="text-destructive">*</span></Label>
                  <Input id="traineeName" name="traineeName" value={formData.traineeName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>الجنس <span className="text-destructive">*</span></Label>
                  <Select value={formData.gender} onValueChange={handleGenderChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">أنثى</SelectItem>
                      <SelectItem value="male">ذكر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">القسم <span className="text-destructive">*</span></Label>
                  <Input id="department" name="department" value={formData.department} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">من تاريخ <span className="text-destructive">*</span></Label>
                  <Input id="startDate" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">إلى تاريخ <span className="text-destructive">*</span></Label>
                  <Input id="endDate" type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="trainingOrg">جهة المتدرب (اختياري)</Label>
                  <Input id="trainingOrg" name="trainingOrg" value={formData.trainingOrg} onChange={handleChange} placeholder="مثال: جامعة صنعاء" />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "حفظ وإصدار" : "حفظ التعديلات"}
                </Button>
                {!isNew && (
                  <Button type="button" variant="outline" onClick={() => window.print()} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />طباعة الإفادة
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Screen-only scaled preview — RTL: anchor to top-right so Arabic content is fully visible */}
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
