/**
 * Shared clinic header component — matches the AL-ASSAR Medical Center letterhead exactly.
 * Used by all three print templates.
 */
export function ClinicHeader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        borderBottom: "2px solid #000",
        paddingBottom: "6px",
        marginBottom: "0",
        direction: "rtl",
        fontFamily: "'Cairo', 'Arial', sans-serif",
      }}
    >
      {/* RIGHT COLUMN — Arabic */}
      <div
        style={{
          flex: "1",
          textAlign: "right",
          direction: "rtl",
          fontSize: "11px",
          lineHeight: "1.5",
          paddingRight: "4px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "900", marginBottom: "2px" }}>
          مستوصف العصار الطبي
        </div>
        <div>طب عام - باطنية نساء وولادة - أطفال</div>
        <div>أسنان طوارئ وجراحة عامة - تجميل - عيون</div>
        <div>جلدية كشافة تلفزيونية مختبرات لكافة</div>
        <div>التحاليل الطبية</div>
      </div>

      {/* CENTER COLUMN — Logo */}
      <div
        style={{
          width: "130px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6px",
        }}
      >
        {/* SVG Logo matching the original teal heart design */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 130 80"
          style={{ width: "130px", height: "80px" }}
        >
          {/* Heart shape */}
          <path
            d="M65 68 C65 68 20 42 20 25 C20 14 28 8 38 8 C48 8 55 14 65 22 C75 14 82 8 92 8 C102 8 110 14 110 25 C110 42 65 68 65 68Z"
            fill="none"
            stroke="#1a9e8f"
            strokeWidth="2.5"
          />
          {/* ECG line inside heart */}
          <polyline
            points="30,30 38,30 42,22 46,38 50,20 54,36 58,30 70,30 74,24 78,36 82,30 90,30 96,30"
            fill="none"
            stroke="#1a9e8f"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#heartClip)"
          />
          <defs>
            <clipPath id="heartClip">
              <path d="M65 68 C65 68 18 42 18 25 C18 12 27 6 38 6 C49 6 57 13 65 21 C73 13 81 6 92 6 C103 6 112 12 112 25 C112 42 65 68 65 68Z" />
            </clipPath>
          </defs>
          {/* Clinic name in Arabic under heart */}
          <text
            x="65"
            y="76"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            fill="#1a9e8f"
            fontFamily="'Cairo', Arial, sans-serif"
          >
            مستوصف العصار الطبي
          </text>
        </svg>
        {/* English clinic name under logo */}
        <div
          style={{
            fontSize: "8px",
            fontWeight: "700",
            color: "#1a9e8f",
            textAlign: "center",
            marginTop: "-4px",
            letterSpacing: "0.3px",
            direction: "ltr",
            fontFamily: "Arial, sans-serif",
          }}
        >
          AL-Assar Medical Clinic
        </div>
      </div>

      {/* LEFT COLUMN — English */}
      <div
        style={{
          flex: "1",
          textAlign: "left",
          direction: "ltr",
          fontSize: "11px",
          lineHeight: "1.5",
          paddingLeft: "4px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "900", marginBottom: "2px" }}>
          AL-ASSAR MEDICL CENTER
        </div>
        <div>Internal Medicil - Gyn &amp; Obs-Dentistry</div>
        <div>General Emergency-First Aid-Uitrasound</div>
        <div style={{ fontFamily: "'Cairo', Arial, sans-serif", direction: "rtl", textAlign: "right", fontSize: "10px" }}>
          حجة - عبس - الشارع العام أمام مرور عبس
        </div>
        <div>&#1578;: 07241177–779900707–774050398</div>
      </div>
    </div>
  );
}
