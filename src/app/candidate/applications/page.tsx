"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Application, Job } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Calendar, Clock, AlertCircle } from "lucide-react";

export default function CandidateApplicationsPage() {
    const [applications, setApplications] = useState<(Application & { jobs: Job })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let subscription: any;

        const fetchDataAndSubscribe = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Initial fetch
                await fetchApps(user.id);

                // Set up Realtime subscription
                subscription = supabase
                    .channel('public:applications')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'applications',
                            filter: `candidate_id=eq.${user.id}`
                        },
                        (payload) => {
                            console.log('Realtime update received:', payload);
                            // Refresh data on any update to my applications
                            fetchApps(user.id);
                        }
                    )
                    .subscribe();
            }
            setLoading(false);
        };

        fetchDataAndSubscribe();

        return () => {
            if (subscription) supabase.removeChannel(subscription);
        };
    }, []);

    async function fetchApps(userId: string) {
        const { data, error } = await supabase
            .from('applications')
            .select('*, jobs(*)')
            .eq('candidate_id', userId)
            .order('created_at', { ascending: false });

        if (data) setApplications(data as any);
        if (error) console.error(error);
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'accepted': return 'success'; // Green
            case 'rejected': return 'destructive'; // Red
            case 'reviewed': return 'default'; // Blue-ish or Primary
            case 'interviewing': return 'secondary'; // Purple-ish usually or secondary
            case 'offered': return 'default'; // Indigo-ish (using default for now, badge variants are limited)
            default: return 'outline'; // Yellow/Warning equivalent if outline is styled or use specific classes
        }
    }

    // Custom styles for badges since standard variants are limited
    function getBadgeStyle(status: string) {
        switch (status) {
            case 'accepted': return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200";
            case 'rejected': return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
            case 'reviewed': return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
            case 'interviewing': return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
            case 'offered': return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200";
            default: return "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"; // pending
        }
    }

    function getStatusLabel(status: string) {
        switch (status) {
            case 'accepted': return 'Kabul Edildi';
            case 'rejected': return 'Reddedi';
            case 'reviewed': return 'İncelendi';
            case 'interviewing': return 'Mülakat';
            case 'offered': return 'Teklif';
            default: return 'Bekliyor';
        }
    }

    if (loading && applications.length === 0) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Başvurularım</h1>
                <p className="text-slate-500">İş başvurularınızın güncel durumunu takip edin.</p>
            </div>

            <div className="grid gap-4">
                {applications.map(app => (
                    <Card key={app.id}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-4">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800">{app.jobs?.title}</h3>
                                <p className="text-slate-600 font-medium">{app.jobs?.company_name}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {app.jobs?.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {app.jobs?.work_type}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Başvuru: {new Date(app.created_at).toLocaleDateString("tr-TR")}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Durum:</span>
                                <Badge variant="outline" className={`text-sm px-3 py-1 font-bold border ${getBadgeStyle(app.status)}`}>
                                    {getStatusLabel(app.status)}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                ))}
                {!loading && applications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
                        <p>Henüz hiçbir ilana başvurmadınız.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
