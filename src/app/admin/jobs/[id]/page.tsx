"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Application, Job, Candidate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CvPreviewModal from "@/components/features/cv/CvPreviewModal";

function StatusBadge({ status }: { status: string }) {
    const colors: any = {
        pending: "bg-amber-500",
        reviewed: "bg-blue-500",
        interviewing: "bg-[#1498e0]",
        offered: "bg-indigo-500",
        accepted: "bg-emerald-500",
        rejected: "bg-red-500"
    }

    const labels: any = {
        pending: "Beklemede",
        reviewed: "İncelendi",
        interviewing: "Mülakat",
        offered: "Teklif",
        accepted: "Kabul",
        rejected: "Red"
    }

    return <span className={`px-2 py-1 rounded text-white text-xs font-bold uppercase ${colors[status] || "bg-gray-500"}`}>
        {labels[status] || status}
    </span>
}


export default function AdminJobDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<(Application & { candidates: Candidate })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);
    const [cvData, setCvData] = useState<any>(null);

    useEffect(() => { fetchJobForAdmin(); }, [id]);

    async function fetchJobForAdmin() {
        setLoading(true);
        // Fetch job
        const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single();
        if (jobData) setJob(jobData);

        // Fetch applications
        const { data: appData } = await supabase
            .from('applications')
            .select(`
            *,
            candidates (*)
        `)
            .eq('job_id', id)
            .order('created_at', { ascending: false });

        if (appData) setApplications(appData as any);
        setLoading(false);
    }

    async function updateStatus(appId: number, newStatus: string) {
        // Use v2 RPC function to bypass RLS issues and handles UUIDs
        const { data, error } = await supabase.rpc('update_application_status_v2', {
            p_app_id: appId,
            p_new_status: newStatus
        });

        if (error) {
            console.error('❌ Error updating status:', error);
            alert('Durum güncellenirken hata oluştu: ' + error.message);
        } else {
            console.log('✅ Status updated successfully via RPC');
            // Force new array reference to trigger re-render
            setApplications(prevApps => {
                const updated = prevApps.map(a =>
                    a.id === appId ? { ...a, status: newStatus as any } : a
                );
                return updated;
            });
        }
    }

    async function fetchCandidateCvData(candidateId: string) {
        const { data: candidate } = await supabase.from('candidates').select('*').eq('id', candidateId).single();
        // Dual Fetch for robustness
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

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#1498e0] w-8 h-8" /></div>;
    if (!job) return <div>Job not found</div>;

    return (
        <div className="space-y-6">
            <Link href="/admin/jobs" className="flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> İlanlara Dön
            </Link>

            <Card className="bg-slate-50 border-slate-200">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{job.title}</CardTitle>
                            <p className="text-slate-500">{job.company_name} - {job.location}</p>
                        </div>
                        {job.is_active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full border border-green-200">Yayında</span>
                        ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full border border-red-200">Yayında Değil</span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{job.description}</p>
                </CardContent>
            </Card>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Başvurular ({applications.length})</h2>
                <div className="grid gap-4">
                    {applications.map(app => (
                        <Card key={app.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                                        {app.candidates.avatar_url ? (
                                            <img src={app.candidates.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">NA</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{app.candidates.first_name} {app.candidates.last_name}</p>
                                        <p className="text-sm text-slate-500">{app.candidates.city}, {app.candidates.country}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Durum:</span>
                                        <select
                                            key={`status-${app.id}-${app.status}`}
                                            className="h-9 w-40 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:border-[#1498e0] focus:outline-none focus:ring-1 focus:ring-[#1498e0] transition-shadow"
                                            value={app.status || 'pending'}
                                            onChange={(e) => updateStatus(app.id, e.target.value)}
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
                                        onClick={() => fetchCandidateCvData(app.candidate_id)}
                                    >
                                        CV Önizle
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {applications.length === 0 && <p className="text-slate-500">Henüz başvuru yok.</p>}
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
