"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeLanguage } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Globe, Loader2 } from "lucide-react";

interface LanguageSectionProps {
    candidateId?: string;
}

export function LanguageSection({ candidateId }: LanguageSectionProps) {
    const [items, setItems] = useState<ResumeLanguage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeLanguage>>({});
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
            const { data } = await supabase.from('resume_language').select('*').eq('candidate_id', targetId);
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() { setCurrentItem({}); setIsModalOpen(true); }
    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_language').delete().eq('id', id);
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
        const { data, error } = await supabase.from('resume_language').upsert(payload).select().single();
        if (error) {
            console.error("Error saving language:", error);
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
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Diller</CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                        <span className="font-semibold">{item.language_name}</span>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">{item.level}</span>
                            <button onClick={() => handleDelete(item.id!)} className="text-red-500 hover:text-red-700"><Trash className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-slate-500 py-4 text-center">Henüz dil eklenmemiş.</p>}
            </CardContent>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Dil Ekle">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Dil</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={currentItem.language_name || ''}
                            onChange={e => setCurrentItem({ ...currentItem, language_name: e.target.value })}
                            required
                        >
                            <option value="">Seçiniz...</option>
                            <option value="İngilizce">İngilizce</option>
                            <option value="Almanca">Almanca</option>
                            <option value="Arapça">Arapça</option>
                            <option value="Bengalce">Bengalce</option>
                            <option value="Çince (Mandarin)">Çince (Mandarin)</option>
                            <option value="Endonezce">Endonezce</option>
                            <option value="Fransızca">Fransızca</option>
                            <option value="Hintçe">Hintçe</option>
                            <option value="İspanyolca">İspanyolca</option>
                            <option value="İtalyanca">İtalyanca</option>
                            <option value="Japonca">Japonca</option>
                            <option value="Korece">Korece</option>
                            <option value="Marathi">Marathi</option>
                            <option value="Portekizce">Portekizce</option>
                            <option value="Rusça">Rusça</option>
                            <option value="Svahili">Svahili</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Teluguca">Teluguca</option>
                            <option value="Türkçe">Türkçe</option>
                            <option value="Urduca">Urduca</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Seviye</Label>
                        <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={currentItem.level || ''} onChange={e => setCurrentItem({ ...currentItem, level: e.target.value })} required>
                            <option value="">Seçiniz...</option>
                            <option value="Başlangıç">Başlangıç</option>
                            <option value="Orta">Orta</option>
                            <option value="İleri">İleri</option>
                            <option value="Anadil">Anadil</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>
        </Card>
    );
}
