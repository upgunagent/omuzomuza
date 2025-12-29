"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { JobPosition, Candidate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Users, Save, Loader2, Upload, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AddCandidatePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [position, setPosition] = useState<JobPosition | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [candidateSource, setCandidateSource] = useState<"new" | "existing">("new");
    const [existingCandidates, setExistingCandidates] = useState<Candidate[]>([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    // Extended Form State
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        city: "",
        district: "",
        disability_status: "", // Combobox or text
        title: "", // Snapshot title

        cv_file: null as File | null,

        // Process fields
        interview_datetime: "", // datetime-local
        consultant_evaluation: "",
        share_date_with_client: "", // date
        salary_expectation: "",
        company_interview_date: "", // date
        company_feedback: "",
        result_status: "BEKLEMEDE",
        job_start_date: ""
    });

    useEffect(() => {
        if (id) fetchPosition();
    }, [id]);

    async function fetchPosition() {
        setLoading(true);
        const { data: posData, error } = await supabase
            .from('job_positions')
            .select('*, companies(name)')
            .eq('id', id)
            .single();

        if (error) {
            toast.error("Pozisyon bulunamadı.");
            router.push('/consultant/positions');
            return;
        }
        setPosition(posData);
        // Auto-fill title snapshot from position title if empty
        setFormData(prev => ({ ...prev, title: posData.title }));
        setLoading(false);
    }

    async function handleSearch(term: string) {
        setSearchTerm(term);
        if (term.length < 2) return;

        // Run queries in parallel
        // candidates: first_name
        // happy_engelsiz / omuzomuza_engelli: isim
        const [candidatesRes, happyRes, omuzRes] = await Promise.all([
            supabase
                .from('candidates')
                .select('*')
                .ilike('first_name', `%${term}%`)
                .limit(5),
            supabase
                .from('happy_engelsiz')
                .select('*')
                .ilike('isim', `%${term}%`)
                .limit(5),
            supabase
                .from('omuzomuza_engelli')
                .select('*')
                .ilike('isim', `%${term}%`)
                .limit(5)
        ]);

        const combined: Candidate[] = [];

        // Helper to map different table schemas to unified Candidate interface
        const mapToCandidate = (item: any, source: string): Candidate => {
            let disabilityInfo = "";
            let firstName = "";
            let lastName = "";
            let email = "";
            let phone = "";
            let city = "";
            let district = "";

            if (source === 'candidates') {
                firstName = item.first_name || "";
                lastName = item.last_name || "";
                email = item.email || "";
                phone = item.phone || "";
                city = item.city || "";
                district = item.district || "";

                // Map disability from rate + category
                if (item.is_disabled) {
                    const rate = item.disability_rate ? `%${item.disability_rate}` : '';
                    const category = item.disability_category || '';
                    disabilityInfo = `${rate} ${category}`.trim();
                }
            } else {
                // happy_engelsiz and omuzomuza_engelli schema
                firstName = item.isim || "";
                lastName = item.soyisim || "";
                email = item.e_posta || "";
                phone = item.cep_telefonu || "";
                city = item.il || "";
                district = item.ilce || "";
                disabilityInfo = item.engel_durumu || "";
            }

            return {
                id: item.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                city: city,
                district: district,
                disability_status: disabilityInfo,
                source_table: source
            } as any;
        };

        if (candidatesRes.data) {
            candidatesRes.data.forEach(c => combined.push(mapToCandidate(c, 'candidates')));
        }
        if (happyRes.data) {
            happyRes.data.forEach(c => combined.push(mapToCandidate(c, 'happy_engelsiz')));
        }
        if (omuzRes.data) {
            omuzRes.data.forEach(c => combined.push(mapToCandidate(c, 'omuzomuza_engelli')));
        }

        setExistingCandidates(combined);
    }

    async function handleSelectCandidate(candidateId: string) {
        setSelectedCandidateId(candidateId);
        const candidate = existingCandidates.find(c => c.id === candidateId);
        if (candidate) {
            setFormData(prev => ({
                ...prev,
                full_name: `${candidate.first_name} ${candidate.last_name}`,
                email: candidate.email || "",
                phone: candidate.phone || "",
                city: candidate.city || "",
                district: candidate.district || "",
                // Use the mapped disability_status from the combined object
                disability_status: (candidate as any).disability_status || "",
            }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            let candidateIdForLink = null;
            let cvUrl = null;

            if (candidateSource === "existing") {
                if (!selectedCandidateId) throw new Error("Lütfen bir aday seçiniz.");
                candidateIdForLink = selectedCandidateId;
                // Note: Not copying CV from existing candidate for now, assuming new process might need new CV or just link.
                // If user uploads a new CV here, we use it. If not, we might want to fetch existing CV url.
                // For now, let's allow upload even for existing candidate if they want to attach a specific CV for this position.
            }

            // Upload CV if provided
            if (formData.cv_file) {
                const fileExt = formData.cv_file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `position_cvs/${id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('cvs')
                    .upload(filePath, formData.cv_file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(filePath);
                cvUrl = publicUrl;
            } else if (candidateSource === "new") {
                throw new Error("Yeni aday için CV yüklemesi zorunludur.");
            }

            const payload = {
                position_id: id,
                candidate_id: candidateIdForLink,
                source_type: candidateSource === "new" ? "new_candidate" : "existing_candidate",
                cv_file_url: cvUrl, // Can be null if existing candidate and no new file (schema nullable)

                candidate_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                district: formData.district,
                disability_status: formData.disability_status,

                position_title_snapshot: formData.title,
                consultant_evaluation: formData.consultant_evaluation,
                interview_datetime: formData.interview_datetime ? new Date(formData.interview_datetime).toISOString() : null,
                share_date_with_client: formData.share_date_with_client || null,
                salary_expectation: formData.salary_expectation,
                company_interview_date: formData.company_interview_date || null,
                company_feedback: formData.company_feedback,
                result_status: formData.result_status,
                job_start_date: formData.job_start_date || null,

                created_by: (await supabase.auth.getUser()).data.user?.id
            };

            const { error: dbError } = await supabase
                .from('position_candidates')
                .insert([payload]);

            if (dbError) throw dbError;

            toast.success("Aday başarıyla eklendi.");
            router.push(`/consultant/positions/${id}`);

        } catch (error: any) {
            console.error(error);
            toast.error("Hata: " + error.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin w-8 h-8 text-[#6A1B9A]" /></div>;
    if (!position) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Link href={`/consultant/positions/${id}`}>
                    <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Pozisyona Aday Ekle</h1>
                    <p className="text-slate-500 text-sm">
                        <span className="font-semibold text-[#6A1B9A]">{position.title}</span> - {position.companies?.name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                    onClick={() => { setCandidateSource("existing"); setSearchTerm(""); setSelectedCandidateId(""); }}
                    className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${candidateSource === "existing" ? "border-[#6A1B9A] bg-[#6A1B9A]/5 ring-1 ring-[#6A1B9A]" : "border-slate-200 hover:border-slate-300"}`}
                >
                    <div className={`p-2 rounded-full ${candidateSource === "existing" ? "bg-[#6A1B9A] text-white" : "bg-slate-100 text-slate-400"}`}>
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Aday Ara (Mevcut)</div>
                        <div className="text-xs text-slate-500">Sistemdeki adaylardan seç</div>
                    </div>
                </div>

                <div
                    onClick={() => setCandidateSource("new")}
                    className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${candidateSource === "new" ? "border-[#6A1B9A] bg-[#6A1B9A]/5 ring-1 ring-[#6A1B9A]" : "border-slate-200 hover:border-slate-300"}`}
                >
                    <div className={`p-2 rounded-full ${candidateSource === "new" ? "bg-[#6A1B9A] text-white" : "bg-slate-100 text-slate-400"}`}>
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Yeni Aday Girişi</div>
                        <div className="text-xs text-slate-500">Sisteme yeni kişi ekle</div>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base font-bold">Aday Bilgileri</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {candidateSource === "existing" && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                                <Label className="mb-2 block">Aday Ara (İsim)</Label>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Ali Veli..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="bg-white"
                                    />
                                    {existingCandidates.length > 0 && searchTerm.length >= 2 && (
                                        <div className="bg-white border rounded-md shadow-sm divide-y text-sm max-h-40 overflow-y-auto">
                                            {existingCandidates.map(c => (
                                                <div
                                                    key={c.id}
                                                    className={`p-2 cursor-pointer hover:bg-slate-50 ${selectedCandidateId === c.id ? 'bg-purple-50 text-purple-700' : ''}`}
                                                    onClick={() => handleSelectCandidate(c.id)}
                                                >
                                                    <div className="font-semibold">{c.first_name} {c.last_name}</div>
                                                    <div className="text-xs text-slate-500">{c.email} | {c.city || '-'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ad Soyad *</Label>
                                <Input required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="05XX..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Engel Durumu</Label>
                                <Input value={formData.disability_status} onChange={e => setFormData({ ...formData, disability_status: e.target.value })} placeholder="%40 İşitme vb." />
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
                                <Upload className="w-4 h-4" /> CV Yükle (PDF/Word) {candidateSource === "new" && "*"}
                            </Label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setFormData({ ...formData, cv_file: e.target.files?.[0] || null })}
                                className="bg-white"
                                required={candidateSource === "new"}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">Süreç Detayları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pozisyon / Departman (Snapshot)</Label>
                                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ücret Beklentisi</Label>
                                    <Input value={formData.salary_expectation} onChange={e => setFormData({ ...formData, salary_expectation: e.target.value })} placeholder="Net/Brüt..." />
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
                            <Label>Danışman Değerlendirmesi (~200 kelime)</Label>
                            <Textarea
                                value={formData.consultant_evaluation}
                                onChange={e => setFormData({ ...formData, consultant_evaluation: e.target.value })}
                                placeholder="Aday hakkındaki görüşleriniz..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Firma Değerlendirmesi (~200 kelime)</Label>
                            <Textarea
                                value={formData.company_feedback}
                                onChange={e => setFormData({ ...formData, company_feedback: e.target.value })}
                                placeholder="Firmanın aday hakkındaki geri bildirimi..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={submitting} className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white w-full md:w-auto">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Kaydı Tamamla</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
