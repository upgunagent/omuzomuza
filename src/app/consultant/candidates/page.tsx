"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Candidate, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeSkill, ResumeCertification, ResumeReference } from "@/types";
import Link from "next/link";
import { Search, MapPin, Briefcase, GraduationCap, ChevronDown, Filter, X, ChevronRight, Download, Eye, Accessibility, Clock, ChevronLeft, FileText, Mail, Phone, Lock, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TURKEY_CITIES, ISTANBUL_DISTRICTS } from "@/lib/locations";
import { cn } from "@/lib/utils";
import CvPreviewModal from "@/components/features/cv/CvPreviewModal";

// --- Types for Joined Data ---
type CandidateWithRelations = Candidate & {
    resume_education: ResumeEducation[];
    resume_experience: ResumeExperience[];
    resume_language: ResumeLanguage[];
    resume_skill: ResumeSkill[];
    resume_documents: { file_name: string; file_url: string }[];
    applications: { jobs: { title: string; company_name: string } }[];
};

// --- Helper Components ---

function Accordion({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
            >
                <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{title}</span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
            {isOpen && <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange, count }: { label: string, checked: boolean, onChange: () => void, count?: number }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="rounded border-slate-300 text-[#7e22ce] focus:ring-[#7e22ce] w-4 h-4"
                />
                <span className={cn("text-sm transition-colors", checked ? "text-[#7e22ce] font-medium" : "text-slate-600 group-hover:text-slate-900")}>{label}</span>
            </div>
            {count !== undefined && <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{count}</span>}
        </label>
    );
}

const DISABILITY_CATEGORIES = [
    "GENEL CERRAHİ",
    "ORTOPEDİ VE TRAVMATOLOJİ",
    "FİZİKSEL TIP VE REHABİLİTASYON",
    "İÇ HASTALIKLARI",
    "GÖZ HASTALIKLARI",
    "NÖROLOJİ",
    "RUH SAĞLIĞI VE HASTALIKLARI",
    "KULAK BURUN BOĞAZ HASTALIKLARI",
    "ONKOLOJİ",
    "KALP DAMAR HASTALIKLARI",
    "KAS ISKELET SISTEMI HASTALIKLARI",
    "ENDOKRİNOLOJİ VE METABOLİZMA",
    "SOLUNUM SİSTEMİ HASTALIKLARI",
    "SİNİR SİSTEMİ HASTALIKLARI"
];

// --- Main Page Component ---

export default function ConsultantCandidatesPage() {
    const [allCandidates, setAllCandidates] = useState<CandidateWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Filter States ---
    // 1. Keyword
    const [keyword, setKeyword] = useState("");
    const [emailSearch, setEmailSearch] = useState("");

    // 2. Personal
    const [ageRange, setAgeRange] = useState<[number, number]>([16, 65]);
    const [genders, setGenders] = useState<string[]>([]);
    const [nationality, setNationality] = useState("");
    const [militaryStatus, setMilitaryStatus] = useState("");
    const [drivingLicenses, setDrivingLicenses] = useState<string[]>([]);

    // 3. Location
    const [city, setCity] = useState("Tümü");
    const [istanbulSide, setIstanbulSide] = useState<"Tümü" | "Asya" | "Avrupa">("Tümü");
    const [district, setDistrict] = useState("");

    // 4. Education
    const [eduLevel, setEduLevel] = useState("");
    const [university, setUniversity] = useState("");
    const [department, setDepartment] = useState("");

    // 5. Experience
    const [minExperience, setMinExperience] = useState<number | null>(null); // null = All
    const [position, setPosition] = useState("");
    const [isWorking, setIsWorking] = useState<boolean | null>(null); // null = All

    // 6. Skills & Language
    const [skillsInput, setSkillsInput] = useState(""); // Comma separated
    const [language, setLanguage] = useState("");
    const [languageLevel, setLanguageLevel] = useState("");

    // 7. Disability
    const [disabilityStatus, setDisabilityStatus] = useState("");

    // CV Preview Modal State
    const [isCvModalOpen, setIsCvModalOpen] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [cvData, setCvData] = useState<any>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, emailSearch, city, district, istanbulSide, ageRange, genders, nationality, language, languageLevel, position, minExperience, isWorking, eduLevel, department, disabilityStatus]);

    useEffect(() => { fetchCandidates(); }, []);

    async function fetchCandidates() {
        setLoading(true);
        console.log('🔍 Fetching candidates from Supabase... (Version Fix-Restore)');

        // Fetch candidates first (without JOINs)
        const { data: candidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .order('updated_at', { ascending: false });

        if (candidatesError) {
            console.error("❌ Error fetching candidates:", candidatesError);
            console.error("Error details:", JSON.stringify(candidatesError, null, 2));
            return;
        }

        if (!candidates || candidates.length === 0) {
            console.log('No candidates found');
            setAllCandidates([]);
            return;
        }

        console.log('✅ Candidates fetched successfully. Count:', candidates.length);

        // Get all candidate IDs
        const candidateIds = candidates.map(c => c.id);

        // Fetch all resume data in parallel (DUAL FETCH Strategy)
        const [
            { data: edu1 }, { data: edu2 },
            { data: exp1 }, { data: exp2 },
            { data: lang1 }, { data: lang2 },
            { data: skill1 }, { data: skill2 },
            { data: apps },
            { data: docs }
        ] = await Promise.all([
            // Singular
            supabase.from('resume_education').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_educations').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_experience').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_experiences').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_language').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_languages').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_skill').select('*').in('candidate_id', candidateIds),
            supabase.from('resume_skills').select('*').in('candidate_id', candidateIds),
            supabase.from('applications').select('candidate_id, jobs(title, company_name)').in('candidate_id', candidateIds),
            supabase.from('resume_documents').select('*').in('candidate_id', candidateIds)
        ]);

        // Merge Helper
        const mergeData = (arr1: any[] | null, arr2: any[] | null) => {
            const combined = [...(arr1 || []), ...(arr2 || [])];
            const unique = new Map();
            combined.forEach(item => {
                const key = item.id || Math.random();
                if (!unique.has(key)) unique.set(key, item);
            });
            return Array.from(unique.values());
        };

        const educations = mergeData(edu1, edu2);
        const experiences = mergeData(exp1, exp2);
        const languages = mergeData(lang1, lang2);
        const skills = mergeData(skill1, skill2);

        // Join data in JavaScript
        const candidatesWithRelations: CandidateWithRelations[] = candidates.map(candidate => ({
            ...candidate,
            resume_education: educations?.filter((e: any) => e.candidate_id === candidate.id) || [],
            resume_experience: experiences?.filter((e: any) => e.candidate_id === candidate.id) || [],
            resume_language: languages?.filter((l: any) => l.candidate_id === candidate.id) || [],
            resume_skill: skills?.filter((s: any) => s.candidate_id === candidate.id) || [],
            resume_documents: docs?.filter((d: any) => d.candidate_id === candidate.id) || [],
            applications: apps?.filter((a: any) => a.candidate_id === candidate.id) || []
        }));

        console.log('✅ Data joined successfully (Dual Fetch). Sample:', candidatesWithRelations[0]);
        setAllCandidates(candidatesWithRelations);
        setLoading(false);
    }

    // --- Filtering Logic ---
    const filteredCandidates = useMemo(() => {
        return allCandidates.filter(c => {
            const currentYear = new Date().getFullYear();

            // 1. Keyword Search (Matches Summary, Skills, Exp Position, Edu Dept)
            if (keyword.trim()) {
                const k = keyword.toLowerCase();
                const inSummary = c.summary?.toLowerCase().includes(k);
                const inSkills = c.resume_skill?.some(s => s.skill_name.toLowerCase().includes(k));
                const inExp = c.resume_experience?.some(e => e.position.toLowerCase().includes(k) || e.description?.toLowerCase().includes(k));
                const inEdu = c.resume_education?.some(e => e.department.toLowerCase().includes(k));

                if (!inSummary && !inSkills && !inExp && !inEdu) return false;
            }

            // 1.5 Email Search
            if (emailSearch.trim()) {
                if (!c.email?.toLowerCase().includes(emailSearch.toLowerCase())) return false;
            }

            // 2. Personal
            // Age
            let age = 0;
            if (c.birth_date) {
                age = currentYear - new Date(c.birth_date).getFullYear();
            }
            if (age < ageRange[0] || age > ageRange[1]) return false;

            // Gender
            if (genders.length > 0) {
                if (!c.gender) return false;
                const normalize = (s: string) => s.trim().toLowerCase();
                const gValue = normalize(c.gender);

                const matches = genders.some(gSel => {
                    if (gSel === "Erkek") {
                        return ["erkek", "male", "bay", "e", "♂"].some(t => gValue.includes(t) || gValue === t);
                    }
                    if (gSel === "Kadın") {
                        return ["kadın", "female", "bayan", "k", "♀"].some(t => gValue.includes(t) || gValue === t);
                    }
                    return gValue === normalize(gSel);
                });

                if (!matches) return false;
            }

            // Nationality (Mock check as field might be empty)
            if (nationality && c.nationality !== nationality) return false;

            // Military (Mock check)
            if (militaryStatus && c.military_status !== militaryStatus) return false;


            // 3. Location (Complex Logic)
            if (city !== "Tümü") {
                // If "İstanbul (Asya)" or "İstanbul (Avrupa)" selected logic
                // Actually UI handles the "Istanbul Side" selector separately if City == Istanbul

                if (c.city !== city) return false;

                if (city === "İstanbul" && istanbulSide !== "Tümü") {
                    if (!c.district) return false; // Needs district to know side
                    const sideList = istanbulSide === "Asya" ? ISTANBUL_DISTRICTS.asia : ISTANBUL_DISTRICTS.europe;
                    if (!sideList.includes(c.district)) return false;
                }

                if (district && c.district !== district) return false;
            }

            // 4. Education
            if (eduLevel && !c.resume_education?.some(e => e.education_level === eduLevel)) return false;
            if (university && !c.resume_education?.some(e => e.school_name.toLowerCase().includes(university.toLowerCase()))) return false;
            if (department && !c.resume_education?.some(e => e.department.toLowerCase().includes(department.toLowerCase()))) return false;

            // 5. Experience
            if (position && !c.resume_experience?.some(e => e.position.toLowerCase().includes(position.toLowerCase()))) return false;

            // Calc Total Exp
            if (minExperience !== null) {
                // Simple approx: count distinct years or sum duration. 
                // Detailed calc is complex, here we assume if they have exp records spanning X years.
                if (minExperience === 0 && (c.resume_experience?.length || 0) > 0) return false; // Want inexperienced
                if (minExperience > 0 && (c.resume_experience?.length || 0) === 0) return false;
                // For MVP, just checking existence or simple counts could be enough or we skip rigorous year calc
            }

            if (isWorking !== null) {
                const currentlyWorking = c.resume_experience?.some(e => e.is_continued);
                if (isWorking && !currentlyWorking) return false;
                if (!isWorking && currentlyWorking) return false;
            }

            // 6. Skills
            if (skillsInput) {
                const requiredSkills = skillsInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                if (requiredSkills.length > 0) {
                    const hasSkills = requiredSkills.every(req => c.resume_skill?.some(s => s.skill_name.toLowerCase().includes(req)));
                    if (!hasSkills) return false;
                }
            }

            // 7. Language
            if (language && !c.resume_language?.some(l => l.language_name === language && (!languageLevel || l.level.includes(languageLevel)))) return false;

            // 8. Disability Status
            if (disabilityStatus) {
                if (!c.disability_category || c.disability_category !== disabilityStatus) return false;
            }

            return true;
        });
    }, [allCandidates, keyword, emailSearch, ageRange, genders, nationality, militaryStatus, city, istanbulSide, district, eduLevel, university, department, position, minExperience, isWorking, skillsInput, language, languageLevel, disabilityStatus]);


    // Helper to calculate total exp label
    const getExperienceLabel = (experiences: ResumeExperience[]) => {
        if (!experiences || experiences.length === 0) return "Tecrübesiz";
        // Mock calculation
        return `${experiences.length} Deneyim`;
    };

    const getLastPosition = (experiences: ResumeExperience[]) => {
        if (!experiences || experiences.length === 0) return "Yeni Mezun / Aday";
        const sorted = [...experiences].sort((a, b) => {
            if (a.is_continued) return -1;
            if (b.is_continued) return 1;
            return new Date(b.end_date || 0).getTime() - new Date(a.end_date || 0).getTime();
        });
        return sorted[0].position + " @ " + sorted[0].company_name;
    };

    // Fetch full CV data for modal
    // Fetch full CV data for modal
    async function fetchCandidateCvData(candidateId: string) {
        const { data: candidate } = await supabase.from('candidates').select('*').eq('id', candidateId).single();

        // Dual Fetch for CV Data
        const responses = await Promise.all([
            supabase.from('resume_education').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_educations').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_experience').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_experiences').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_language').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_languages').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_skill').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_skills').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_certification').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_certifications').select('*').eq('candidate_id', candidateId), // Potential error source
            supabase.from('resume_reference').select('*').eq('candidate_id', candidateId),
            supabase.from('resume_references').select('*').eq('candidate_id', candidateId) // Potential error source
        ]);

        const [
            rEdu1, rEdu2,
            rExp1, rExp2,
            rLang1, rLang2,
            rSkill1, rSkill2,
            rCert1, rCert2,
            rRef1, rRef2
        ] = responses;

        // Log errors but continue if it's just a missing table (which returns error 42P01 "relation does not exist" usually)
        responses.forEach((res, idx) => {
            if (res.error) {
                console.error(`Fetch error at index ${idx}:`, res.error);
                // Throwing here to ensure the catch block displays the alert!
                throw new Error(`Veri çekme hatası (Tablo index ${idx}): ${res.error.message}`);
            }
        });

        // Use data or empty array if null
        const mergeData = (arr1: any[] | null, arr2: any[] | null) => {
            const combined = [...(arr1 || []), ...(arr2 || [])];
            const unique = new Map();
            combined.forEach(item => {
                const key = item.id || Math.random();
                if (!unique.has(key)) unique.set(key, item);
            });
            return Array.from(unique.values());
        };

        const educations = mergeData(rEdu1.data, rEdu2.data);
        const experiences = mergeData(rExp1.data, rExp2.data);
        const languages = mergeData(rLang1.data, rLang2.data);
        const skills = mergeData(rSkill1.data, rSkill2.data);
        const certifications = mergeData(rCert1.data, rCert2.data);
        const references = mergeData(rRef1.data, rRef2.data);

        setCvData({
            candidate: candidate || {},
            educations,
            experiences,
            languages,
            skills,
            certifications,
            references
        });
    }

    // Handle İncele button click
    async function handleViewCV(candidateId: string) {
        try {
            console.log("Opening CV for:", candidateId);
            // alert("DEBUG: İncele butonuna tıklandı. Veriler çekiliyor..."); // Debug alert
            setSelectedCandidateId(candidateId);
            await fetchCandidateCvData(candidateId);
            console.log("CV Data fetched, opening modal");
            setIsCvModalOpen(true);
        } catch (error: any) {
            console.error("Error opening CV:", error);
            alert("Aday detayları yüklenirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
        }
    }

    // Password Reset
    async function handleSendResetPassword(email: string | null | undefined) {
        if (!email) {
            alert("Adayın e-posta adresi bulunamadı.");
            return;
        }
        if (!confirm(`${email} adresine şifre sıfırlama bağlantısı gönderilsin mi?`)) return;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth/update-password',
        });

        if (error) {
            alert("Hata oluştu: " + error.message);
        } else {
            alert("Şifre sıfırlama e-postası başarıyla gönderildi.");
        }
    }


    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50/50">
            {/* Header / Top Bar */}
            <div className="flex items-center justify-between mb-4 sticky top-0 z-20 bg-slate-50/50 backdrop-blur-sm py-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Özgeçmiş Havuzu</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Toplam <span className="font-bold text-[#7e22ce]">{filteredCandidates.length}</span> aday bulundu.
                    </p>
                </div>


            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">

                {/* --- LEFT SIDEBAR: ADVANCED FILTERS --- */}
                <aside className="w-[340px] bg-white rounded-xl border border-slate-200 overflow-y-auto hidden md:flex flex-col shadow-sm flex-shrink-0 h-full">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#1498e0] text-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            <span className="font-bold text-sm">Filtreleme Seçenekleri</span>
                        </div>
                        {(keyword || city !== "Tümü" || genders.length > 0 || disabilityStatus) && (
                            <button onClick={() => window.location.reload()} className="text-xs text-white/80 hover:text-white font-medium underline">Temizle</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">

                        {/* 0. Keyword Search (New Requirement) */}
                        <div className="p-4 border-b border-slate-100">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Anahtar Kelime</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Kelime ile ara..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="pl-9 h-9 border-slate-200 focus:border-[#7e22ce] bg-slate-50"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">CV içeriğinde (özet, deneyim, eğitim) arama yapar.</p>
                        </div>

                        {/* Email Search - Added */}
                        <div className="p-4 border-b border-slate-100">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">E-Posta İle Ara</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="örn: aday@email.com"
                                    value={emailSearch}
                                    onChange={(e) => setEmailSearch(e.target.value)}
                                    className="pl-9 h-9 border-slate-200 focus:border-[#7e22ce] bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* 1. Location */}
                        <Accordion title="Lokasyon" defaultOpen={true}>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">İl Seçimi</Label>
                                    <select
                                        className="w-full border-slate-200 rounded-md text-sm p-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                                        value={city}
                                        onChange={(e) => { setCity(e.target.value); setDistrict(""); setIstanbulSide("Tümü"); }}
                                    >
                                        <option value="Tümü">Tüm Şehirler</option>
                                        {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {city === "İstanbul" && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Yaka Seçimi</Label>
                                        <div className="flex gap-2">
                                            {["Tümü", "Avrupa", "Asya"].map((side) => (
                                                <button
                                                    key={side}
                                                    onClick={() => setIstanbulSide(side as any)}
                                                    className={cn(
                                                        "flex-1 py-1.5 text-xs rounded border transition-colors",
                                                        istanbulSide === side
                                                            ? "bg-[#7e22ce] text-white border-[#7e22ce]"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-[#7e22ce]"
                                                    )}
                                                >
                                                    {side}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {city !== "Tümü" && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">İlçe</Label>
                                        <select
                                            className="w-full border-slate-200 rounded-md text-sm p-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                        >
                                            <option value="">İlçe Seçin</option>
                                            {city === "İstanbul" ? (
                                                istanbulSide === "Tümü"
                                                    ? [...ISTANBUL_DISTRICTS.europe, ...ISTANBUL_DISTRICTS.asia].sort().map(d => <option key={d} value={d}>{d}</option>)
                                                    : (istanbulSide === "Avrupa" ? ISTANBUL_DISTRICTS.europe : ISTANBUL_DISTRICTS.asia).sort().map(d => <option key={d} value={d}>{d}</option>)
                                            ) : (
                                                <option disabled>Veri hazırlanıyor...</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </Accordion>

                        {/* 2. Personal Info */}
                        <Accordion title="Kişisel Bilgiler" defaultOpen={true}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Yaş Aralığı</span>
                                        <span className="font-medium text-slate-700">{ageRange[0]} - {ageRange[1]}</span>
                                    </div>
                                    <Slider
                                        min={16} max={65} step={1}
                                        value={ageRange[1]}
                                        onChange={(e: any) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                                        className="py-2"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            type="number" min={16} max={65}
                                            value={ageRange[0]} onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            type="number" min={16} max={65}
                                            value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Cinsiyet</Label>
                                    <div className="flex flex-col gap-2">
                                        {['Erkek', 'Kadın'].map(g => (
                                            <CheckboxItem
                                                key={g}
                                                label={g}
                                                checked={genders.includes(g)}
                                                onChange={() => setGenders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Uyruk</Label>
                                    <select className="w-full h-9 border-slate-200 rounded text-sm" value={nationality} onChange={e => setNationality(e.target.value)}>
                                        <option value="">Farketmez</option>
                                        <option value="T.C.">T.C. Vatandaşı</option>
                                        <option value="Diğer">Yabancı Uyruklu</option>
                                    </select>
                                </div>
                            </div>
                        </Accordion>

                        {/* 2.5 Foreign Language (Moved Here) */}
                        <Accordion title="Yabancı Dil">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Yabancı Dil Seçimi</Label>
                                    <select className="w-full h-9 border-slate-200 rounded text-sm" value={language} onChange={e => { setLanguage(e.target.value); if (!e.target.value) setLanguageLevel(""); }}>
                                        <option value="">Dil Seçiniz</option>
                                        <option value="İngilizce">İngilizce</option>
                                        <option value="Almanca">Almanca</option>
                                        <option value="Fransızca">Fransızca</option>
                                        <option value="İspanyolca">İspanyolca</option>
                                        <option value="Rusça">Rusça</option>
                                        <option value="Arapça">Arapça</option>
                                    </select>
                                </div>

                                {language && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label className="text-xs text-slate-500">{language} Seviyesi</Label>
                                        <select className="w-full h-9 border-slate-200 rounded text-sm" value={languageLevel} onChange={e => setLanguageLevel(e.target.value)}>
                                            <option value="">Seviye Seçiniz</option>
                                            <option value="Başlangıç">Başlangıç</option>
                                            <option value="Orta">Orta</option>
                                            <option value="İyi">İyi</option>
                                            <option value="İleri">İleri</option>
                                            <option value="Native">Anadil</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </Accordion>

                        {/* 3. Experience */}
                        <Accordion title="İş Deneyimi">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Pozisyon Adı</Label>
                                    <Input placeholder="Örn: Yazılım Uzmanı" className="h-9" value={position} onChange={e => setPosition(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Tecrübe Yılı (En az)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[0, 2, 5, 10].map(y => (
                                            <button
                                                key={y} onClick={() => setMinExperience(minExperience === y ? null : y)}
                                                className={cn("text-xs border rounded py-1 hover:border-[#7e22ce]", minExperience === y ? "bg-[#7e22ce] text-white border-[#7e22ce]" : "bg-white")}
                                            >
                                                {y === 0 ? 'Tecrübesiz' : `${y}+ Yıl`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Çalışma Durumu</Label>
                                    <div className="flex flex-col gap-2">
                                        <CheckboxItem label="Şu an çalışıyor" checked={isWorking === true} onChange={() => setIsWorking(isWorking === true ? null : true)} />
                                        <CheckboxItem label="Şu an çalışmıyor" checked={isWorking === false} onChange={() => setIsWorking(isWorking === false ? null : false)} />
                                    </div>
                                </div>
                            </div>
                        </Accordion>

                        {/* 4. Education */}
                        <Accordion title="Eğitim Bilgileri">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Eğitim Seviyesi</Label>
                                    <select className="w-full h-9 border-slate-200 rounded text-sm" value={eduLevel} onChange={e => setEduLevel(e.target.value)}>
                                        <option value="">Farketmez</option>
                                        <option value="Lise">Lise</option>
                                        <option value="Ön Lisans">Ön Lisans</option>
                                        <option value="Lisans">Lisans</option>
                                        <option value="Yüksek Lisans">Yüksek Lisans</option>
                                        <option value="Doktora">Doktora</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Bölüm</Label>
                                    <Input placeholder="Örn: Bilgisayar Müh" className="h-9" value={department} onChange={e => setDepartment(e.target.value)} />
                                </div>
                            </div>
                        </Accordion>

                        {/* 5. Disability Status (New) */}
                        <Accordion title="Engel Durumu">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Engel Kategorisi</Label>
                                    <select
                                        className="w-full h-9 border-slate-200 rounded text-sm"
                                        value={disabilityStatus}
                                        onChange={e => setDisabilityStatus(e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {DISABILITY_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Accordion>

                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <Button className="w-full bg-[#1498e0] hover:bg-[#0d8ad0] text-white font-bold h-11 shadow-lg shadow-sky-200">
                            Filtreleri Uygula
                        </Button>
                    </div>
                </aside>

                {/* --- RIGHT CONTENT: RESULTS --- */}
                <main className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-sm text-slate-600">
                                <input type="checkbox" className="rounded border-slate-300 text-[#7e22ce] focus:ring-[#7e22ce]" />
                                <span>Tümünü Seç</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Sıralama:</span>
                            <select className="border-none text-sm font-medium text-slate-700 bg-transparent focus:ring-0 cursor-pointer">
                                <option>En Yeni Güncellenen</option>
                                <option>Deneyime Göre (Azalan)</option>
                                <option>Deneyime Göre (Artan)</option>
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fc]">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Search className="w-10 h-10 mb-4 animate-pulse opactiy-50" />
                                <p>Adaylar yükleniyor...</p>
                            </div>
                        )}

                        {!loading && filteredCandidates.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <div className="bg-slate-100 p-6 rounded-full mb-4">
                                    <Filter className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Aday bulunamadı</h3>
                                <p className="text-sm max-w-xs text-center mt-2">Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.</p>
                                <p className="text-sm max-w-xs text-center mt-2">Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.</p>
                                <Button variant="link" onClick={() => { setKeyword(""); setEmailSearch(""); setCity("Tümü"); setDisabilityStatus(""); }} className="text-[#7e22ce] mt-2">Filtreleri Temizle</Button>
                            </div>
                        )}

                        {!loading && filteredCandidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(candidate => (
                            <div key={candidate.id} className="group bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-6 relative">


                                {/* Avatar Zone */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                                        {candidate.avatar_url ? (
                                            <img src={candidate.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-2xl">
                                                {candidate.first_name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#1498e0] transition-colors truncate flex items-center gap-2">
                                                <span className="truncate">
                                                    {candidate.first_name} {candidate.last_name}
                                                </span>
                                                {candidate.is_disabled && <span title="Engelli Aday"><Accessibility className="w-5 h-5 text-blue-600 flex-shrink-0" /></span>}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                {candidate.birth_date && (
                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
                                                        {new Date().getFullYear() - new Date(candidate.birth_date).getFullYear()} Yaş
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {candidate.city} {candidate.district && `/ ${candidate.district}`}
                                                </span>
                                            </div>

                                            {/* Contact & Password Info */}
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="" title={candidate.email || ""}>{candidate.email || "E-posta yok"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{candidate.phone || candidate.phone_secondary || "Telefon yok"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600 group/pass">
                                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-mono text-slate-500 tracking-widest text-[10px]">******</span>
                                                    <button
                                                        onClick={() => handleSendResetPassword(candidate.email)}
                                                        className="ml-2 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition-colors flex items-center gap-1 opacity-0 group-hover/pass:opacity-100"
                                                        title="Şifre Sıfırlama Bağlantısı Gönder"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Sıfırla
                                                    </button>
                                                </div>
                                            </div>
                                            {candidate.is_disabled && (
                                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                                                    <Accessibility className="w-4 h-4" />
                                                    <span>Engel Durumu : {candidate.disability_category || "Belirtilmemiş"}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/consultant/candidate-feedback?name=${encodeURIComponent((candidate.first_name + ' ' + candidate.last_name).trim())}&email=${encodeURIComponent(candidate.email || '')}`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Mail className="w-4 h-4 mr-2" /> Aday'a Dönüş Yap
                                                </Button>
                                            </Link>
                                            <Link href={`/consultant/candidates/${candidate.id}/edit`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" /> Düzenle
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                                onClick={() => handleViewCV(candidate.id)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> İncele
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <Briefcase className="w-3 h-3" /> Son Deneyim
                                            </div>
                                            <div className="font-medium text-slate-800 text-sm truncate" title={getLastPosition(candidate.resume_experience)}>
                                                {getLastPosition(candidate.resume_experience)}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {getExperienceLabel(candidate.resume_experience)}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <GraduationCap className="w-3 h-3" /> Eğitim
                                            </div>
                                            <div className="font-medium text-slate-800 text-sm truncate">
                                                {candidate.resume_education?.[0]?.school_name || "Belirtilmemiş"}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {candidate.resume_education?.[0]?.department || "-"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills Section (Moved Up) */}
                                    {candidate.resume_skill && candidate.resume_skill.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {candidate.resume_skill.slice(0, 5).map(skill => (
                                                <span key={skill.id} className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600">
                                                    {skill.skill_name}
                                                </span>
                                            ))}
                                            {candidate.resume_skill.length > 5 && (
                                                <span className="text-xs text-slate-400 px-1 py-1">+ {candidate.resume_skill.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Bottom Grid: Files and Jobs */}
                                    {((candidate.resume_documents && candidate.resume_documents.length > 0) || (candidate.applications && candidate.applications.length > 0)) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">

                                            {/* Files (Left) */}
                                            <div>
                                                {candidate.resume_documents && candidate.resume_documents.length > 0 ? (
                                                    <>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                            <FileText className="w-3 h-3" /> Dosyalar
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {candidate.resume_documents.map((doc, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={doc.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-200"
                                                                >
                                                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span className="truncate max-w-[150px]" title={doc.file_name}>{doc.file_name}</span>
                                                                    <Download className="w-3 h-3 text-slate-400" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic py-2">Dosya yok</div>
                                                )}
                                            </div>

                                            {/* Applied Jobs (Right) */}
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Briefcase className="w-3 h-3" /> Başvurulan İlanlar
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {candidate.applications && candidate.applications.length > 0 ? (
                                                        candidate.applications.map((app: any, idx: number) => (
                                                            <span key={idx} className="text-xs font-medium px-2 py-1 bg-sky-50 text-[#1498e0] border border-sky-100 rounded-md">
                                                                {app.jobs?.title || "Bilinmeyen İlan"}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Henüz başvuru yok</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                </div>


                            </div>
                        ))}
                    </div>
                    {/* Pagination Controls */}
                    {!loading && filteredCandidates.length > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE) || Math.abs(p - currentPage) <= 1)
                                    .map((p, i, arr) => (
                                        <div key={p} className="flex items-center">
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="mx-1 text-slate-400">...</span>}
                                            <Button
                                                variant={currentPage === p ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(p)}
                                                className={cn("h-8 w-8 p-0 text-xs", currentPage === p ? "bg-[#7e22ce] text-white hover:bg-[#6b21a8]" : "text-slate-600 hover:text-[#7e22ce] hover:border-[#7e22ce]")}
                                            >
                                                {p}
                                            </Button>
                                        </div>
                                    ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={currentPage === Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </main>

            </div>

            {/* CV Preview Modal */}
            <CvPreviewModal
                isOpen={isCvModalOpen}
                onClose={() => setIsCvModalOpen(false)}
                data={cvData}
            />
        </div>
    );
}



