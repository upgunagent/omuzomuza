"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Job, Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Briefcase, Building2, CheckCircle, Accessibility } from "lucide-react";

export default function CandidateJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<number | null>(null); // Job ID being applied to
    const [isUserDisabled, setIsUserDisabled] = useState<boolean>(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch User Disability Status
                const { data: candidateData } = await supabase
                    .from('candidates')
                    .select('is_disabled')
                    .eq('id', user.id)
                    .single();

                if (candidateData) {
                    setIsUserDisabled(candidateData.is_disabled || false);
                }
            }

            // 1. Fetch Active Jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;
            setJobs(jobsData || []);

            // 2. Fetch User's Applications (to show "Applied" status)
            if (user) {
                const { data: appsData, error: appsError } = await supabase
                    .from('applications')
                    .select('*')
                    .eq('candidate_id', user.id);

                if (appsError) throw appsError;
                setApplications(appsData || []);
            }

        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    }

    // Realtime Subscription for Candidates
    useEffect(() => {
        const subscription = supabase
            .channel('public:jobs:candidate')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, payload => {
                const updatedJob = payload.new as Job;
                if (!updatedJob.is_active) {
                    // If job became inactive, remove it
                    setJobs(prev => prev.filter(j => j.id !== updatedJob.id));
                } else {
                    // Update or Add (if it was previously inactive and now active)
                    setJobs(prev => {
                        const exists = prev.find(j => j.id === updatedJob.id);
                        if (exists) return prev.map(j => j.id === updatedJob.id ? updatedJob : j);
                        return [updatedJob, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
                    });
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, payload => {
                const newJob = payload.new as Job;
                if (newJob.is_active) {
                    setJobs(prev => [newJob, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'jobs' }, payload => {
                setJobs(prev => prev.filter(j => j.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    async function handleApply(jobId: number) {
        setApplying(jobId);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Başvuru yapmak için giriş yapmalısınız.");
                return;
            }

            // Check if already applied (double check)
            const exists = applications.some(app => app.job_id === jobId);
            if (exists) {
                alert("Bu ilana zaten başvurdunuz.");
                return;
            }

            const { data, error } = await supabase
                .from('applications')
                .insert([
                    {
                        job_id: jobId,
                        candidate_id: user.id,
                        status: 'pending' // Default status
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setApplications([...applications, data]);
            alert("Başvurunuz başarıyla alındı!");

        } catch (error: any) {
            console.error("Application error:", error);
            // Check for Duplicate Key error (Postgres code 23505)
            if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
                alert("HATA: Bu ilana daha önce zaten başvurmuşsunuz.");
            } else {
                alert(`Başvuru sırasında bir hata oluştu: ${error.message || error.details || 'Bilinmeyen hata'}`);
            }
        } finally {
            setApplying(null);
        }
    }

    // Filter jobs based on disability status
    const visibleJobs = jobs.filter(job => {
        // If user is disabled, show ALL jobs (standard + handicapped)
        if (isUserDisabled) return true;

        // If user is NOT disabled, show ONLY standard jobs
        return !job.is_handicapped;
    });

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#6A1B9A]" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Açık Pozisyonlar</h1>
                <p className="text-slate-500">Size uygun ilanlara göz atın ve hemen başvurun.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleJobs.map(job => {
                    const isApplied = applications.some(app => app.job_id === job.id);

                    return (
                        <Card key={job.id} className="hover:shadow-md transition-shadow border-t-4 border-t-[#6A1B9A]">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-2 items-start overflow-hidden">
                                        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1" title={job.title}>
                                            {job.title}
                                        </CardTitle>
                                        {job.is_handicapped && <Accessibility className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                                    </div>
                                    {isApplied && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Başvuruldu
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Building2 className="w-4 h-4 mr-1" />
                                        {job.company_name}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
                                        <MapPin className="w-3 h-3 mr-1" /> {job.location}
                                    </span>
                                    <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
                                        <Briefcase className="w-3 h-3 mr-1" /> {job.work_type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-3 h-[60px]">
                                    {job.description}
                                </p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button
                                    className="flex-1 bg-[#6A1B9A] hover:bg-[#5b1785] text-white"
                                    onClick={() => window.location.href = `/candidate/jobs/${job.id}`}
                                >
                                    İlanı İncele
                                </Button>
                                {!isApplied && (
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        disabled={applying === job.id}
                                        onClick={() => handleApply(job.id)}
                                    >
                                        {applying === job.id ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Başvuruluyor...</>
                                        ) : (
                                            "Başvur"
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}

                {jobs.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Briefcase className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Aktif İlan Yok</h3>
                        <p className="text-slate-500">Şu anda yayınlanmış bir iş ilanı bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
