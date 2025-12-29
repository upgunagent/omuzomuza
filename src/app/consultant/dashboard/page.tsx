"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Users, FileText, Briefcase } from "lucide-react";

export default function ConsultantDashboard() {
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeCandidates: 0,
        pendingApplications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);

        // Fetch all statistics in parallel
        const [
            { count: jobsCount },
            { count: candidatesCount },
            { count: pendingCount }
        ] = await Promise.all([
            supabase.from('jobs').select('*', { count: 'exact', head: true }),
            supabase.from('candidates').select('*', { count: 'exact', head: true }),
            supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        setStats({
            totalJobs: jobsCount || 0,
            activeCandidates: candidatesCount || 0,
            pendingApplications: pendingCount || 0
        });
        setLoading(false);
    }

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Danışman Paneli</h1>
            <p className="mt-2 text-slate-600">İşe alım süreçlerinin güncel durumu.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Aktif Adaylar</p>
                            {loading ? (
                                <Loader2 className="w-5 h-5 mt-2 animate-spin text-slate-400" />
                            ) : (
                                <h3 className="text-3xl font-bold mt-2 text-slate-900">{stats.activeCandidates}</h3>
                            )}
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-slate-500">
                        <span className="text-green-600 font-medium flex items-center gap-1">
                            %12
                        </span>
                        <span className="ml-1">geçen aya göre artış</span>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Bekleyen Başvurular</p>
                            {loading ? (
                                <Loader2 className="w-5 h-5 mt-2 animate-spin text-slate-400" />
                            ) : (
                                <h3 className="text-3xl font-bold mt-2 text-slate-900">{stats.pendingApplications}</h3>
                            )}
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-slate-500">
                        <span className="text-orange-600 font-medium flex items-center gap-1">
                            5 yeni
                        </span>
                        <span className="ml-1">bugün gelen başvuru</span>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Açık İlanlar</p>
                            {loading ? (
                                <Loader2 className="w-5 h-5 mt-2 animate-spin text-slate-400" />
                            ) : (
                                <h3 className="text-3xl font-bold mt-2 text-slate-900">{stats.totalJobs}</h3>
                            )}
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-slate-500">
                        <span className="text-slate-400">Tüm pozisyonlar aktif</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 h-80 flex items-center justify-center text-slate-400">
                    Grafik Alanı (Yakında)
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 h-80 flex items-center justify-center text-slate-400">
                    Son Aktiviteler (Yakında)
                </div>
            </div>
        </div>
    );
}
