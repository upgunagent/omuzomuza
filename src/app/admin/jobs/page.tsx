"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Job } from "@/types";
import { Plus, Trash2, Edit, Loader2, Accessibility, Trash, Pencil, Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import JobPreviewModal from "@/components/features/jobs/JobPreviewModal";
import Link from "next/link";

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
    const [saving, setSaving] = useState(false);

    // Preview State
    const [previewJob, setPreviewJob] = useState<Job | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('admin-jobs-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newJob = payload.new as Job;
                    setJobs(prev => {
                        if (prev.some(j => j.id === newJob.id)) return prev;
                        return [newJob, ...prev];
                    });
                } else if (payload.eventType === 'DELETE') {
                    setJobs(prev => prev.filter(job => job.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setJobs(prev => prev.map(job => job.id === payload.new.id ? payload.new as Job : job));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (data) setJobs(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

            const jobData = {
                title: currentJob.title,
                description: currentJob.description,
                company_name: currentJob.company_name,
                location: currentJob.location,
                work_type: currentJob.work_type,
                is_active: currentJob.is_active || false,
                is_handicapped: currentJob.is_handicapped || false,
                created_by: user.id
            };

            if (currentJob.id) {
                // Update
                const { error, data } = await supabase
                    .from('jobs')
                    .update(jobData)
                    .eq('id', currentJob.id)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setJobs(prev => prev.map(j => j.id === data.id ? data : j));
                }

            } else {
                // Insert
                const { error, data } = await supabase
                    .from('jobs')
                    .insert([jobData])
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setJobs(prev => [data, ...prev]);
                }
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving job:", error);
            alert(`İşlem başarısız: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;
        try {
            // Optimistic Update
            setJobs(prev => prev.filter(j => j.id !== id));

            const { error } = await supabase.from('jobs').delete().eq('id', id);
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Silme işlemi başarısız.");
            fetchData(); // Revert
        }
    };

    const handleToggleStatus = async (job: Job, checked: boolean) => {
        // Optimistic Update
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: checked } : j));

        try {
            const { error, data } = await supabase
                .from('jobs')
                .update({ is_active: checked })
                .eq('id', job.id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !checked } : j));
                alert("Durum güncellenemedi (Yetki sorunu olabilir).");
            }

        } catch (error) {
            console.error("Status update error:", error);
            // Revert
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !checked } : j));
        }
    };


    const handleAddNew = () => {
        setCurrentJob({ is_active: true, is_handicapped: false, work_type: 'Full-time' });
        setIsModalOpen(true);
    };

    const handleEdit = (job: Job) => {
        setCurrentJob(job);
        setIsModalOpen(true);
    };

    const handlePreview = (job: Job) => {
        setPreviewJob(job);
        setIsPreviewOpen(true);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">İlanlarım</h1>
                    <p className="text-slate-500 text-sm">İşe alım ilanlarını yönetin.</p>
                </div>
                <Button onClick={handleAddNew} className="bg-[#7e22ce] hover:bg-[#6b21a8] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Yeni İlan Oluştur
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <Card key={job.id} className={job.is_active ? 'border-t-4 border-t-[#7e22ce]' : 'opacity-75 bg-slate-50 border-t-4 border-t-slate-300'}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <CardTitle className="text-lg font-bold truncate text-slate-800" title={job.title}>{job.title}</CardTitle>
                                {job.is_handicapped && <span title="Engelli İlanı"><Accessibility className="w-5 h-5 text-blue-600 flex-shrink-0" /></span>}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handlePreview(job)} className="hover:text-blue-600" title="Ön İzle"><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(job)} className="hover:text-[#7e22ce]" title="Düzenle"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(job.id)} title="Sil"><Trash className="w-4 h-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-700">{job.company_name}</p>
                                <p className="text-xs text-slate-500">{job.location} • {job.work_type}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{job.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs cursor-pointer font-medium text-slate-600">Yayında</Label>
                                    <Switch checked={job.is_active || false} onCheckedChange={(c) => handleToggleStatus(job, c)} />
                                </div>
                                <Link href={`/admin/jobs/${job.id}`}>
                                    <Button size="sm" variant="outline" className="text-[#7e22ce] border-[#7e22ce] hover:bg-[#7e22ce] hover:text-white">Başvurular</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {jobs.length === 0 && <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">Henüz hiç ilan oluşturulmamış.</p>
                    <Button variant="link" onClick={handleAddNew} className="text-[#7e22ce]">İlk ilanı oluştur</Button>
                </div>}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentJob.id ? "İlanı Düzenle" : "Yeni İlan Oluştur"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2"><Label>İlan Başlığı</Label><Input value={currentJob.title || ''} onChange={e => setCurrentJob({ ...currentJob, title: e.target.value })} required placeholder="Örn: Yazılım Uzmanı" /></div>
                    <div className="space-y-2"><Label>Şirket Adı</Label><Input value={currentJob.company_name || ''} onChange={e => setCurrentJob({ ...currentJob, company_name: e.target.value })} required placeholder="Örn: Omuz Omuza" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Konum</Label><Input value={currentJob.location || ''} onChange={e => setCurrentJob({ ...currentJob, location: e.target.value })} placeholder="İstanbul, TR" /></div>
                        <div className="space-y-2">
                            <Label>Çalışma Şekli</Label>
                            <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-[#7e22ce]" value={currentJob.work_type || 'Full-time'} onChange={e => setCurrentJob({ ...currentJob, work_type: e.target.value })}>
                                <option value="Full-time">Tam Zamanlı</option>
                                <option value="Part-time">Yarı Zamanlı</option>
                                <option value="Remote">Uzaktan</option>
                                <option value="Hybrid">Hibrit</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2"><Label>Açıklama</Label><Textarea className="h-32" value={currentJob.description || ''} onChange={e => setCurrentJob({ ...currentJob, description: e.target.value })} required placeholder="İlan detayları..." /></div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded border border-slate-100 flex-1">
                            <Switch checked={currentJob.is_active || false} onCheckedChange={(c: boolean) => setCurrentJob({ ...currentJob, is_active: c })} />
                            <Label>İlan Yayına Alınsın mı?</Label>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-100 flex-1">
                            <Switch checked={currentJob.is_handicapped || false} onCheckedChange={(c: boolean) => setCurrentJob({ ...currentJob, is_handicapped: c })} />
                            <div className="flex items-center gap-1">
                                <Accessibility className="w-4 h-4 text-blue-600" />
                                <Label className="text-blue-900 font-medium">Engelli İlanı</Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving} className="bg-[#7e22ce] text-white hover:bg-[#6b21a8]">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>

            {/* Preview Modal */}
            <JobPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                job={previewJob}
            />
        </div>
    );
}
