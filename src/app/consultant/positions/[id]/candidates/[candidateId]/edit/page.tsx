"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { JobPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditCandidatePage() {
    const params = useParams();
    const router = useRouter();
    const positionId = params.id as string;
    const candidateId = params.candidateId as string;

    const [position, setPosition] = useState<JobPosition | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        candidate_name: "",
        email: "",
        phone: "",
        city: "",
        district: "",
        disability_status: "",
        position_title_snapshot: "",

        // Process fields
        interview_datetime: "", // datetime-local
        consultant_evaluation: "",
        share_date_with_client: "", // date
        salary_expectation: "",
        company_interview_date: "", // date
        company_feedback: "",
        result_status: "BEKLEMEDE",
        job_start_date: "",

        cv_file_url: ""
    });

    // New CV file if updating
    const [newCvFile, setNewCvFile] = useState<File | null>(null);

    useEffect(() => {
        if (positionId && candidateId) fetchData();
    }, [positionId, candidateId]);

    async function fetchData() {
        setLoading(true);
        // Fetch Position
        const { data: posData } = await supabase.from('job_positions').select('*, companies(name)').eq('id', positionId).single();
        setPosition(posData);

        // Fetch Candidate Entry
        const { data: candData, error } = await supabase
            .from('position_candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (error) {
            toast.error("Kayıt bulunamadı.");
            router.push(`/consultant/positions/${positionId}/report`);
            return;
        }

        // Populate Form
        setFormData({
            candidate_name: candData.candidate_name || "",
            email: candData.email || "",
            phone: candData.phone || "",
            city: candData.city || "",
            district: candData.district || "",
            disability_status: candData.disability_status || "",
            position_title_snapshot: candData.position_title_snapshot || "",

            interview_datetime: candData.interview_datetime ? new Date(candData.interview_datetime).toISOString().slice(0, 16) : "",
            consultant_evaluation: candData.consultant_evaluation || "",
            share_date_with_client: candData.share_date_with_client || "",
            salary_expectation: candData.salary_expectation || "",
            company_interview_date: candData.company_interview_date || "",
            company_feedback: candData.company_feedback || "",
            result_status: candData.result_status || "BEKLEMEDE",
            job_start_date: candData.job_start_date || "",

            cv_file_url: candData.cv_file_url || ""
        });

        setLoading(false);
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            let cvUrl = formData.cv_file_url;

            // Upload new CV if selected
            if (newCvFile) {
                const fileExt = newCvFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `position_cvs/${positionId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('cvs')
                    .upload(filePath, newCvFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(filePath);
                cvUrl = publicUrl;
            }

            const { error: dbError } = await supabase
                .from('position_candidates')
                .update({
                    candidate_name: formData.candidate_name,
                    email: formData.email,
                    phone: formData.phone,
                    city: formData.city,
                    district: formData.district,
                    disability_status: formData.disability_status,
                    position_title_snapshot: formData.position_title_snapshot,

                    interview_datetime: formData.interview_datetime ? new Date(formData.interview_datetime).toISOString() : null,
                    consultant_evaluation: formData.consultant_evaluation,
                    share_date_with_client: formData.share_date_with_client || null,
                    salary_expectation: formData.salary_expectation,
                    company_interview_date: formData.company_interview_date || null,
                    company_feedback: formData.company_feedback,
                    result_status: formData.result_status,
                    job_start_date: formData.job_start_date || null,

                    cv_file_url: cvUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', candidateId);

            if (dbError) throw dbError;

            toast.success("Aday bilgileri güncellendi.");
            router.push(`/consultant/positions/${positionId}/report`);

        } catch (error: any) {
            console.error(error);
            toast.error("Güncelleme hatası: " + error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin w-8 h-8 text-[#6A1B9A]" /></div>;
    if (!position) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Link href={`/consultant/positions/${positionId}/report`}>
                    <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Aday Düzenle</h1>
                    <p className="text-slate-500 text-sm">
                        <span className="font-semibold text-[#6A1B9A]">{position.title}</span> pozisyonu için aday bilgilerini güncelle.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base font-bold">Aday ve Süreç Bilgileri</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ad Soyad *</Label>
                                <Input required value={formData.candidate_name} onChange={e => setFormData({ ...formData, candidate_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Engel Durumu</Label>
                                <Input value={formData.disability_status} onChange={e => setFormData({ ...formData, disability_status: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Şehir</Label>
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>İlçe</Label>
                                <Input value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                            <Label className="flex items-center gap-2 mb-2">
                                <Upload className="w-4 h-4" /> CV Güncelle (İsteğe Bağlı)
                            </Label>
                            {formData.cv_file_url && (
                                <div className="text-xs text-blue-600 mb-2">
                                    <a href={formData.cv_file_url} target="_blank" className="underline">Mevcut CV'yi Görüntüle</a>
                                </div>
                            )}
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setNewCvFile(e.target.files?.[0] || null)}
                                className="bg-white"
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">Süreç Detayları Update</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pozisyon / Departman</Label>
                                    <Input value={formData.position_title_snapshot} onChange={e => setFormData({ ...formData, position_title_snapshot: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ücret Beklentisi</Label>
                                    <Input value={formData.salary_expectation} onChange={e => setFormData({ ...formData, salary_expectation: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Danışman Görüşme Tarihi</Label>
                                    <Input type="datetime-local" value={formData.interview_datetime} onChange={e => setFormData({ ...formData, interview_datetime: e.target.value })} className="block w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Aday Paylaşım Tarihi</Label>
                                    <Input type="date" value={formData.share_date_with_client} onChange={e => setFormData({ ...formData, share_date_with_client: e.target.value })} className="block w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Firma ile Görüşme Tarihi</Label>
                                    <Input type="date" value={formData.company_interview_date} onChange={e => setFormData({ ...formData, company_interview_date: e.target.value })} className="block w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label>İş Başı Tarihi</Label>
                                    <Input type="date" value={formData.job_start_date} onChange={e => setFormData({ ...formData, job_start_date: e.target.value })} className="block w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sonuç Durumu</Label>
                                    <Select value={formData.result_status} onValueChange={(val) => setFormData({ ...formData, result_status: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BEKLEMEDE">BEKLEMEDE</SelectItem>
                                            <SelectItem value="INCELENDI">İNCELENDİ</SelectItem>
                                            <SelectItem value="MULAKAT">MÜLAKAT</SelectItem>
                                            <SelectItem value="TEKLIF">TEKLİF</SelectItem>
                                            <SelectItem value="KABUL">KABUL</SelectItem>
                                            <SelectItem value="RED">RED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Danışman Değerlendirmesi</Label>
                            <Textarea
                                value={formData.consultant_evaluation}
                                onChange={e => setFormData({ ...formData, consultant_evaluation: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Firma Değerlendirmesi</Label>
                            <Textarea
                                value={formData.company_feedback}
                                onChange={e => setFormData({ ...formData, company_feedback: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving} className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white w-full md:w-auto">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
