"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeCertification } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Award, Loader2 } from "lucide-react";

interface CertificationSectionProps {
    candidateId?: string;
}

export function CertificationSection({ candidateId }: CertificationSectionProps) {
    const [items, setItems] = useState<ResumeCertification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeCertification>>({});
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
            const { data } = await supabase.from('resume_certification').select('*').eq('candidate_id', targetId);
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() { setCurrentItem({}); setIsModalOpen(true); }
    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_certification').delete().eq('id', id);
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
        const { data, error } = await supabase.from('resume_certification').upsert(payload).select().single();
        if (error) {
            console.error("Error saving certification:", error);
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
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Sertifikalar</CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-600">{item.institution} ({item.date})</p>
                        </div>
                        <button onClick={() => handleDelete(item.id!)} className="text-red-500 hover:text-red-700"><Trash className="w-4 h-4" /></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-slate-500 py-4 text-center">Henüz sertifika eklenmemiş.</p>}
            </CardContent>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sertifika Ekle">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2"><Label>Sertifika Adı</Label><Input value={currentItem.name || ''} onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Kurum</Label><Input value={currentItem.institution || ''} onChange={e => setCurrentItem({ ...currentItem, institution: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Tarih</Label><Input type="date" value={currentItem.date || ''} onChange={e => setCurrentItem({ ...currentItem, date: e.target.value })} /></div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>
        </Card>
    );
}
