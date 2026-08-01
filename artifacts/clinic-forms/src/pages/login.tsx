import { useState } from "react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Stethoscope } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        background: "linear-gradient(135deg, #0d2137 0%, #0a4a42 50%, #0d2137 100%)",
      }}
    >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ padding: "60px" }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1a9e8f, transparent)" }} />
        <div className="absolute bottom-[-60px] right-[-40px] w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1a9e8f, transparent)" }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ border: "2px solid #1a9e8f" }} />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ border: "2px solid #1a9e8f" }} />

        {/* Logo */}
        <img
          src={`${BASE}letterhead.jpg`}
          alt="مستوصف العصار"
          className="w-72 object-contain mb-8 drop-shadow-2xl rounded-xl opacity-90"
        />

        <h1 className="text-4xl font-bold text-white mb-3 tracking-wide text-center"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
          مستوصف العصار الطبي
        </h1>
        <p className="text-lg text-center" style={{ color: "#7ecfc9", maxWidth: "360px", lineHeight: "1.7" }}>
          نظام إدارة المستوصف المتكامل
          <br />
          <span className="text-sm opacity-70">AL-Assar Medical Center</span>
        </p>

        <div className="mt-10 flex gap-8">
          {[
            { n: "إفادات التدريب", icon: "🎓" },
            { n: "التقارير الطبية", icon: "🩺" },
            { n: "الفواتير", icon: "🧾" },
          ].map((item) => (
            <div key={item.n} className="flex flex-col items-center gap-2 opacity-70">
              <div className="text-2xl">{item.icon}</div>
              <span className="text-xs text-white/60">{item.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div
        className="flex items-center justify-center w-full lg:w-[420px] shrink-0 p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={`${BASE}letterhead.jpg`} alt="مستوصف العصار" className="h-24 object-contain rounded-lg" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1a9e8f, #0d6e64)" }}>
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">تسجيل الدخول</h2>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              أدخل بيانات حسابك للوصول إلى النظام
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">اسم المستخدم</Label>
              <Input
                dir="ltr"
                className="text-right h-11"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                }}
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  className="h-11 pl-10"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm text-center py-2.5 px-4 rounded-lg"
                style={{ background: "rgba(220,38,38,0.15)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.25)" }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold"
              style={{
                background: "linear-gradient(135deg, #1a9e8f, #0d6e64)",
                border: "none",
                boxShadow: "0 4px 20px rgba(26,158,143,0.4)",
              }}
            >
              {loading ? "جاري الدخول..." : "دخول →"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            مستوصف العصار الطبي © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
