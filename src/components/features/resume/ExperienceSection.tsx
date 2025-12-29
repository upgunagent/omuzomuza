"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeExperience } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Pencil, Loader2, Briefcase } from "lucide-react";

// ... imports

interface ExperienceSectionProps {
    candidateId?: string;
}

export function ExperienceSection({ candidateId }: ExperienceSectionProps) {
    const [items, setItems] = useState<ResumeExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeExperience>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('resume_experience').select('*').eq('candidate_id', user.id).order('start_date', { ascending: false });
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() { setCurrentItem({}); setIsModalOpen(true); }
    function handleEdit(item: ResumeExperience) { setCurrentItem(item); setIsModalOpen(true); }
    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_experience').delete().eq('id', id);
        if (!error) setItems(items.filter(i => i.id !== id));
    }
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Lütfen giriş yapın.");
            setSaving(false);
            return;
        }

        const payload = { ...currentItem, candidate_id: user.id };

        // Use singular table name 'resume_experience'
        const { data, error } = await supabase.from('resume_experience').upsert(payload).select().single();

        if (error) {
            console.error("Save error:", error);
            alert(`Kaydetme hatası: ${error.message}`);
        } else if (data) {
            if (currentItem.id) {
                setItems(items.map(i => i.id === data.id ? data : i));
            } else {
                setItems([data, ...items]);
            }
            setIsModalOpen(false);
        }
        setSaving(false);
    }

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> İş Deneyimi
                </CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.length === 0 ? <p className="text-slate-500 text-center py-8">Henüz deneyim eklenmemiş.</p> : items.map(item => (
                    <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg bg-slate-50">
                        <div>
                            <h4 className="font-semibold">{item.position}</h4>
                            <p className="text-sm font-medium text-slate-700">{item.company_name}</p>
                            <p className="text-xs text-slate-400 mb-2">
                                {item.start_date} - {item.is_continued ? 'Devam Ediyor' : item.end_date}
                            </p>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id!)}><Trash className="w-4 h-4" /></Button>
                        </div>
                    </div>
                ))
                }
            </CardContent>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentItem.id ? "Deneyim Düzenle" : "Deneyim Ekle"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2"><Label>Şirket Adı</Label><Input value={currentItem.company_name || ''} onChange={e => setCurrentItem({ ...currentItem, company_name: e.target.value })} required placeholder="Buraya çalıştığınız şirketin tam adını yazın..." /></div>
                    <div className="space-y-2"><Label>Pozisyon</Label><Input value={currentItem.position || ''} onChange={e => setCurrentItem({ ...currentItem, position: e.target.value })} required placeholder="Şirkette görev aldığınız pozisyon adını girin. Örneğin Muhasebe Uzmanı.." /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Başlangıç Tarihi</Label><Input type="date" value={currentItem.start_date || ''} onChange={e => setCurrentItem({ ...currentItem, start_date: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Bitiş Tarihi</Label><Input type="date" value={currentItem.end_date || ''} onChange={e => setCurrentItem({ ...currentItem, end_date: e.target.value })} disabled={currentItem.is_continued} /></div>
                    </div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="cont_exp" checked={currentItem.is_continued || false} onChange={e => setCurrentItem({ ...currentItem, is_continued: e.target.checked })} /><Label htmlFor="cont_exp">Halen burada çalışıyorum</Label></div>
                    <div className="space-y-2"><Label>Açıklama</Label><Textarea value={currentItem.description || ''} onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })} placeholder="Firmada üstlendiğiniz görev tanımını ve yaptığınız işleri detaylarıyla yazın..." /></div>
                    <div className="flex justify-end pt-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button></div>
                </form>
            </Modal>
        </Card>
    );
}
