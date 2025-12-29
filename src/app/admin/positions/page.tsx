"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company, JobPosition, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Search, Plus, Loader2, ArrowRight, Building2, User, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminPositionsPage() {
    const [positions, setPositions] = useState<JobPosition[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [consultants, setConsultants] = useState<Profile[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'all'>('open');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Position Form State
    const [newPosition, setNewPosition] = useState({
        company_id: "",
        title: "",
        requirements: "",
        benefits: "",
        assigned_consultant_id: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);

        // Fetch Positions with relations
        const { data: positionsData, error: positionsError } = await supabase
            .from('job_positions')
            .select(`
                *,
                companies (name),
                profiles:profiles!assigned_consultant_id (id, first_name, last_name, email)
            `)
            .order('created_at', { ascending: false });

        if (positionsError) console.error("Positions error:", positionsError);
        else setPositions(positionsData || []);

        // Fetch Companies for dropdown
        const { data: companiesData } = await supabase
            .from('companies')
            .select('*')
            .order('name');
        setCompanies(companiesData || []);

        // Fetch Consultants for dropdown
        const { data: consultantsData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'consultant')
            .order('email'); // or name if available
        setConsultants(consultantsData || []);

        setLoading(false);
    }

    async function handleAddPosition(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Oturum hatası.");
            setIsSubmitting(false);
            return;
        }

        console.log('Submission Payload:', newPosition);

        const { data, error } = await supabase
            .from('job_positions')
            .insert([{
                company_id: newPosition.company_id,
                title: newPosition.title,
                requirements: newPosition.requirements,
                benefits: newPosition.benefits,
                assigned_consultant_id: newPosition.assigned_consultant_id || null,
                created_by: user.id,
                status: 'open'
            }])
            .select(`
                *,
                companies (name),
                profiles:profiles!assigned_consultant_id (id, first_name, last_name, email)
            `)
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            toast.error("Hata: " + error.message);
        } else {
            toast.success("Pozisyon başarıyla oluşturuldu.");
            setPositions(prev => [data, ...prev]);
            setIsAddModalOpen(false);

            // Trigger email notification if consultant is assigned
            if (newPosition.assigned_consultant_id) {
                const selectedCompany = companies.find(c => c.id === newPosition.company_id);
                if (selectedCompany) {
                    toast.info("Mail gönderimi başlatılıyor...");
                    fetch('/api/notifications/assign-position', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
                        },
                        body: JSON.stringify({
                            consultant_id: newPosition.assigned_consultant_id,
                            position_title: newPosition.title,
                            company_name: selectedCompany.name
                        })
                    }).then(async res => {
                        if (!res.ok) {
                            const errData = await res.json();
                            console.error("Mail API Error:", errData);
                            toast.error("Mail Hatası: " + (errData.error || "Bilinmeyen hata"));
                        } else {
                            toast.success("Bilgilendirme maili gönderildi.");
                        }
                    }).catch(err => {
                        console.error("Mail trigger error", err);
                        toast.error("Mail sunucusuna erişilemedi.");
                    });
                }
            }

            setNewPosition({ company_id: "", title: "", requirements: "", benefits: "", assigned_consultant_id: "" });
        }
        setIsSubmitting(false);
    }

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
            <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-[#1498e0]" />
                        Pozisyonlar
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Firmalar için açılan pozisyonları ve atamaları yönetin.</p>
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
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Pozisyon
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'open' ? 'bg-white text-[#1498e0] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Açık Pozisyonlar
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'closed' ? 'bg-white text-[#1498e0] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Kapalı Pozisyonlar
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-[#1498e0] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                                    <div className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        Atanan: <span className="text-slate-700 font-medium ml-1">
                                            {position.profiles ?
                                                (position.profiles.first_name ? `${position.profiles.first_name} ${position.profiles.last_name || ''}` : position.profiles.email)
                                                : 'Atanmamış'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(position.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href={`/admin/positions/${position.id}`}>
                                    <Button variant="outline" className="group-hover:bg-[#1498e0] group-hover:text-white group-hover:border-[#1498e0] transition-colors">
                                        İncele <ArrowRight className="w-4 h-4 ml-2" />
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
                            {activeTab === 'open' ? 'Açık pozisyon bulunamadı.' :
                                activeTab === 'closed' ? 'Kapalı pozisyon bulunamadı.' :
                                    'Pozisyon bulunamadı.'}
                        </p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Pozisyon Aç">
                <form onSubmit={handleAddPosition} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Firma Seçimi *</Label>
                        <Select onValueChange={(val) => setNewPosition({ ...newPosition, company_id: val })} value={newPosition.company_id} required>
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
                        <Label>Pozisyon Ünvanı *</Label>
                        <Input required value={newPosition.title} onChange={e => setNewPosition({ ...newPosition, title: e.target.value })} placeholder="Örn: Senior Frontend Developer" />
                    </div>

                    <div className="space-y-2">
                        <Label>Aranılan Nitelikler & Görev Tanımı</Label>
                        <Textarea
                            value={newPosition.requirements}
                            onChange={e => setNewPosition({ ...newPosition, requirements: e.target.value })}
                            placeholder="Pozisyonun gereklilikleri ve yapılacak işler..."
                            className="h-24"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Firma Olanakları</Label>
                        <Textarea
                            value={newPosition.benefits}
                            onChange={e => setNewPosition({ ...newPosition, benefits: e.target.value })}
                            placeholder="Yan haklar, maaş aralığı, çalışma modeli..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Danışman Ata</Label>
                        <Select onValueChange={(val) => setNewPosition({ ...newPosition, assigned_consultant_id: val })} value={newPosition.assigned_consultant_id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Danışman seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {consultants.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting} className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Plus className="w-4 h-4 mr-2" /> Pozisyon Oluştur</>}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
