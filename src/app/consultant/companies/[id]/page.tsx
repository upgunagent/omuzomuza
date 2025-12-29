"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Company, CompanyContact } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Loader2, User, Mail, Phone, Briefcase, Globe, MapPin, Hash, Plus, Save } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ConsultantCompanyDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [company, setCompany] = useState<Company | null>(null);
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Contact State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        full_name: "",
        title: "",
        email: "",
        phone: ""
    });
    const [contactSaving, setContactSaving] = useState(false);

    useEffect(() => {
        if (id) fetchCompanyDetails();
    }, [id]);

    async function fetchCompanyDetails() {
        setLoading(true);
        // Fetch Company
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();

        if (companyError) {
            console.error(companyError);
            return;
        }

        setCompany(companyData);

        // Fetch Contacts
        const { data: contactsData, error: contactsError } = await supabase
            .from('company_contacts')
            .select('*')
            .eq('company_id', id)
            .order('created_at', { ascending: true });

        if (contactsError) {
            console.error(contactsError);
        } else {
            setContacts(contactsData || []);
        }
        setLoading(false);
    }

    async function handleAddContact(e: React.FormEvent) {
        e.preventDefault();
        setContactSaving(true);

        const { data, error } = await supabase
            .from('company_contacts')
            .insert([{
                ...newContact,
                company_id: id
            }])
            .select()
            .single();

        if (error) {
            console.error(error);
            toast.error("Yetkili eklenemedi: " + error.message);
        } else {
            toast.success("Yetkili başarıyla eklendi.");
            setContacts(prev => [...prev, data]);
            setIsContactModalOpen(false);
            setNewContact({ full_name: "", title: "", email: "", phone: "" });
        }
        setContactSaving(false);
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#6A1B9A]" />
        </div>
    );

    if (!company) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/consultant/companies">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
                    <p className="text-slate-500 text-sm">Firma detay görüntüleme.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Taraf: Firma Bilgileri (Read Only) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#6A1B9A]" /> Genel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Firma Adı</label>
                                    <div className="text-slate-800 font-medium">{company.name}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ticari Ünvan</label>
                                    <div className="text-slate-800">{company.commercial_title || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Web Sitesi</label>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        {company.website ? (
                                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {company.website}
                                            </a>
                                        ) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sicil No</label>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Hash className="w-4 h-4 text-slate-400" />
                                        {company.registration_number || '-'}
                                    </div>
                                </div>
                                <div className="col-span-full">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Adres</label>
                                    <div className="flex items-start gap-2 text-slate-800">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                                        {company.address || '-'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Taraf: Yetkili Kişiler */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <User className="w-4 h-4 text-[#6A1B9A]" /> Yetkililer
                            </CardTitle>
                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-white border border-slate-200" onClick={() => setIsContactModalOpen(true)}>
                                <Plus className="w-4 h-4 text-[#6A1B9A]" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[600px]">
                            <div className="space-y-4">
                                {contacts.map(contact => (
                                    <div key={contact.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#6A1B9A]/30 transition-colors">
                                        <div className="font-bold text-slate-800 text-sm mb-1">{contact.full_name}</div>
                                        {contact.title && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                <Briefcase className="w-3 h-3" /> {contact.title}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                    <a href={`mailto:${contact.email}`} className="hover:text-[#6A1B9A]">{contact.email}</a>
                                                </div>
                                            )}
                                            {contact.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-400" /> {contact.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        Henüz yetkili eklenmemiş.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Yeni Yetkili Ekle">
                <form onSubmit={handleAddContact} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Ad Soyad *</Label>
                        <Input required value={newContact.full_name} onChange={e => setNewContact({ ...newContact, full_name: e.target.value })} placeholder="Örn: Ahmet Yılmaz" />
                    </div>
                    <div className="space-y-2">
                        <Label>Ünvan</Label>
                        <Input value={newContact.title} onChange={e => setNewContact({ ...newContact, title: e.target.value })} placeholder="İK Müdürü" />
                    </div>
                    <div className="space-y-2">
                        <Label>E-posta</Label>
                        <Input type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="ahmet@firma.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="0555 555 55 55" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={contactSaving} className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white">
                            {contactSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Plus className="w-4 h-4 mr-2" /> Ekle</>}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
