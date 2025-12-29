"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, AlertCircle, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function InviteMemberForm() {
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        candidate_name: "",
        candidate_email: "",
        extra_note: ""
    });

    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Pre-fill from URL params
    useEffect(() => {
        const nameParam = searchParams.get("name");
        const emailParam = searchParams.get("email");

        setFormData(prev => ({
            ...prev,
            candidate_name: nameParam || prev.candidate_name,
            candidate_email: emailParam || prev.candidate_email
        }));
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Database Search Logic
    const handleSearch = async (type: 'name' | 'email') => {
        const value = type === 'name' ? formData.candidate_name : formData.candidate_email;
        if (!value || value.length < 3) {
            alert("Arama yapmak için en az 3 karakter girmelisiniz.");
            return;
        }

        setSearchLoading(true);
        try {
            let query = supabase
                .from('omuzomuza_engelli')
                .select('tam_isim, email')
                .limit(1);

            if (type === 'name') {
                query = query.ilike('tam_isim', `%${value}%`);
            } else {
                query = query.eq('email', value);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                const found = data[0];
                setFormData(prev => ({
                    ...prev,
                    candidate_name: found.tam_isim || prev.candidate_name,
                    candidate_email: found.email || prev.candidate_email
                }));
                // alert("Aday bulundu ve bilgiler dolduruldu.");
            } else {
                alert("Eşleşen aday bulunamadı.");
            }
        } catch (error: any) {
            console.error("Search error:", error);
            alert("Arama sırasında bir hata oluştu: " + error.message);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Oturum süreniz dolmuş.");

            const response = await fetch("/api/send-invite-mail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu.");
            }

            setStatus("success");
            setTimeout(() => setStatus("idle"), 5000);

        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Preview
    const previewSubject = `Aramıza Katılın! - Omuz Omuza Platformu Üyelik Daveti`;
    const candidateName = formData.candidate_name || '[Aday Adı]';
    const extraNoteComponent = formData.extra_note && (
        <p className="mb-4 whitespace-pre-line text-slate-700">
            {formData.extra_note}
        </p>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Üyelik Davet Formu</h2>
                    <p className="text-sm text-slate-500">Adayın bilgilerini girin veya arayın</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input with Search */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Adayın Adı Soyadı *</Label>
                        <div className="flex gap-2">
                            <Input
                                name="candidate_name"
                                required
                                placeholder="Örn: Ahmet Yılmaz"
                                value={formData.candidate_name}
                                onChange={handleChange}
                                className="h-11 flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0"
                                onClick={() => handleSearch('name')}
                                disabled={searchLoading}
                                title="İsme göre ara"
                            >
                                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Email Input with Search */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Adayın E-posta Adresi *</Label>
                        <div className="flex gap-2">
                            <Input
                                name="candidate_email"
                                required
                                type="email"
                                placeholder="ornek@email.com"
                                value={formData.candidate_email}
                                onChange={handleChange}
                                className="h-11 flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0"
                                onClick={() => handleSearch('email')}
                                disabled={searchLoading}
                                title="Maile göre ara"
                            >
                                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Ek Not (Opsiyonel)</Label>
                        <textarea
                            name="extra_note"
                            placeholder="Adaya iletmek istediğiniz ek mesaj..."
                            value={formData.extra_note}
                            onChange={handleChange}
                            rows={4}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1498e0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-[#1498e0] hover:bg-[#0d8ad0] text-white font-bold text-base shadow-lg shadow-sky-200 mt-4"
                    >
                        {loading ? "Gönderiliyor..." : (
                            <><Mail className="w-4 h-4 mr-2" /> Üyelik Daveti Gönder</>
                        )}
                    </Button>

                    {/* Status Messages */}
                    {status === "success" && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in">
                            <CheckCircle2 className="w-5 h-5" /> Davet maili başarıyla gönderildi.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in">
                            <AlertCircle className="w-5 h-5" /> {errorMessage}
                        </div>
                    )}
                </form>
            </div>

            {/* Right Column: Preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Mail Önizleme</h2>
                    <p className="text-sm text-slate-500">Gönderilecek üyelik davetinin içeriği</p>
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                    {/* Subject */}
                    <div className="mb-6 pb-4 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">KONU</span>
                        <h3 className="text-sm font-bold text-slate-800 break-words">{previewSubject}</h3>
                    </div>

                    {/* Body */}
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">MESAJ</span>
                        <div className="text-sm text-slate-600 leading-relaxed font-sans">
                            <p className="mb-4">Merhaba {candidateName},</p>

                            <p className="mb-4">
                                Kariyer yolculuğunuzda size destek olmak ve potansiyelinizi en iyi şekilde değerlendirmeniz için
                                sizi Omuz Omuza Platformu'na üye olmaya davet ediyoruz.
                            </p>

                            <p className="mb-4">
                                Platformumuza üye olarak güncel iş ilanlarına ulaşabilir, profilinizi oluşturarak
                                firmaların size ulaşmasını sağlayabilirsiniz.
                            </p>

                            {extraNoteComponent}

                            <div className="my-6 text-center">
                                <span className="inline-block bg-[#1498e0] text-white font-bold py-3 px-6 rounded-lg shadow-md cursor-default">
                                    Üyelik Yap
                                </span>
                            </div>

                            <p className="mb-4">
                                Aramıza katılmanızdan mutluluk duyarız.
                            </p>

                            <p>
                                Saygılarımızla,<br />
                                Omuz Omuza Engelsiz İnsan Kaynakları Ekibi
                            </p>

                            {/* Logo */}
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <img src="https://www.upgunai.com/works/omuzomuza_logo.png"
                                    alt="Omuz Omuza Engelsiz İnsan Kaynakları"
                                    className="max-w-[150px] h-auto" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
