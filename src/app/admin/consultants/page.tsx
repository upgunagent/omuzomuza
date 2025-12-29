"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Shield, UserCog, Mail, Loader2, AlertCircle } from "lucide-react";

export default function AdminConsultantsPage() {
    const [consultants, setConsultants] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newConsultant, setNewConsultant] = useState({ email: '', password: '', first_name: '', last_name: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchConsultants();
    }, []);

    async function fetchConsultants() {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'consultant')
            .order('created_at', { ascending: false });

        if (data) setConsultants(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Bu danışmanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Oturum süreniz dolmuş.");

            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: id })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Silme işlemi başarısız.");
            }

            setConsultants(consultants.filter(c => c.id !== id));
            alert("Danışman başarıyla silindi.");

        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Silme işlemi sırasında hata oluştu: " + error.message);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Oturum süreniz dolmuş.");

            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: newConsultant.email,
                    password: newConsultant.password,
                    first_name: newConsultant.first_name,
                    last_name: newConsultant.last_name
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Oluşturma işlemi başarısız.");
            }

            alert("Danışman başarıyla oluşturuldu.");
            setIsModalOpen(false);
            setNewConsultant({ email: '', password: '', first_name: '', last_name: '' });
            fetchConsultants(); // Refresh list

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Danışman Yönetimi</h1>
                    <p className="text-slate-500">İK Danışmanlarını ekleyin ve yönetin.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Danışman Ekle
                </Button>
            </div>

            <div className="grid gap-4">
                {consultants.map(consultant => (
                    <div key={consultant.id} className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-[#1498e0]">
                                <UserCog className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-lg">
                                    {(consultant.first_name || consultant.last_name)
                                        ? `${consultant.first_name || ''} ${consultant.last_name || ''}`
                                        : consultant.email}
                                </div>
                                {(consultant.first_name || consultant.last_name) && (
                                    <div className="text-sm text-slate-500">{consultant.email}</div>
                                )}
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <Shield className="w-3 h-3" /> İK Danışmanı
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-sm text-slate-500 mr-4">
                                Kayıt: {new Date(consultant.created_at).toLocaleDateString('tr-TR')}
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(consultant.id)}>
                                <Trash className="w-4 h-4 mr-2" /> Sil
                            </Button>
                        </div>
                    </div>
                ))}
                {consultants.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Henüz tanımlı danışman yok.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Danışman Ekle">
                <form onSubmit={handleCreate} className="space-y-4">



                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ad *</Label>
                            <Input placeholder="Ad" value={newConsultant.first_name} onChange={e => setNewConsultant({ ...newConsultant, first_name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Soyad *</Label>
                            <Input placeholder="Soyad" value={newConsultant.last_name} onChange={e => setNewConsultant({ ...newConsultant, last_name: e.target.value })} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>E-posta Adresi *</Label>
                        <Input type="email" placeholder="danisman@sirket.com" value={newConsultant.email} onChange={e => setNewConsultant({ ...newConsultant, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Geçici Şifre</Label>
                        <Input type="password" placeholder="******" value={newConsultant.password} onChange={e => setNewConsultant({ ...newConsultant, password: e.target.value })} required />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white">
                            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Ekle
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
