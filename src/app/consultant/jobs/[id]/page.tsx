"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Application, Job, Candidate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CvPreviewModal from "@/components/features/cv/CvPreviewModal";

export default function ConsultantJobApplicationsPage() {
    const params = useParams();
    const id = params.id as string;
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<(Application & { candidates: Candidate })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);
    const [cvData, setCvData] = useState<any>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        let subscription: any;

        const fetchDataAndSubscribe = async () => {
            setLoading(true);
            await fetchJobDetails();

            // Realtime Subscription
            subscription = supabase
                .channel(`public:applications:job:${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'applications',
                        filter: `job_id=eq.${id}`
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        fetchJobDetails(false); // Refetch without full loading state
                    }
                )
                .subscribe();
            setLoading(false);
        };

        fetchDataAndSubscribe();

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, [id]);

    async function fetchJobDetails(showLoading = true) {
        if (showLoading) setLoading(true);
        // Fetch job
        const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single();
        if (jobData) setJob(jobData);

        // Fetch applications with candidates
        const { data: appData } = await supabase
            .from('applications')
            .select(`
                *,
                candidates (*)
            `)
            .eq('job_id', id)
            .order('created_at', { ascending: false });

        if (appData) setApplications(appData as any);
        if (showLoading) setLoading(false);
    }

    async function handleStatusChange(appId: number, newStatus: string) {
        setUpdatingId(appId);
        try {
            // Using RPC for Consultant (v2 for UUID support)
            const { error } = await supabase.rpc('update_application_status_v2', {
                p_app_id: appId,
                p_new_status: newStatus
            });

            if (error) throw error;
            // Optimistic update
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

    // Reuse the robust fetch logic from other pages
    async function fetchCandidateCvData(candidateId: string) {
        const { data: candidate } = await supabase.from('candidates').select('*').eq('id', candidateId).single();

        // Dual Fetch Strategy
        const [
            { data: edu1 }, { data: edu2 },
            { data: exp1 }, { data: exp2 },
            { data: lang1 }, { data: lang2 },
            { data: skill1 }, { data: skill2 },
            { data: cert1 }, { data: cert2 },
            { data: ref1 }, { data: ref2 }
        ] = await Promise.all([
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

        setCvData({
            candidate: candidate || {},
            educations: mergeData(edu1, edu2) || [],
            experiences: mergeData(exp1, exp2) || [],
            languages: mergeData(lang1, lang2) || [],
            skills: mergeData(skill1, skill2) || [],
            certifications: mergeData(cert1, cert2) || [],
            references: mergeData(ref1, ref2) || []
        });
        setIsCvModalOpen(true);
    }

    if (loading && applications.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#7e22ce] w-8 h-8" /></div>;
    if (!job && !loading) return <div>İlan bulunamadı!</div>;

    return (
        <div className="space-y-6">
            <Link href="/consultant/jobs" className="flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> İlanlara Dön
            </Link>

            {job && (
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-800">{job.title}</CardTitle>
                                <p className="text-slate-500 mt-1">{job.company_name} • {job.location}</p>
                            </div>
                            {job.is_active ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full border border-green-200">Yayında</span>
                            ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full border border-red-200">Yayında Değil</span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap">
                            {job.description}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Başvurular
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-sm">{applications.length}</span>
                </h2>

                <div className="grid gap-4">
                    {applications.map(app => (
                        <Card key={app.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                        {app.candidates.avatar_url ? (
                                            <img src={app.candidates.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold">NA</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">{app.candidates.first_name} {app.candidates.last_name}</p>
                                        <p className="text-sm text-slate-500">{app.candidates.city || 'Şehir Yok'}, {app.candidates.country || 'Ülke Yok'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Durum</span>
                                        <select
                                            className="h-9 w-40 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:border-[#7e22ce] focus:outline-none focus:ring-1 focus:ring-[#7e22ce] transition-shadow"
                                            value={app.status || 'pending'}
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            disabled={updatingId === app.id}
                                        >
                                            <option value="pending">Beklemede</option>
                                            <option value="reviewed">İncelendi</option>
                                            <option value="interviewing">Mülakat</option>
                                            <option value="offered">Teklif</option>
                                            <option value="accepted">Kabul</option>
                                            <option value="rejected">Red</option>
                                        </select>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 border-slate-300 text-slate-700 hover:bg-slate-50"
                                        onClick={() => fetchCandidateCvData(app.candidate_id)}
                                    >
                                        CV İncele
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}


                    {!loading && applications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-slate-500">Bu ilana henüz başvuru yapılmamış.</p>
                        </div>
                    )}
                </div>
            </div>

            <CvPreviewModal
                isOpen={isCvModalOpen}
                onClose={() => setIsCvModalOpen(false)}
                data={cvData}
            />
        </div>
    );
}
