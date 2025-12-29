"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeEducation } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Pencil, Loader2, GraduationCap } from "lucide-react";

// ... imports

interface EducationSectionProps {
    candidateId?: string;
}

export function EducationSection({ candidateId }: EducationSectionProps) {
    const [items, setItems] = useState<ResumeEducation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ResumeEducation>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        setLoading(true);
        let targetId = candidateId;

        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }

        if (targetId) {
            const { data } = await supabase
                .from('resume_education')
                .select('*')
                .eq('candidate_id', targetId)
                .order('start_date', { ascending: false });
            if (data) setItems(data);
        }
        setLoading(false);
    }

    function handleAddNew() {
        setCurrentItem({});
        setIsModalOpen(true);
    }

    function handleEdit(item: ResumeEducation) {
        setCurrentItem(item);
        setIsModalOpen(true);
    }

    async function handleDelete(id: number) {
        if (!confirm("Emin misiniz?")) return;
        const { error } = await supabase.from('resume_education').delete().eq('id', id);
        if (!error) {
            setItems(items.filter(i => i.id !== id));
        }
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

        const { data, error } = await supabase
            .from('resume_education')
            .upsert(payload)
            .select()
            .single();

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
                    <GraduationCap className="h-5 w-5" /> Eğitim Bilgileri
                </CardTitle>
                <Button onClick={handleAddNew} size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Ekle</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Henüz eğitim bilgisi eklenmemiş.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg bg-slate-50">
                            <div>
                                <h4 className="font-semibold">{item.school_name}</h4>
                                <p className="text-sm text-slate-600">{item.department} - {item.education_level}</p>
                                <p className="text-xs text-slate-400">
                                    {item.start_date} - {item.is_continued ? 'Devam Ediyor' : item.end_date}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id!)}><Trash className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentItem.id ? "Eğitim Düzenle" : "Eğitim Ekle"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Okul Adı</Label>
                        <Input value={currentItem.school_name || ''} onChange={e => setCurrentItem({ ...currentItem, school_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Bölüm</Label>
                        <Input value={currentItem.department || ''} onChange={e => setCurrentItem({ ...currentItem, department: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Derece</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={currentItem.education_level || ''}
                            onChange={e => setCurrentItem({ ...currentItem, education_level: e.target.value })}
                            required
                        >
                            <option value="">Seçiniz...</option>
                            <option value="Lise">Lise</option>
                            <option value="Ön Lisans">Ön Lisans</option>
                            <option value="Lisans">Lisans</option>
                            <option value="Yüksek Lisans">Yüksek Lisans</option>
                            <option value="Doktora">Doktora</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Başlangıç Tarihi</Label>
                            <Input type="date" value={currentItem.start_date || ''} onChange={e => setCurrentItem({ ...currentItem, start_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Bitiş Tarihi</Label>
                            <Input type="date" value={currentItem.end_date || ''} onChange={e => setCurrentItem({ ...currentItem, end_date: e.target.value })} disabled={currentItem.is_continued} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="cont" checked={currentItem.is_continued || false} onChange={e => setCurrentItem({ ...currentItem, is_continued: e.target.checked })} />
                        <Label htmlFor="cont">Devam Ediyorum</Label>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
