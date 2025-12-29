"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Building2, Search, Plus, MapPin, Globe, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Company Form State
    const [newCompany, setNewCompany] = useState({
        name: "",
        commercial_title: "",
        address: "",
        website: "",
        registration_number: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    async function fetchCompanies() {
        setLoading(true);
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("Error fetching companies:", error);
            toast.error("Firmalar yüklenirken hata oluştu.");
        } else {
            setCompanies(data || []);
        }
        setLoading(false);
    }

    async function handleAddCompany(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("Oturum hatası.");
            setIsSubmitting(false);
            return;
        }

        const { data, error } = await supabase
            .from('companies')
            .insert([{
                ...newCompany,
                created_by: user.id
            }])
            .select()
            .single();

        if (error) {
            console.error("Error adding company:", error);
            toast.error("Firma eklenirken hata oluştu.");
        } else {
            toast.success("Firma başarıyla eklendi.");
            setCompanies(prev => [...prev, data]);
            setIsAddModalOpen(false);
            setNewCompany({ name: "", commercial_title: "", address: "", website: "", registration_number: "" });
        }
        setIsSubmitting(false);
    }

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.commercial_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <Building2 className="w-6 h-6 text-[#6A1B9A]" />
                        Firma İndeksi
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Sistemdeki tüm kurumsal müşterileri yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Firma ara..."
                            className="pl-9 w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Firma
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map(company => (
                    <Card key={company.id} className="hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#6A1B9A]" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-start justify-between">
                                <span className="truncate" title={company.name}>{company.name}</span>
                            </CardTitle>
                            {company.commercial_title && (
                                <p className="text-xs text-slate-500 truncate" title={company.commercial_title}>{company.commercial_title}</p>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm text-slate-600">
                                {company.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 truncate block max-w-[200px]">
                                            {company.website}
                                        </a>
                                    </div>
                                )}
                                {company.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2 text-xs leading-relaxed">{company.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Link href={`/admin/companies/${company.id}`}>
                                    <Button size="sm" variant="outline" className="group-hover:bg-[#6A1B9A] group-hover:text-white group-hover:border-[#6A1B9A] transition-colors">
                                        Detaylar <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Firma bulunamadı.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Firma Ekle">
                <form onSubmit={handleAddCompany} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Firma Adı *</Label>
                        <Input required value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="Örn: Acme A.Ş." />
                    </div>
                    <div className="space-y-2">
                        <Label>Ticari Ünvan</Label>
                        <Input value={newCompany.commercial_title} onChange={e => setNewCompany({ ...newCompany, commercial_title: e.target.value })} placeholder="Resmi tam ünvan" />
                    </div>
                    <div className="space-y-2">
                        <Label>Web Sitesi</Label>
                        <Input value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} placeholder="www.acme.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Adres</Label>
                        <Input value={newCompany.address} onChange={e => setNewCompany({ ...newCompany, address: e.target.value })} placeholder="Açık adres" />
                    </div>
                    <div className="space-y-2">
                        <Label>Sicil No</Label>
                        <Input value={newCompany.registration_number} onChange={e => setNewCompany({ ...newCompany, registration_number: e.target.value })} />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting} className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Plus className="w-4 h-4 mr-2" /> Ekle</>}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
