"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Job } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Briefcase, Building2, MapPin, Clock, Eye, Loader2, Accessibility } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function ConsultantJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchJobs(); }, []);

    async function fetchJobs() {
        setLoading(true);
        const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        // Consultant sees all jobs to understand status, same as Admin
        if (data) setJobs(data);
        setLoading(false);
    }

    // Realtime Subscription
    useEffect(() => {
        const subscription = supabase
            .channel('public:jobs')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, payload => {
                console.log('Realtime job update:', payload);
                const updatedJob = payload.new as Job;
                setJobs(currentJobs => currentJobs.map(job => job.id === updatedJob.id ? updatedJob : job));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, payload => {
                const newJob = payload.new as Job;
                setJobs(currentJobs => [newJob, ...currentJobs]);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'jobs' }, payload => {
                setJobs(currentJobs => currentJobs.filter(job => job.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    function handleViewDetails(job: Job) {
        setSelectedJob(job);
        setIsModalOpen(true);
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">İlanlar</h1>
                    <p className="text-slate-500 text-sm">Sistemdeki tüm açık pozisyonları görüntüleyin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                    <Card key={job.id} className={job.is_active ? 'border-t-4 border-t-[#1498e0]' : 'opacity-75 bg-slate-50 border-t-4 border-t-slate-300'}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <CardTitle className="text-lg font-bold truncate text-slate-800" title={job.title}>{job.title}</CardTitle>
                                {job.is_handicapped && <Accessibility className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(job)}
                                className="hover:text-[#1498e0] text-slate-500"
                            >
                                <Eye className="w-4 h-4 mr-1" /> İncele
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-700">{job.company_name}</p>
                                <p className="text-xs text-slate-500">{job.location} • {job.work_type}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{job.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t">
                                {job.is_active ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-md border border-green-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                        Yayında
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase rounded-md border border-red-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                        Yayında Değil
                                    </div>
                                )}
                                <Link href={`/consultant/jobs/${job.id}`}>
                                    <Button size="sm" variant="outline" className="text-[#1498e0] border-[#1498e0] hover:bg-[#1498e0] hover:text-white">Başvurular</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {jobs.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Henüz hiç ilan oluşturulmamış.</p>
                    </div>
                )}
            </div>

            {/* Read-Only Modal for Details */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="İlan Detayı">
                {selectedJob && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{selectedJob.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <Building2 className="w-4 h-4" /> {selectedJob.company_name}
                                <span className="mx-1">•</span>
                                <MapPin className="w-4 h-4" /> {selectedJob.location}
                                <span className="mx-1">•</span>
                                <Clock className="w-4 h-4" /> {selectedJob.work_type}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">İlan Açıklaması</Label>
                            <div className="mt-2 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                                {selectedJob.description}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <Button onClick={() => setIsModalOpen(false)} className="bg-slate-800 text-white hover:bg-slate-700">Kapat</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
