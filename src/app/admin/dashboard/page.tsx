"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yönetim Paneli</h1>
            <p className="mt-2 text-slate-600">Sistem aktivitesine genel bakış.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Toplam İlan</h3>
                    {loading ? (
                        <div className="flex items-center mt-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <p className="text-3xl font-bold mt-2">{stats.totalJobs}</p>
                    )}
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Aktif Adaylar</h3>
                    {loading ? (
                        <div className="flex items-center mt-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <p className="text-3xl font-bold mt-2">{stats.activeCandidates}</p>
                    )}
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Bekleyen Başvurular</h3>
                    {loading ? (
                        <div className="flex items-center mt-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <p className="text-3xl font-bold mt-2">{stats.pendingApplications}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
