"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Added logic to handle forgot password
  const handleForgotPassword = async () => {
    setError(null);
    if (!email) {
      setError("Şifre sıfırlama bağlantısı için lütfen E-posta adresinizi giriniz.");
      return;
    }

    if (!confirm(`${email} adresine şifre sıfırlama bağlantısı gönderilsin mi?`)) return;

    setLoading(true);
    const redirectUrl = window.location.origin + '/auth/update-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Şifre sıfırlama bağlantısı başarıyla gönderildi. Lütfen e-postanızı kontrol edin.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!user) throw new Error("Kullanıcı bulunamadı.");

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role;

      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'consultant') router.push('/consultant/dashboard');
      else router.push('/candidate/dashboard');

    } catch (err: any) {
      console.error("Login error:", err);
      setError("Giriş bilgileriniz hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative flex">

      {/* Left Side: Form - Fixed width on Desktop */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-12 bg-white relative z-10 shrink-0">

        <div className="w-full max-w-md space-y-8">

          {/* Logo */}
          <div className="mb-8">
            <img
              src="/images/login/logo.png"
              alt="Omuz Omuza Logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3">
              Aday Girişi
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="E-posta"
                  className="h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  className="h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4" />
                <label htmlFor="remember" className="text-sm font-medium text-slate-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Beni Hatırla
                </label>
              </div>

              <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Şifrenizi mi unuttunuz?
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base rounded-md transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Giriş"}
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push('/register')}
            className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-medium text-base rounded-md transition-all"
            disabled={loading}
          >
            Üye Ol
          </Button>

        </div>
      </div>

      {/* Right Side: Image - Fills remaining space */}
      <div className="hidden lg:block flex-1 relative h-screen bg-slate-100 overflow-hidden">
        <img
          src="/images/login/banner.jpg"
          alt="Login Banner"
          className="w-full h-full object-fill"
        />
      </div>

    </div>
  );
}
