"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Application, Job, Candidate } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Briefcase, Eye } from "lucide-react";
import CvPreviewModal from "@/components/features/cv/CvPreviewModal";
import { Button } from "@/components/ui/button";

export default function AdminApplicationsPage() {
    // Extend Application type to include joined data
    type ExtendedApplication = Application & { jobs: Job; candidates: Candidate };
    const [applications, setApplications] = useState<ExtendedApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // CV Preview State
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);
    const [cvData, setCvData] = useState<any>(null);

    useEffect(() => {
        let subscription: any;

        const fetchDataAndSubscribe = async () => {
            setLoading(true);
            await fetchApps();

            // Realtime Subscription
            subscription = supabase
                .channel('public:applications:admin')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'applications'
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        fetchApps(false);
                    }
                )
                .subscribe();
            setLoading(false);
        };

        fetchDataAndSubscribe();

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    async function fetchApps(showLoading = true) {
        if (showLoading) setLoading(true);
        // Fetch all applications
        const { data, error } = await supabase
            .from('applications')
            .select('*, jobs(*), candidates(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching applications:", error);
        } else {
            setApplications(data as any);
        }
        if (showLoading) setLoading(false);
    }

    async function handleStatusChange(appId: number, newStatus: string) {
        setUpdatingId(appId);
        try {
            // Use RPC to bypass RLS (using v2)
            const { error } = await supabase.rpc('update_application_status_v2', {
                p_app_id: appId,
                p_new_status: newStatus
            });

            if (error) throw error;

            setApplications(apps => apps.map(app =>
                app.id === appId ? { ...app, status: newStatus as any } : app
            ));
        } catch (error: any) {
            console.error("Error updating status:", error);
            alert("Durum güncellenemedi: " + (error?.message || "Bilinmeyen hata"));
        } finally {
            setUpdatingId(null);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-bold border border-amber-100"><Clock className="w-3 h-3" /> Beklemede</span>;
            case 'reviewed': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold border border-blue-100"><Eye className="w-3 h-3" /> İncelendi</span>;
            case 'consultant_interview': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-bold border border-purple-100"><Briefcase className="w-3 h-3" /> Danışman Mülakat</span>;
            case 'company_interview': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold border border-orange-100"><Briefcase className="w-3 h-3" /> Firma Mülakat</span>;
            case 'offered': return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-bold border border-indigo-100"><CheckCircle2 className="w-3 h-3" /> Teklif</span>;
            case 'accepted': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Kabul</span>;
            case 'started': return <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-md text-xs font-bold border border-teal-100"><CheckCircle2 className="w-3 h-3" /> İşe Başlangıç</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100"><XCircle className="w-3 h-3" /> Ret</span>;
            default: return <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-md text-xs font-bold border border-slate-200"><Clock className="w-3 h-3" /> Bilinmiyor ({status})</span>;
        }
    }

    async function fetchCandidateCvData(candidateId: string) {
        // Fetch resume data
        const [
            { data: candidate },
            { data: edu1 }, { data: edu2 },
            { data: exp1 }, { data: exp2 },
            { data: lang1 }, { data: lang2 },
            { data: skill1 }, { data: skill2 },
            { data: cert1 }, { data: cert2 },
            { data: ref1 }, { data: ref2 }
        ] = await Promise.all([
            supabase.from('candidates').select('*').eq('id', candidateId).single(),
            supabase.from('resume_education').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_educations').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_experience').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_experiences').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_language').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_languages').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_skill').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_skills').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_certification').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_certifications').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_reference').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_references').select('*').eq('candidate_id', candidateId)
        ]);

        const mergeData = (arr1: any[] | null, arr2: any[] | null) => {
            const combined = [...(arr1 || []), ...(arr2 || [])];
            const unique = new Map();
            combined.forEach(item => {
                const key = item.id || Math.random();
                if (!unique.has(key)) unique.set(key, item);
            });
            return Array.from(unique.values());
        };

        const educations = mergeData(edu1, edu2);
        const experiences = mergeData(exp1, exp2);
        const languages = mergeData(lang1, lang2);
        const skills = mergeData(skill1, skill2);
        const certifications = mergeData(cert1, cert2);
        const references = mergeData(ref1, ref2);

        setCvData({
            candidate: candidate || {},
            educations: educations || [],
            experiences: experiences || [],
            languages: languages || [],
            skills: skills || [],
            certifications: certifications || [],
            references: references || []
        });
    }

    async function handleViewCV(candidateId: string) {
        await fetchCandidateCvData(candidateId);
        setIsCvModalOpen(true);
    }

    if (loading && applications.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#7e22ce] w-8 h-8" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tüm Başvurular</h1>
                <p className="text-slate-500">Sistemdeki tüm iş başvurularını buradan yönetebilirsiniz.</p>
            </div>

            <div className="grid gap-4">
                {applications.map(app => (
                    <Card key={app.id} className="hover:shadow-md transition-shadow border-slate-200">
                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/candidates/${app.candidates?.id}`} className="font-bold text-lg text-slate-800 hover:text-[#7e22ce] hover:underline">
                                        {app.candidates?.first_name} {app.candidates?.last_name}
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-[#7e22ce] border-purple-200 hover:bg-purple-50"
                                        onClick={() => app.candidates?.id && handleViewCV(app.candidates.id)}
                                    >
                                        <Eye className="w-3 h-3 mr-1" /> CV Görüntüle
                                    </Button>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                    Başvuru: <Link href={`/admin/jobs/${app.job_id}`} className="font-medium text-slate-900 hover:underline">{app.jobs?.title}</Link>
                                    <span className="text-slate-300 mx-1">•</span>
                                    {app.jobs?.company_name || 'Şirket Belirtilmemiş'}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {new Date(app.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Current Status Indicator */}
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Mevcut Durum</div>
                                    {getStatusBadge(app.status)}
                                </div>

                                {/* Status Change Actions */}
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">İşlem Yap</div>
                                    <select
                                        className="h-9 w-40 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-[#7e22ce] focus:outline-none focus:ring-1 focus:ring-[#7e22ce] disabled:opacity-50"
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        disabled={updatingId === app.id}
                                    >
                                        <option value="pending">Beklemede</option>
                                        <option value="reviewed">İncelendi</option>
                                        <option value="consultant_interview">Danışman Mülakat</option>
                                        <option value="company_interview">Firma Mülakat</option>
                                        <option value="offered">Teklif</option>
                                        <option value="accepted">Kabul</option>
                                        <option value="started">İşe Başlangıç</option>
                                        <option value="rejected">Ret</option>
                                    </select>
                                    {updatingId === app.id && <span className="text-xs text-[#7e22ce] animate-pulse">Güncelleniyor...</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!loading && applications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
                        <p>Henüz hiç başvuru bulunmuyor.</p>
                    </div>
                )}
            </div>


            <CvPreviewModal
                isOpen={isCvModalOpen}
                onClose={() => setIsCvModalOpen(false)}
                data={cvData}
            />
        </div >
    );
}
