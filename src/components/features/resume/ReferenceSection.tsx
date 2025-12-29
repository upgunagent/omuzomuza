"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeReference } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Users, Loader2 } from "lucide-react";

interface ReferenceSectionProps {
    candidateId?: string;
}

export function ReferenceSection({ candidateId }: ReferenceSectionProps) {
    const [items, setItems] = useState<ResumeReference[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeReference>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchItems(); }, []);

    async function fetchItems() {
        setLoading(true);
        let targetId = candidateId;

        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }

        if (targetId) {
            const { data } = await supabase.from('resume_reference').select('*').eq('candidate_id', targetId);
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() { setCurrentItem({}); setIsModalOpen(true); }
    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_reference').delete().eq('id', id);
        if (!error) setItems(items.filter(i => i.id !== id));
    }
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        let targetId = candidateId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }

        if (!targetId) return;

        const payload = { ...currentItem, candidate_id: targetId };
        // Use singular table name
        const { data, error } = await supabase.from('resume_reference').upsert(payload).select().single();
        if (error) {
            console.error("Error saving reference:", error);
            alert(`Kaydetme hatası: ${error.message}`);
        } else if (data) {
            setItems([...items, data]);
            setIsModalOpen(false);
        }
        setSaving(false);
    }

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Referanslar</CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                        <div>
                            <p className="font-semibold">{item.full_name}</p>
                            <p className="text-sm text-slate-600">{item.position} - {item.company}</p>
                            <p className="text-xs text-slate-400">{item.phone} | {item.email}</p>
                        </div>
                        <button onClick={() => handleDelete(item.id!)} className="text-red-500 hover:text-red-700"><Trash className="w-4 h-4" /></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-slate-500 py-4 text-center">Henüz referans eklenmemiş.</p>}
            </CardContent>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Referans Ekle">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2"><Label>Ad Soyad</Label><Input value={currentItem.full_name || ''} onChange={e => setCurrentItem({ ...currentItem, full_name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Şirket</Label><Input value={currentItem.company || ''} onChange={e => setCurrentItem({ ...currentItem, company: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Pozisyon</Label><Input value={currentItem.position || ''} onChange={e => setCurrentItem({ ...currentItem, position: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Telefon</Label><Input value={currentItem.phone || ''} onChange={e => setCurrentItem({ ...currentItem, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>E-posta</Label><Input type="email" value={currentItem.email || ''} onChange={e => setCurrentItem({ ...currentItem, email: e.target.value })} /></div>
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>
        </Card>
    );
}
