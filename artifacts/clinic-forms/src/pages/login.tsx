import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ChevronDown, Check, User } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface UserOption {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Combobox state
  const [users, setUsers] = useState<UserOption[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch users for dropdown
  useEffect(() => {
    fetch(`${BASE}api/users`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UserOption[]) => setUsers(data))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(username.toLowerCase()) ||
      u.fullName.includes(username)
  );

  const selectUser = (u: UserOption) => {
    setUsername(u.username);
    setDropdownOpen(false);
    setTimeout(() => {
      const passInput = document.getElementById("password-input") as HTMLInputElement;
      passInput?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ، حاول مرة أخرى");
      } else {
        login(data);
      }
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(135deg, #0a1f2e 0%, #0d3d36 40%, #093028 70%, #0a1f2e 100%)",
      }}
    >
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-120px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1a9e8f 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-80px] left-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1a9e8f 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ border: "1px solid #1a9e8f", transform: "translate(-50%, -50%)" }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ border: "1px solid #7ecfc9" }} />
        {/* Medical cross/plus decorative element */}
        <div className="absolute top-10 left-10 opacity-5">
          <div style={{ width: 60, height: 20, background: "#1a9e8f", borderRadius: 4 }} />
          <div style={{ width: 20, height: 60, background: "#1a9e8f", borderRadius: 4, marginTop: -40, marginRight: 20 }} />
        </div>
      </div>

      {/* Left decorative panel (desktop) */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative"
        style={{ padding: "60px 40px" }}
      >
        {/* Big logo */}
        <div className="relative mb-10">
          <div
            className="absolute inset-0 rounded-3xl opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #1a9e8f, transparent)", transform: "scale(1.3)" }}
          />
          <img
            src={`${BASE}logo-assar.jpg`}
            alt="مستوصف العصار الطبي"
            className="w-80 object-contain relative z-10"
            style={{
              filter: "drop-shadow(0 8px 32px rgba(26,158,143,0.3))",
              borderRadius: "16px",
            }}
          />
        </div>

        <h1
          className="text-3xl font-bold text-white mb-2 text-center"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)", letterSpacing: "0.02em" }}
        >
          مستوصف العصار الطبي
        </h1>
        <p className="text-base text-center mb-2" style={{ color: "#7ecfc9" }}>
          AL-Assar Medical Clinic
        </p>
        <p className="text-sm text-center opacity-60 text-white/60 max-w-xs leading-relaxed">
          نظام إدارة المستوصف المتكامل — إدارة الوثائق والفواتير والتقارير بكل سهولة واحترافية
        </p>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          {[
            { label: "إفادات التدريب", color: "#60a5fa" },
            { label: "التقارير الطبية", color: "#34d399" },
            { label: "فواتير البيع", color: "#fbbf24" },
            { label: "الأصناف", color: "#a78bfa" },
          ].map((f) => (
            <div
              key={f.label}
              className="px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: `${f.color}18`,
                border: `1px solid ${f.color}40`,
                color: f.color,
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div
        className="flex items-center justify-center w-full lg:w-[460px] shrink-0 p-6 relative z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
            <img
              src={`${BASE}logo-assar.jpg`}
              alt="مستوصف العصار"
              className="h-28 object-contain"
              style={{ filter: "drop-shadow(0 4px 12px rgba(26,158,143,0.25))", borderRadius: 12 }}
            />
            <p className="text-white/50 text-xs">مستوصف العصار الطبي</p>
          </div>

          {/* Login header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-medium"
              style={{ background: "rgba(26,158,143,0.15)", border: "1px solid rgba(26,158,143,0.3)", color: "#7ecfc9" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              النظام متاح
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">تسجيل الدخول</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              أدخل بياناتك للوصول إلى النظام
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username combobox */}
            <div className="space-y-1.5">
              <Label className="text-white/75 text-sm font-medium">اسم المستخدم</Label>
              <div ref={dropdownRef} className="relative">
                {/* Input + dropdown trigger */}
                <div className="relative flex items-center">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <input
                    ref={inputRef}
                    dir="ltr"
                    type="text"
                    className="w-full h-11 text-right pr-10 pl-10 rounded-lg outline-none transition-all duration-200 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: dropdownOpen || inputFocused
                        ? "1px solid rgba(26,158,143,0.7)"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      boxShadow: dropdownOpen || inputFocused ? "0 0 0 3px rgba(26,158,143,0.12)" : "none",
                    }}
                    placeholder="اكتب أو اختر من القائمة"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setInputFocused(true);
                      setDropdownOpen(true);
                    }}
                    onBlur={() => setInputFocused(false)}
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      inputRef.current?.focus();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-transform duration-200"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      transform: `translateY(-50%) rotate(${dropdownOpen ? 180 : 0}deg)`,
                    }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(13,33,55,0.98)",
                      border: "1px solid rgba(26,158,143,0.35)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                      backdropFilter: "blur(20px)",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredUsers.length === 0 ? (
                      <div className="px-4 py-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {users.length === 0 ? "جاري تحميل المستخدمين..." : "لا توجد نتائج"}
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectUser(u); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors duration-100"
                          style={{
                            background: username === u.username ? "rgba(26,158,143,0.2)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (username !== u.username) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            if (username !== u.username) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "linear-gradient(135deg, #1a9e8f, #0d6e64)", color: "white" }}
                          >
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-sm font-semibold text-white leading-tight">{u.fullName}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", direction: "ltr", textAlign: "right" }}>
                              @{u.username}
                            </p>
                          </div>
                          {username === u.username && (
                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#1a9e8f" }} />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-white/75 text-sm font-medium">كلمة المرور</Label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPass ? "text" : "password"}
                  className="w-full h-11 pr-4 pl-10 rounded-lg outline-none transition-all duration-200 text-sm"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(26,158,143,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,158,143,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="text-sm text-center py-2.5 px-4 rounded-lg"
                style={{
                  background: "rgba(220,38,38,0.12)",
                  color: "#fca5a5",
                  border: "1px solid rgba(220,38,38,0.25)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1a9e8f 0%, #0d6e64 100%)",
                boxShadow: "0 4px 24px rgba(26,158,143,0.4)",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(26,158,143,0.55)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(26,158,143,0.4)";
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : (
                "دخول →"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              مستوصف العصار الطبي © {new Date().getFullYear()}
            </p>
            <p className="text-center text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.12)" }}>
              AL-Assar Medical Clinic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
