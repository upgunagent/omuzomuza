"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, AlertCircle, FileUp, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface CandidateFeedbackFormProps {
    defaultCompany?: string; // Optional default company name
}

export default function CandidateFeedbackForm({ defaultCompany = "" }: CandidateFeedbackFormProps) {
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        candidate_name: "",
        candidate_email: "",
        company_name: defaultCompany,
        position_name: "",
        result_type: "olumsi", // Will be set by effect or user (default to match previous logic logic or 'olumlu')
        extra_note: ""
    });

    const [attachment, setAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Set default result type and pre-fill from URL params
    useEffect(() => {
        const nameParam = searchParams.get("name");
        const emailParam = searchParams.get("email");

        setFormData(prev => ({
            ...prev,
            result_type: prev.result_type === "olumsi" ? "olumlu" : prev.result_type,
            candidate_name: nameParam || prev.candidate_name,
            candidate_email: emailParam || prev.candidate_email
        }));
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (value: string) => {
        setFormData(prev => ({ ...prev, result_type: value }));
        // Clear attachment if switching away from 'teklif'
        if (value !== 'teklif') {
            setAttachment(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            // Get current session for token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("Oturum süreniz dolmuş veya giriş yapmamışsınız.");
            }

            // Create FormData
            const submitData = new FormData();
            submitData.append("candidate_name", formData.candidate_name);
            submitData.append("candidate_email", formData.candidate_email);
            submitData.append("company_name", formData.company_name);
            submitData.append("position_name", formData.position_name);
            submitData.append("result_type", formData.result_type);
            submitData.append("extra_note", formData.extra_note);

            if (attachment) {
                submitData.append("file", attachment);
            }

            const response = await fetch("/api/send-candidate-mail", {
                method: "POST",
                headers: {
                    // "Content-Type": "multipart/form-data", // Valid: Let browser set boundary automatically
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: submitData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu.");
            }

            setStatus("success");
            // clear form?
            setTimeout(() => setStatus("idle"), 5000);

        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Template Helpers ---
    const isPositive = formData.result_type === "olumlu";
    const isOffer = formData.result_type === "teklif";

    // Preview Content Construction
    let previewSubject = "";
    let previewMessage = null;

    const companyName = formData.company_name || '[Şirket Adı]';
    const candidateName = formData.candidate_name || '[Aday Adı]';
    const positionName = formData.position_name || '[Pozisyon Adı]';

    const extraNoteComponent = formData.extra_note && (
        <p className="mb-4 whitespace-pre-line">
            {formData.extra_note}
        </p>
    );

    if (isOffer) {
        // --- JOB OFFER TEMPLATE ---
        previewSubject = `İş Teklifi! ${companyName} - ${positionName}`; // Or just keep generic? User didn't specify subject, using reasonable default.
        // User requested: "Merhaba [Aday Adı], ..."

        previewMessage = (
            <>
                <p className="mb-4">Merhaba {candidateName},</p>
                <p className="mb-4">
                    {companyName} şirketi ile {positionName} pozisyonu için işe alım süreciniz olumlu değerlendirme ile sonuçlanmıştır, öncelikle sizi tebrik ediyoruz!
                </p>
                <p className="mb-4">
                    Beraber çalışmaktan mutluluk duyacağımızı belirterek, teklifimize ilişkin detayları ekte tarafınıza sunarız. Cevabınızı ve kabul etmeniz halinde işe başlayabileceğiniz en erken tarihi e-maile cevaben yazılı olarak iletmenizi rica ederiz.
                </p>

                {extraNoteComponent}

                <p>
                    Saygılarımızla,<br />
                    Omuz Omuza Engelsiz İnsan Kaynakları Ekibi
                </p>
            </>
        );

    } else if (isPositive) {
        // --- STANDARD POSITIVE TEMPLATE ---
        previewSubject = `Tebrikler! ${companyName} - Yeni Göreviniz`;
        previewMessage = (
            <>
                <p className="mb-4">Sayın {candidateName},</p>
                <p className="mb-4">
                    Omuz Omuza Engelsiz İnsan Kaynakları olarak, {companyName}'ndaki yeni göreviniz için sizi en içten dileklerimizle tebrik etmek isteriz! Bu önemli adımınızda size destek olabildiğimiz için büyük mutluluk duyuyoruz.
                </p>
                <p className="mb-4">
                    Yeni işinizin kariyerinizde önemli bir dönüm noktası olacağına ve yeteneklerinizle {companyName}'na değerli katkılar sağlayacağınıza yürekten inanıyoruz.
                </p>

                {extraNoteComponent}

                <p className="mb-4">
                    Başarılarınızın devamını diler, bu yeni başlangıcınızın size ve {companyName}'na hayırlı olmasını temenni ederiz.
                </p>
                <p>
                    Saygılarımızla,<br />
                    Omuz Omuza Engelsiz İnsan Kaynakları Ekibi
                </p>
            </>
        );
    } else {
        // --- NEGATIVE TEMPLATE ---
        previewSubject = `${companyName} - Başvurunuz Hakkında`;
        previewMessage = (
            <>
                <p className="mb-4">Sayın {candidateName},</p>
                <p className="mb-4">
                    İşe alım süreciniz ve mülakat değerlendirmeleri sonucunda mevcut pozisyonla ilgili size ne yazık ki olumlu cevap veremiyoruz. Özgeçmişinizin niteliklerinize uygun bir pozisyon ve yeni bir iş fırsatı olduğunda tekrar değerlendirilmek üzere veri tabanımızda gizlilik prensipleri çerçevesinde saklanacağını belirtmek isteriz.
                </p>

                {extraNoteComponent}

                <p className="mb-4">
                    Göstermiş olduğunuz ilgiye teşekkür eder, çalışma yaşamınızda başarılar dileriz.
                </p>
                <p>
                    Saygılarımızla,<br />
                    Omuz Omuza Engelsiz İnsan Kaynakları Ekibi
                </p>
            </>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Left Column: Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Mail Formu</h2>
                    <p className="text-sm text-slate-500">Aday ve şirket bilgilerini girin</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Adayın Adı Soyadı *</Label>
                        <Input
                            name="candidate_name"
                            required
                            placeholder="Örn: Ahmet Yılmaz"
                            value={formData.candidate_name}
                            onChange={handleChange}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Adayın E-posta Adresi *</Label>
                        <Input
                            name="candidate_email"
                            required
                            type="email"
                            placeholder="ornek@email.com"
                            value={formData.candidate_email}
                            onChange={handleChange}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Şirket Adı *</Label>
                        <Input
                            name="company_name"
                            required
                            placeholder="Örn: ABC Teknoloji A.Ş."
                            value={formData.company_name}
                            onChange={handleChange}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Pozisyon Adı *</Label>
                        <Input
                            name="position_name"
                            required
                            placeholder="Örn: Yazılım Geliştirici"
                            value={formData.position_name}
                            onChange={handleChange}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="text-sm font-medium text-slate-700">Geri Dönüş Tipi *</Label>
                        <div className="flex flex-col gap-2">
                            <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${formData.result_type === "teklif" ? "bg-sky-50 border-sky-200" : "hover:bg-slate-50 border-transparent hover:border-slate-100"}`}>
                                <input
                                    type="radio"
                                    name="result_type"
                                    value="teklif"
                                    checked={formData.result_type === "teklif"}
                                    onChange={() => handleRadioChange("teklif")}
                                    className="w-4 h-4 text-[#1498e0] focus:ring-[#1498e0]"
                                />
                                <span className="text-sm font-bold text-[#1498e0]">Olumlu – İş Teklifi <span className="text-xs font-normal ml-1 bg-sky-100 px-2 py-0.5 rounded-full text-[#1498e0]">Dosya Ekli</span></span>
                            </label>

                            <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${formData.result_type === "olumlu" ? "bg-green-50 border-green-200" : "hover:bg-slate-50 border-transparent hover:border-slate-100"}`}>
                                <input
                                    type="radio"
                                    name="result_type"
                                    value="olumlu"
                                    checked={formData.result_type === "olumlu"}
                                    onChange={() => handleRadioChange("olumlu")}
                                    className="w-4 h-4 text-green-600 focus:ring-green-600"
                                />
                                <span className="text-sm font-bold text-green-700">Olumlu – Tebrik</span>
                            </label>

                            <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${formData.result_type === "olumsuz" ? "bg-red-50 border-red-200" : "hover:bg-slate-50 border-transparent hover:border-slate-100"}`}>
                                <input
                                    type="radio"
                                    name="result_type"
                                    value="olumsuz"
                                    checked={formData.result_type === "olumsuz"}
                                    onChange={() => handleRadioChange("olumsuz")}
                                    className="w-4 h-4 text-red-600 focus:ring-red-600"
                                />
                                <span className="text-sm font-bold text-red-700">Olumsuz – Süreç Olumsuz Sonuçlandı</span>
                            </label>
                        </div>
                    </div>

                    {/* File Upload Section (Only for Job Offer) */}
                    {isOffer && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                            <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                <span>Teklif Dosyası (Opsiyonel)</span>
                                <span className="text-xs text-slate-400 font-normal">PDF, DOC, DOCX</span>
                            </Label>
                            {!attachment ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:bg-sky-50 transition-all text-center">
                                    <input
                                        type="file"
                                        id="offerFile"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="offerFile" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                        <FileUp className="w-8 h-8 text-sky-400" />
                                        <span className="text-sm font-medium text-slate-600">Dosya Seç veya Sürükle</span>
                                        <span className="text-xs text-slate-400">Maksimum 5MB</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-100 rounded-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 bg-sky-100 rounded flex items-center justify-center flex-shrink-0">
                                            <FileUp className="w-4 h-4 text-[#1498e0]" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-slate-700 truncate">{attachment.name}</span>
                                            <span className="text-xs text-slate-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeAttachment}
                                        className="p-1 hover:bg-sky-100 rounded-full text-slate-400 hover:text-[#1498e0] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Ek Not (Opsiyonel)</Label>
                        <textarea
                            name="extra_note"
                            placeholder="Adaya iletmek istediğiniz ek mesaj..."
                            value={formData.extra_note}
                            onChange={handleChange}
                            rows={4}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7e22ce] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-[#1498e0] hover:bg-[#0d8ad0] text-white font-bold text-base shadow-lg shadow-sky-200 mt-4"
                    >
                        {loading ? "Gönderiliyor..." : (
                            <><Mail className="w-4 h-4 mr-2" /> Maili Gönder</>
                        )}
                    </Button>

                    {/* Status Messages */}
                    {status === "success" && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in">
                            <CheckCircle2 className="w-5 h-5" /> Mail başarıyla gönderildi.
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
                    <p className="text-sm text-slate-500">Gönderilecek mailin içeriğini görüntüleyin</p>
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
                            {previewMessage}

                            {/* Logo Placeholder */}
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
