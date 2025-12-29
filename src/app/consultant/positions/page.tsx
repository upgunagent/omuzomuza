"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { JobPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Briefcase, Search, Loader2, ArrowRight, Building2, Calendar, UserCheck } from "lucide-react";
import Link from "next/link";

export default function ConsultantPositionsPage() {
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        // Consultant can only see assigned positions thanks to RLS policy:
        // "Consultant can view assigned job positions" -> assigned_consultant_id = auth.uid()

        const { data: positionsData, error: positionsError } = await supabase
            .from('job_positions')
            .select(`
                *,
                companies (name)
            `)
            .order('created_at', { ascending: false });

        if (positionsError) console.error("Positions error:", positionsError);
        else setPositions(positionsData || []);

        setLoading(false);
    }

    const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'all'>('open');

    // Filter Logic
    const filteredPositions = positions.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.companies?.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'open') return p.status === 'open';
        if (activeTab === 'closed') return p.status === 'closed';
        return true; // 'all'
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A1B9A]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-[#6A1B9A]" />
                        Bana Atanan Pozisyonlar
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Yönetim sorumluluğu sizde olan açık pozisyonlar.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pozisyon veya Firma ara..."
                            className="pl-9 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'open' ? 'bg-white text-[#6A1B9A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Açık Pozisyonlar
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'closed' ? 'bg-white text-[#6A1B9A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Kapalı Pozisyonlar
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-[#6A1B9A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Tüm Pozisyonlar
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredPositions.map(position => (
                    <Card key={position.id} className="hover:shadow-md transition-shadow group overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <Building2 className="w-4 h-4" />
                                    <span className="font-medium text-slate-700">{position.companies?.name}</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <span className={position.status === 'open' ? "text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs" : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs"}>
                                        {position.status === 'open' ? 'AÇIK' : 'KAPALI'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{position.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                    <div className="flex items-center gap-1 text-[#6A1B9A] font-medium bg-[#6A1B9A]/5 px-2 py-0.5 rounded">
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Size Atandı
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(position.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href={`/consultant/positions/${position.id}`}>
                                    <Button variant="outline" className="group-hover:bg-[#6A1B9A] group-hover:text-white group-hover:border-[#6A1B9A] transition-colors">
                                        İncele & Aday Ekle <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredPositions.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                            {activeTab === 'open' ? 'Size atanan açık pozisyon bulunamadı.' :
                                activeTab === 'closed' ? 'Size atanan kapalı pozisyon bulunamadı.' :
                                    'Size atanan pozisyon bulunamadı.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
