"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Company, CompanyContact } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Building2, Save, Trash2, ArrowLeft, Loader2, Plus, User, Mail, Phone, Briefcase } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminCompanyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [company, setCompany] = useState<Company | null>(null);
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Add Contact Modal State
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
            toast.error("Firma bilgileri alınamadı.");
            router.push('/admin/companies');
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

    async function handleUpdateCompany(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;

        setSaving(true);
        const { error } = await supabase
            .from('companies')
            .update({
                name: company.name,
                commercial_title: company.commercial_title,
                address: company.address,
                website: company.website,
                registration_number: company.registration_number,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            toast.error("Güncelleme hatası: " + error.message);
        } else {
            toast.success("Firma bilgileri güncellendi.");
        }
        setSaving(false);
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
            toast.error("Yetkili eklenemedi: " + error.message);
        } else {
            toast.success("Yetkili eklendi.");
            setContacts(prev => [...prev, data]);
            setIsContactModalOpen(false);
            setNewContact({ full_name: "", title: "", email: "", phone: "" });
        }
        setContactSaving(false);
    }

    async function handleDeleteContact(contactId: string) {
        if (!confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;

        const { error } = await supabase
            .from('company_contacts')
            .delete()
            .eq('id', contactId);

        if (error) {
            toast.error("Silme hatası.");
        } else {
            setContacts(prev => prev.filter(c => c.id !== contactId));
            toast.success("Kişi silindi.");
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
        </div>
    );

    if (!company) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/companies">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
                    <p className="text-slate-500 text-sm">Firma detaylarını ve yetkililerini yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Taraf: Firma Bilgileri Formu */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#1498e0]" /> Genel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUpdateCompany} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Firma Adı</Label>
                                        <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ticari Ünvan</Label>
                                        <Input value={company.commercial_title || ''} onChange={e => setCompany({ ...company, commercial_title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Web Sitesi</Label>
                                        <Input value={company.website || ''} onChange={e => setCompany({ ...company, website: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sicil No</Label>
                                        <Input value={company.registration_number || ''} onChange={e => setCompany({ ...company, registration_number: e.target.value })} />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <Label>Adres</Label>
                                        <Input value={company.address || ''} onChange={e => setCompany({ ...company, address: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={saving} className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet</>}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Taraf: Yetkili Kişiler */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <User className="w-4 h-4 text-[#1498e0]" /> Yetkililer
                            </CardTitle>
                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-white border border-slate-200" onClick={() => setIsContactModalOpen(true)}>
                                <Plus className="w-4 h-4 text-[#1498e0]" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[600px]">
                            <div className="space-y-4">
                                {contacts.map(contact => (
                                    <div key={contact.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#1498e0]/30 transition-colors relative group">
                                        <button
                                            onClick={() => handleDeleteContact(contact.id)}
                                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="font-bold text-slate-800 text-sm mb-1">{contact.full_name}</div>
                                        {contact.title && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                <Briefcase className="w-3 h-3" /> {contact.title}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {contact.email}
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
                        <Button type="submit" disabled={contactSaving} className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                            {contactSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Plus className="w-4 h-4 mr-2" /> Ekle</>}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
