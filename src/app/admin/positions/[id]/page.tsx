"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Company, JobPosition, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Save, ArrowLeft, Loader2, Building2, FileText, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdminPositionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [position, setPosition] = useState<JobPosition | null>(null);
    const [originalPosition, setOriginalPosition] = useState<JobPosition | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [consultants, setConsultants] = useState<Profile[]>([]);
    const [candidateCount, setCandidateCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        setLoading(true);

        // Fetch Position
        const { data: positionData, error: positionError } = await supabase
            .from('job_positions')
            .select('*, companies(name)')
            .eq('id', id)
            .single();

        if (positionError) {
            console.error(positionError);
            toast.error("Pozisyon bulunamadı.");
            router.push('/admin/positions');
            return;
        }

        setPosition(positionData);
        setOriginalPosition(positionData); // Store original for comparison

        // Fetch Candidate Count
        const { count } = await supabase
            .from('position_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('position_id', id);

        setCandidateCount(count || 0);

        // Fetch Companies
        const { data: companiesData } = await supabase.from('companies').select('*').order('name');
        setCompanies(companiesData || []);

        // Fetch Consultants
        const { data: consultantsData } = await supabase.from('profiles').select('*').eq('role', 'consultant').order('email');
        setConsultants(consultantsData || []);

        setLoading(false);
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!position) return;
        setSaving(true);

        const { error } = await supabase
            .from('job_positions')
            .update({
                company_id: position.company_id,
                title: position.title,
                requirements: position.requirements,
                benefits: position.benefits,
                assigned_consultant_id: position.assigned_consultant_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            toast.error("Güncelleme hatası: " + error.message);
        } else {
            toast.success("Pozisyon güncellendi.");

            // Check if consultant changed and is not empty/unassigned
            const newConsultantId = position.assigned_consultant_id;
            const oldConsultantId = originalPosition?.assigned_consultant_id;

            // If new consultant is assigned AND it is different from the old one
            if (newConsultantId && newConsultantId !== 'unassigned' && newConsultantId !== oldConsultantId) {
                // Find company name (either from joined data or companies list)
                // position.companies might be single object or array depending on query, but type says companies?: Company
                // In fetchData we have: select('*, companies(name)')
                // So position.companies.name should exist if type matches.
                // However, user might have changed company_id in the form too. 
                // Best to find from `companies` list to be sure we have the *new* company name if it changed.
                const company = companies.find(c => c.id === position.company_id);
                const companyName = company?.name || position.companies?.name || "Bilinmeyen Firma";

                fetch('/api/notifications/assign-position', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
                    },
                    body: JSON.stringify({
                        consultant_id: newConsultantId,
                        position_title: position.title,
                        company_name: companyName
                    })
                })
                    .then(async res => {
                        if (!res.ok) {
                            const errorData = await res.json();
                            console.error("Mail API Error:", errorData);
                            toast.error("Mail gönderilemedi: " + (errorData.error || "Sunucu hatası"));
                        } else {
                            toast.success("Yeni danışmana atama maili gönderildi.");
                        }
                    })
                    .catch(err => {
                        console.error("Mail trigger error", err);
                        toast.error("Mail gönderim hatası (Network).");
                    });
            }

            // Update original position to new state to prevent duplicate mails on subsequent saves
            setOriginalPosition(position);
        }
        setSaving(false);
    }

    async function toggleStatus() {
        if (!position) return;
        const newStatus = position.status === 'open' ? 'closed' : 'open';

        const { error } = await supabase
            .from('job_positions')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setPosition({ ...position, status: newStatus });
            toast.success(`Pozisyon durumu: ${newStatus === 'open' ? 'AÇIK' : 'KAPALI'}`);
        }
    }

    async function handleDelete() {
        if (!id) return;

        try {
            // 1. Delete associated candidates first (Manual Cascade)
            const { error: candidatesError } = await supabase
                .from('position_candidates')
                .delete()
                .eq('position_id', id);

            if (candidatesError) throw candidatesError;

            // 2. Delete the position itself
            const { error: positionError } = await supabase
                .from('job_positions')
                .delete()
                .eq('id', id);

            if (positionError) throw positionError;

            toast.success("Pozisyon ve bağlı adaylar başarıyla silindi.");
            router.push('/admin/positions');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error("Silme işlemi başarısız: " + error.message);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
        </div>
    );

    if (!position) return null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/positions">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">{position.title}</h1>
                    <p className="text-slate-500 text-sm">Pozisyon detaylarını düzenleyin ve atamaları yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={position.status === 'open' ? "destructive" : "default"} // Closed -> Open (Green/Default), Open -> Close (Red/Destructive)
                        onClick={toggleStatus}
                        className={position.status === 'closed' ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {position.status === 'open' ? 'Pozisyonu Kapat' : 'Pozisyonu Aç'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#1498e0]" /> Detaylar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Pozisyon Ünvanı</Label>
                                <Input value={position.title} onChange={e => setPosition({ ...position, title: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Aranılan Nitelikler & Görev Tanımı</Label>
                                <Textarea
                                    value={position.requirements || ''}
                                    onChange={e => setPosition({ ...position, requirements: e.target.value })}
                                    className="min-h-[150px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Firma Olanakları</Label>
                                <Textarea
                                    value={position.benefits || ''}
                                    onChange={e => setPosition({ ...position, benefits: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aday Takip Raporu Linki (Placeholder for next phase) */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3 text-blue-800">
                            <div className="bg-blue-100 p-2 rounded-full"><FileText className="w-5 h-5" /></div>
                            <div>
                                <h4 className="font-bold text-sm">Aday Takip Raporu</h4>
                                <p className="text-xs text-blue-600">Bu süreçteki adayları ve görüşme durumlarını inceleyin.</p>
                            </div>
                        </div>
                        <Link href={`/admin/positions/${position.id}/report`}>
                            <Button variant="outline" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                                Raporu Görüntüle
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#1498e0]" /> Firma & Danışman
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Firma</Label>
                                <Select
                                    onValueChange={(val) => setPosition({ ...position, company_id: val })}
                                    value={position.company_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Firma seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Atanan Danışman</Label>
                                <Select
                                    onValueChange={(val) => setPosition({ ...position, assigned_consultant_id: val })}
                                    value={position.assigned_consultant_id || "unassigned"}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Danışman seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Atama Yok</SelectItem>
                                        {consultants.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" disabled={saving} className="w-full bg-[#1498e0] hover:bg-[#0d8ad0] text-white mt-4">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
                            </Button>

                            <div className="pt-4 border-t mt-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4 mr-2" /> Pozisyonu Sil
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Pozisyonu silmek istediğinize emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu işlem geri alınamaz. Pozisyona bağlı <strong>{candidateCount}</strong> aday verileri de silinecektir.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
