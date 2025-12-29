"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeSkill } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Star, Loader2 } from "lucide-react";

interface SkillSectionProps {
    candidateId?: string;
}

export function SkillSection({ candidateId }: SkillSectionProps) {
    const [items, setItems] = useState<ResumeSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeSkill>>({});
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
            const { data } = await supabase.from('resume_skill').select('*').eq('candidate_id', targetId);
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() { setCurrentItem({}); setIsModalOpen(true); }
    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_skill').delete().eq('id', id);
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
        const { data, error } = await supabase.from('resume_skill').upsert(payload).select().single();
        if (error) {
            console.error("Error saving skill:", error);
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
                <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Yetenekler</CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <span className="font-medium text-sm">{item.skill_name}</span>
                            <button onClick={() => handleDelete(item.id!)} className="text-slate-400 hover:text-red-500"><Trash className="w-3 h-3" /></button>
                        </div>
                    ))}
                    {items.length === 0 && <p className="text-slate-500">Henüz yetenek eklenmemiş.</p>}
                </div>
            </CardContent>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yetenek Ekle">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2"><Label>Yetenek Adı</Label><Input value={currentItem.skill_name || ''} onChange={e => setCurrentItem({ ...currentItem, skill_name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Kategori</Label><Input value={currentItem.category || ''} placeholder="Örn: Yazılım, Sosyal" onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })} /></div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>
        </Card>
    );
}
