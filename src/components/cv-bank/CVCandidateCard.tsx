"use client";

import { CvBankCandidate } from "@/types/cv-bank";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Briefcase, GraduationCap, FileText, User, Reply, Pencil } from "lucide-react";
import { Accessibility } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface CVCandidateCardProps {
    candidate: CvBankCandidate;
    isOmuzOmuza?: boolean;
}

export function CVCandidateCard({ candidate, isOmuzOmuza = false }: CVCandidateCardProps) {
    const initials = candidate.tam_isim ? candidate.tam_isim.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";
    const pathname = usePathname();
    const isConsultant = pathname?.startsWith('/consultant');
    const feedbackUrl = `/${isConsultant ? 'consultant' : 'admin'}/candidate-feedback?name=${encodeURIComponent(candidate.tam_isim)}&email=${encodeURIComponent(candidate.email || '')}`;

    // 1. Helper to safely parse string/JSON fields
    const safeParse = (data: any): any => {
        if (!data) return null;
        if (typeof data !== 'string') return data; // Already object/array
        try {
            const trimmed = data.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                return JSON.parse(trimmed);
            }
            return data;
        } catch (e) {
            return data;
        }
    };

    // 2. Helper to format Experience/Education
    const formatComplexField = (fieldData: any): string => {
        const data = safeParse(fieldData);

        if (!data) return "Bilgi yok";

        // Array handling
        if (Array.isArray(data)) {
            // Take last 2 items if meaningful, or all
            // If data has 'is_continued' or dates, sort? (Usually already sorted from backend if joined)
            return data.slice(0, 2).map((item: any) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    // Try to construct a readable string from common keys (Supports both keys)
                    const parts = [
                        item.firma_adi || item.kurum || item.universite || item.company_name || item.school_name,
                        item.pozisyon || item.bolum || item.position || item.department,
                    ].filter(Boolean);
                    return parts.length > 0 ? parts.join(" - ") : JSON.stringify(item);
                }
                return String(item);
            }).join("\n\n");
        }

        // Single Object handling
        if (typeof data === 'object') {
            const parts = [
                data.firma_adi || data.kurum || data.universite || data.company_name || data.school_name,
                data.pozisyon || data.bolum || data.position || data.department,
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(" - ") : "Detaylı bilgi CV'de";
        }

        // String handling
        return String(data);
    };


    // Parse skills
    let skills: string[] = [];
    const skillSource = (candidate.resume_skill && candidate.resume_skill.length > 0) ? candidate.resume_skill : candidate.yetenekler;
    const parsedSkills = safeParse(skillSource);

    if (Array.isArray(parsedSkills)) {
        skills = parsedSkills.flatMap(item => {
            if (typeof item === 'string') return [item];
            if (typeof item === 'object' && item !== null) {
                // If it's a resume_skill object from DB
                if (item.skill_name) return [item.skill_name];
                return Object.values(item).filter(v => typeof v === 'string') as string[];
            }
            return [];
        });
    } else if (typeof parsedSkills === 'object' && parsedSkills !== null) {
        skills = Object.values(parsedSkills).filter(v => typeof v === 'string') as string[];
    } else if (typeof parsedSkills === 'string') {
        skills = parsedSkills.split(',');
    }

    const locationDisplay = candidate.adres_ilce ? `${candidate.adres_il} / ${candidate.adres_ilce}` : candidate.adres_il;

    // Format Experience & Education
    // Priority: Joined Arrays > Flat Fields
    const experienceText = (candidate.resume_experience && candidate.resume_experience.length > 0)
        ? formatComplexField(candidate.resume_experience)
        : formatComplexField(candidate.is_deneyimleri);

    // For Education
    let educationText = "Bilgi yok";
    if (candidate.resume_education && candidate.resume_education.length > 0) {
        educationText = formatComplexField(candidate.resume_education);
    } else if (candidate.universiteler || candidate.bolumler) {
        educationText = [candidate.universiteler, candidate.bolumler, candidate.egitim_durumu].filter(Boolean).join(' - ');
    } else {
        educationText = formatComplexField(candidate.egitim_durumu);
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all flex flex-col gap-4 group">

            {/* Top Section: Avatar + Header Info */}
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-[#1498e0] font-bold text-xl border-2 border-white shadow-sm">
                        {initials}
                    </div>
                </div>

                {/* Header Info */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold text-slate-800">{candidate.tam_isim}</h3>

                            {/* Omuz Omuza Specific Layout */}
                            {isOmuzOmuza ? (
                                <div className="flex items-center gap-2 ml-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                    <span className="text-lg font-bold text-blue-600">{candidate.yas} Yaş</span>
                                    <Accessibility className="w-5 h-5 text-blue-600" />
                                </div>
                            ) : (
                                // Standard Layout
                                candidate.yas > 0 && (
                                    <span className="bg-slate-50 px-2 py-0.5 rounded text-xs font-medium text-slate-600 ml-2">
                                        {candidate.yas} Yaş
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {locationDisplay}
                        </span>
                        <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="">{candidate.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{candidate.telefon || "-"}</span>
                        </div>
                    </div>

                    {/* Disability Status (Omuz Omuza Only) - Blue Line */}
                    {isOmuzOmuza && (candidate.engel_durumu || candidate.disability_category) && (
                        <div className="mt-3 text-sm font-medium text-blue-600 flex items-center gap-2">
                            <Accessibility className="w-4 h-4" />
                            <span>Engel Durumu : {candidate.engel_durumu || candidate.disability_category}</span>
                        </div>
                    )}
                </div>



                {/* Top Right Action (Desktop) */}
                <div className="hidden md:flex gap-2">


                    <Link href={feedbackUrl}>
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-sky-50 text-[#1498e0] border-sky-200"
                            size="sm"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Aday'a Dönüş Yap
                        </Button>
                    </Link>

                    {isOmuzOmuza && (
                        <Link href={`/${isConsultant ? 'consultant' : 'admin'}/invite-member?name=${encodeURIComponent(candidate.tam_isim)}&email=${encodeURIComponent(candidate.email || '')}`}>
                            <Button
                                variant="outline"
                                className="bg-white hover:bg-green-50 text-green-700 border-green-200"
                                size="sm"
                            >
                                <User className="w-4 h-4 mr-2" />
                                Üyelik Maili Gönder
                            </Button>
                        </Link>
                    )}

                    {candidate.drive_linki && (
                        <Button
                            onClick={() => window.open(candidate.drive_linki, '_blank')}
                            className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white shadow-md shadow-sky-100"
                            size="sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            CV Görüntüle
                        </Button>
                    )}
                </div>
            </div>

            {/* Split Section: Experience & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">

                {/* Education */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Eğitim
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-2 rounded-md border border-slate-100 min-h-[60px]">
                        {educationText}
                    </p>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Son Deneyimler
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-2 rounded-md border border-slate-100 min-h-[60px]">
                        {experienceText}
                    </p>
                </div>
            </div>

            {/* Skills & Mobile Action */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-2">
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {skills.slice(0, 5).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-slate-600 text-[10px] rounded border border-slate-200 shadow-sm truncate max-w-[150px]">
                            {typeof s === 'string' ? s.trim() : String(s)}
                        </span>
                    ))}
                    {skills.length > 5 && <span className="text-[10px] text-slate-400 px-1">+{skills.length - 5}</span>}
                </div>

                <div className="w-full md:hidden">
                    {candidate.drive_linki && (
                        <Button
                            onClick={() => window.open(candidate.drive_linki, '_blank')}
                            className="w-full bg-[#7e22ce] hover:bg-[#6b21a8] text-white shadow-md"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            CV Görüntüle
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
