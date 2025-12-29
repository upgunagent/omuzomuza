"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Mail, ChevronRight } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const role = "candidate";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign Up
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                if (!data.session) {
                    alert("Kayıt başarılı! Lütfen e-postanıza gelen doğrulama bağlantısına tıklayın.");
                    return;
                }

                // 2. Create/Update Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: data.user.email,
                        role: role,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (profileError) throw new Error(`Profil kaydı başarısız: ${profileError.message}`);

                // 3. Create Candidate record
                const { error: candidateError } = await supabase
                    .from('candidates')
                    .upsert({ id: data.user.id, email: data.user.email }, { onConflict: 'id' });

                if (candidateError) console.error("Candidate record error", candidateError);

                alert("Kayıt işleminiz başarıyla tamamlandı.");
                router.push('/');
            }

        } catch (err: any) {
            console.error("Register error:", err);
            setError(err.message || "Kayıt olurken bir hata oluştu.");
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
                            Aday Kaydı
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 pl-4">
                            Kariyer yolculuğunuza hemen başlayın
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-3 border border-red-100">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">E-posta Adresi</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ad.soyad@ornek.com"
                                    className="h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Şifre Belirleyin</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 leading-relaxed">
                            Kayıt olarak <a href="#" className="underline text-blue-600 hover:text-blue-800">Kullanıcı Sözleşmesi</a>'ni ve <a href="#" className="underline text-blue-600 hover:text-blue-800">Gizlilik Politikası</a>'nı kabul etmiş sayılırsınız.
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base rounded-md transition-all"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Hesap Oluştur"}
                            </Button>
                        </div>

                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-slate-600">
                            Zaten hesabınız var mı?{' '}
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                            >
                                Giriş Yap
                            </button>
                        </p>
                    </div>

                </div>
            </div>

            {/* Right Side: Image - Fills remaining space */}
            <div className="hidden lg:block flex-1 relative h-screen bg-slate-100 overflow-hidden">
                <img
                    src="/images/login/banner.jpg"
                    alt="Register Banner"
                    className="w-full h-full object-fill"
                />
            </div>

        </div>
    );
}
