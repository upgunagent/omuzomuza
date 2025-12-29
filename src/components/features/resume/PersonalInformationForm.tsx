"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Candidate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Trash, User } from "lucide-react";

interface PersonalInformationFormProps {
    candidateId?: string; // If null, uses auth user
}

function UserIconPlaceholder() {
    return (
        <svg
            className="h-12 w-12 text-slate-300"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}

export function PersonalInformationForm({ candidateId }: PersonalInformationFormProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [candidate, setCandidate] = useState<Partial<Candidate>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (candidate.avatar_url) {
            setPreviewUrl(candidate.avatar_url);
        }
    }, [candidate.avatar_url]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemovePhoto = () => {
        if (confirm("Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?")) {
            setAvatarFile(null);
            setPreviewUrl(null);
            setCandidate({ ...candidate, avatar_url: null });
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [candidateId]);

    async function fetchProfile() {
        setLoading(true);
        let targetId = candidateId;

        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }

        if (targetId) {
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', targetId)
                .single();

            if (data) {
                setCandidate(data);
            } else if (error && error.code === 'PGRST116') {
                if (!candidateId) { // Only if current user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) setCandidate({ id: user.id, email: user.email });
                }
            }
        }
        setLoading(false);
    }

    async function handleAvatarUpload(userId: string) {
        if (!avatarFile) return null;

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            alert(`Fotoğraf yüklenirken hata oluştu: ${uploadError.message}`);
            return null;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            // Validation for Disability
            if (candidate.is_disabled) {
                if (!candidate.disability_category || !candidate.disability_rate || !candidate.disability_report_duration) {
                    alert("Lütfen engellilik durumunuz ile ilgili tüm zorunlu alanları doldurunuz.");
                    setSaving(false);
                    return;
                }
            }

            let targetId = candidateId;
            if (!targetId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) targetId = user.id;
            }

            if (!targetId) {
                alert("Kaydetmek için giriş yapmalısınız veya bir aday seçmelisiniz.");
                setSaving(false);
                return;
            }

            if (candidate.id === 'mock-user') {
                alert("Profil yerel olarak güncellendi (Mock Modu)!");
                setSaving(false);
                return;
            }

            let avatarUrl = candidate.avatar_url;
            if (avatarFile) {
                const url = await handleAvatarUpload(targetId);
                if (url) {
                    avatarUrl = url;
                } else {
                    setSaving(false);
                    return;
                }
            }

            const updates = {
                ...candidate,
                id: targetId,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('candidates')
                .upsert(updates);

            if (error) {
                console.error('Error updating profile:', error);
                alert(`Profil güncellenirken hata oluştu: ${error.message}`);
            } else {
                alert('Profil başarıyla güncellendi!');
                setCandidate(updates as Candidate);
            }
        } catch (err) {
            console.error(err);
            alert("Beklenmedik bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    }

    async function handleReportUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let targetId = candidateId;
            if (!targetId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) targetId = user.id;
            }

            if (!targetId) return;

            setSaving(true);
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${targetId}/disability_report_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

            // Record in resume_documents table
            const { error: dbError } = await supabase.from('resume_documents').insert({
                candidate_id: targetId,
                file_name: `Engelli Raporu - ${file.name}`,
                file_url: urlData.publicUrl
            });

            if (dbError) throw dbError;

            alert('Rapor başarıyla yüklendi.');

        } catch (error: any) {
            console.error('Error uploading report:', error);
            alert(`Rapor yüklenirken hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
        } finally {
            setSaving(false);
        }
    }


    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Avatar Section */}
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden border bg-slate-100 flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIconPlaceholder />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="avatar" className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2 justify-center">
                                    <Upload className="w-4 h-4" /> Fotoğrafı Değiştir
                                </Label>
                                <input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center gap-2 justify-center"
                                    >
                                        <Trash className="w-4 h-4" /> Fotoğrafı Kaldır
                                    </button>
                                )}
                                <p className="text-xs text-slate-500">JPG, PNG veya GIF. Maks 2MB.</p>
                            </div>
                        </div>
                        <Button type="submit" disabled={saving} className="!bg-[#1498e0] hover:!bg-[#0d8ad0] !text-white">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Profil Bilgilerimi Kaydet
                        </Button>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Ad</Label>
                            <Input
                                id="firstName"
                                value={candidate.first_name || ''}
                                onChange={e => setCandidate({ ...candidate, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad</Label>
                            <Input
                                id="lastName"
                                value={candidate.last_name || ''}
                                onChange={e => setCandidate({ ...candidate, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                value={candidate.email || ''}
                                onChange={e => setCandidate({ ...candidate, email: e.target.value })}
                                placeholder="ornek@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                value={candidate.phone || ''}
                                onChange={e => setCandidate({ ...candidate, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="identity">TC Kimlik No</Label>
                            <Input
                                id="identity"
                                value={candidate.identity_number || ''}
                                onChange={e => setCandidate({ ...candidate, identity_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Doğum Tarihi</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={candidate.birth_date || ''}
                                onChange={e => setCandidate({ ...candidate, birth_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Cinsiyet</Label>
                            <select
                                id="gender"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                value={candidate.gender || ''}
                                onChange={e => setCandidate({ ...candidate, gender: e.target.value })}
                            >
                                <option value="">Seçiniz...</option>
                                <option value="Male">Erkek</option>
                                <option value="Female">Kadın</option>
                            </select>
                        </div>
                    </div>

                    {/* Disability Info */}
                    <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                        <div className="space-y-2">
                            <Label>Engelli Raporu Durumu</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="is_disabled"
                                        checked={candidate.is_disabled === true}
                                        onChange={() => setCandidate({ ...candidate, is_disabled: true })}
                                        className="accent-[#1498e0]"
                                    />
                                    <span>Var</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="is_disabled"
                                        checked={candidate.is_disabled === false || candidate.is_disabled === undefined}
                                        onChange={() => setCandidate({ ...candidate, is_disabled: false })}
                                        className="accent-[#1498e0]"
                                    />
                                    <span>Yok</span>
                                </label>
                            </div>
                        </div>

                        {candidate.is_disabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label htmlFor="disabilityCategory">Engel Kategorisi <span className="text-red-500">*</span></Label>
                                    <select
                                        id="disabilityCategory"
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                        value={candidate.disability_category || ''}
                                        onChange={e => setCandidate({ ...candidate, disability_category: e.target.value })}
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="GENEL CERRAHİ">GENEL CERRAHİ</option>
                                        <option value="ORTOPEDI VE TRAVMATOLOJI">ORTOPEDI VE TRAVMATOLOJI</option>
                                        <option value="FIZIKSEL TIP VE REHABILITASYON">FIZIKSEL TIP VE REHABILITASYON</option>
                                        <option value="İÇ HASTALIKLARI">İÇ HASTALIKLARI</option>
                                        <option value="GÖZ HASTALIKLARI">GÖZ HASTALIKLARI</option>
                                        <option value="NÖROLOJİ">NÖROLOJİ</option>
                                        <option value="RUH SAĞLIĞI VE HASTALIKLARI">RUH SAĞLIĞI VE HASTALIKLARI</option>
                                        <option value="KULAK BURUN BOĞAZ HASTALIKLARI">KULAK BURUN BOĞAZ HASTALIKLARI</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disabilityRate">Engelli Rapor Oranı <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="disabilityRate"
                                        value={candidate.disability_rate || ''}
                                        onChange={e => setCandidate({ ...candidate, disability_rate: e.target.value })}
                                        placeholder="Örn: %40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reportDuration">Rapor Süresi <span className="text-red-500">*</span></Label>
                                    <select
                                        id="reportDuration"
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                        value={candidate.disability_report_duration || ''}
                                        onChange={e => setCandidate({ ...candidate, disability_report_duration: e.target.value })}
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="Süresiz">Süresiz</option>
                                        <option value="1 Yıl">1 Yıl</option>
                                        <option value="2 Yıl">2 Yıl</option>
                                        <option value="3 Yıl">3 Yıl</option>
                                        <option value="4 Yıl">4 Yıl</option>
                                        <option value="5 Yıl">5 Yıl</option>
                                        <option value="10 Yıl">10 Yıl</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-3">
                                    <Label htmlFor="reportFile">Engelli Raporu Yükle</Label>
                                    <div className="flex items-center gap-4 w-full">
                                        <Input
                                            id="reportFile"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={handleReportUpload}
                                            className="cursor-pointer w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 h-auto py-2"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">Mevcut raporunuz Dosyalarım sayfasında "Engelli Raporu" adıyla kaydedilecektir.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="summary">Profesyonel Özet</Label>
                        <Textarea
                            id="summary"
                            className="h-32"
                            placeholder="Profesyonel geçmişinizi kısaca anlatın..."
                            value={candidate.summary || ''}
                            onChange={e => setCandidate({ ...candidate, summary: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="country">Ülke</Label>
                            <Input id="country" value={candidate.country || ''} onChange={e => setCandidate({ ...candidate, country: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Şehir</Label>
                            <Input id="city" value={candidate.city || ''} onChange={e => setCandidate({ ...candidate, city: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distict">İlçe</Label>
                            <Input id="distict" value={candidate.district || ''} onChange={e => setCandidate({ ...candidate, district: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Adres Detayı</Label>
                        <Textarea id="address" className="h-20" value={candidate.address_detail || ''} onChange={e => setCandidate({ ...candidate, address_detail: e.target.value })} />
                    </div>

                </CardContent>
            </Card>
        </form>
    );
}
