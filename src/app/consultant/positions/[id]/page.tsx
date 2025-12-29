"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { JobPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ArrowLeft, Loader2, Building2, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ConsultantPositionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [position, setPosition] = useState<JobPosition | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        setLoading(true);

        const { data, error } = await supabase
            .from('job_positions')
            .select(`
                *,
                companies (name)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
            toast.error("Pozisyon bulunamadı veya erişim yetkiniz yok.");
            router.push('/consultant/positions');
            return;
        }

        setPosition(data);
        if (data.companies) setCompanyName(data.companies.name);
        setLoading(false);
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
        </div>
    );

    if (!position) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/consultant/positions">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {position.title}
                        {position.status === 'open' ?
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 ml-2">AÇIK</span> :
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 ml-2">KAPALI</span>
                        }
                    </h1>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                        <Building2 className="w-3 h-3" /> {companyName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#1498e0]" /> Pozisyon Detayları
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">Aranılan Nitelikler ve Görev Tanımı</h3>
                                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                    {position.requirements || 'Belirtilmemiş.'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-900 mb-1">Firma Olanakları</h3>
                                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                    {position.benefits || 'Belirtilmemiş.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Actions */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-[#1498e0] text-white p-6 rounded-lg shadow-lg">
                        <h3 className="font-bold text-lg mb-2">İşlemler</h3>
                        <p className="text-white/80 text-sm mb-6">Bu pozisyon için aday sürecinizi yönetin.</p>

                        <div className="space-y-3">
                            <Link href={`/consultant/positions/${position.id}/add-candidate`}>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                                    <UserPlus className="w-4 h-4 mr-2" /> Pozisyona Aday Gir
                                </Button>
                            </Link>

                            <Link href={`/consultant/positions/${position.id}/report`}>
                                <Button className="w-full bg-white text-[#1498e0] hover:bg-white/90 border border-white/20 font-bold">
                                    <FileText className="w-4 h-4 mr-2" /> Aday Takip Raporu
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm text-slate-900">Danışman Ataması Aktif</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Bu pozisyon size {new Date(position.created_at).toLocaleDateString('tr-TR')} tarihinde atanmıştır.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
