"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { TURKEY_CITIES, ISTANBUL_DISTRICTS } from "@/lib/locations";
import { cn } from "@/lib/utils";

interface CVFilterSidebarProps {
    onFilter: (filters: any) => void;
    loading: boolean;
}

export function CVFilterSidebar({ onFilter, loading }: CVFilterSidebarProps) {
    // A. Keywords
    const [keyword, setKeyword] = useState("");

    // B. Name
    const [fullName, setFullName] = useState("");

    // C. Location
    const [city, setCity] = useState("Tümü");
    const [istanbulSide, setIstanbulSide] = useState<"Tümü" | "Avrupa" | "Asya">("Tümü");
    const [district, setDistrict] = useState("");

    // D. Personal
    const [ageRange, setAgeRange] = useState<[number, number]>([18, 65]);
    const [genders, setGenders] = useState<string[]>([]);
    const [nationality, setNationality] = useState("");
    const [disabilityStatus, setDisabilityStatus] = useState("");
    const [militaryStatus, setMilitaryStatus] = useState("");
    const [driverLicense, setDriverLicense] = useState("");

    // E. Education
    const [eduLevel, setEduLevel] = useState("");
    const [university, setUniversity] = useState("");
    const [department, setDepartment] = useState("");
    const [gradYear, setGradYear] = useState("");
    const [eduLang, setEduLang] = useState("");

    // F. Experience
    const [minExp, setMinExp] = useState("");
    const [workingStatus, setWorkingStatus] = useState("");

    // G. Language
    const [languages, setLanguages] = useState("");

    // H. Skills
    const [skillsKey, setSkillsKey] = useState("");

    // Simple Accordion State
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        location: true,
        personal: true,
        education: false,
        exp: false,
        lang: false,
        skills: false
    });

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleApply = () => {
        onFilter({
            keyword,
            fullName,
            city,
            istanbulSide,
            district,
            ageRange,
            genders,
            nationality,
            disabilityStatus,
            militaryStatus,
            driverLicense,
            eduLevel,
            university,
            department,
            gradYear,
            eduLang,
            minExp,
            workingStatus,
            languages,
            skillsKey
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    const clearFilters = () => {
        setKeyword("");
        setFullName("");
        setCity("Tümü");
        setIstanbulSide("Tümü");
        setDistrict("");
        setAgeRange([18, 65]);
        setGenders([]);
        setNationality("");
        setDisabilityStatus("");
        setMilitaryStatus("");
        setDriverLicense("");
        setEduLevel("");
        setUniversity("");
        setDepartment("");
        setGradYear("");
        setEduLang("");
        setMinExp("");
        setWorkingStatus("");
        setLanguages("");
        setSkillsKey("");

        // Immediate apply
        onFilter({});
    };

    // Calculate Districts based on selection
    const availableDistricts = (() => {
        if (city !== "İstanbul") return [];
        if (istanbulSide === "Tümü") return [...ISTANBUL_DISTRICTS.europe, ...ISTANBUL_DISTRICTS.asia].sort();
        if (istanbulSide === "Avrupa") return ISTANBUL_DISTRICTS.europe.sort();
        if (istanbulSide === "Asya") return ISTANBUL_DISTRICTS.asia.sort();
        return [];
    })();

    return (
        <aside className="w-[300px] bg-white rounded-xl border border-slate-200 flex flex-col h-full shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#6A1B9A] text-white">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-bold text-sm">Filtreler</span>
                </div>
                <button onClick={clearFilters} className="text-xs text-white/80 hover:text-white underline">Temizle</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* A. Keyword */}
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Anahtar Kelime</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Yetenek, deneyim ara..."
                            className="pl-9 h-9 text-sm"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                {/* B. Name */}
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Ad Soyad</Label>
                    <Input
                        placeholder="Aday ismi..."
                        className="h-9 text-sm"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* C. Location */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('location')} className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-semibold text-slate-700">Lokasyon</span>
                        {openSections.location ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {openSections.location && (
                        <div className="p-3 space-y-3 bg-white border-t border-slate-200">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Şehir</Label>
                                <select
                                    className="w-full text-sm border-slate-200 rounded-md p-2"
                                    value={city}
                                    onChange={e => {
                                        setCity(e.target.value);
                                        setDistrict("");
                                        setIstanbulSide("Tümü");
                                    }}
                                >
                                    <option value="Tümü">Tüm Şehirler</option>
                                    <option value="İstanbul (Tümü)">İstanbul (Tümü)</option>
                                    <option value="İstanbul (Asya)">İstanbul (Asya)</option>
                                    <option value="İstanbul (Avrupa)">İstanbul (Avrupa)</option>
                                    <option disabled>──────────</option>
                                    {TURKEY_CITIES.filter(c => c !== "İstanbul").map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {(city.includes("İstanbul") || city === "İstanbul") && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">İlçe</Label>
                                    <select
                                        className="w-full text-sm border-slate-200 rounded-md p-2"
                                        value={district}
                                        onChange={e => setDistrict(e.target.value)}
                                    >
                                        <option value="">İlçe Seçin</option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* D. Personal */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('personal')} className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-semibold text-slate-700">Kişisel Bilgiler</span>
                        {openSections.personal ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {openSections.personal && (
                        <div className="p-3 space-y-4 bg-white border-t border-slate-200">
                            {/* Age - Replaced Slider with Inputs */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Yaş Aralığı</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        className="h-8 text-xs"
                                        value={ageRange[0]}
                                        onChange={(e) => setAgeRange([parseInt(e.target.value) || 18, ageRange[1]])}
                                        min={18} max={65}
                                    />
                                    <span className="text-slate-400">-</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        className="h-8 text-xs"
                                        value={ageRange[1]}
                                        onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value) || 65])}
                                        min={18} max={65}
                                    />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Cinsiyet</Label>
                                <div className="flex gap-2 text-sm">
                                    {['Erkek', 'Kadın'].map(g => (
                                        <label key={g} className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={genders.includes(g)}
                                                onChange={() => setGenders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                                            />
                                            {g}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Uyruk */}
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Uyruk</Label>
                                <select className="w-full text-sm border-slate-200 rounded p-1.5" value={nationality} onChange={e => setNationality(e.target.value)}>
                                    <option value="">Farketmez</option>
                                    <option value="T.C.">T.C.</option>
                                    <option value="Diğer">Yabancı</option>
                                </select>
                            </div>

                            {/* Engel */}
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Engel Durumu</Label>
                                <select className="w-full text-sm border-slate-200 rounded p-1.5" value={disabilityStatus} onChange={e => setDisabilityStatus(e.target.value)}>
                                    <option value="">Farketmez</option>
                                    <option value="Var">Var</option>
                                    <option value="Yok">Yok</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* E. Education */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('education')} className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-semibold text-slate-700">Eğitim</span>
                        {openSections.education ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {openSections.education && (
                        <div className="p-3 space-y-3 bg-white border-t border-slate-200">
                            <Input placeholder="Üniversite" className="h-8 text-xs" value={university} onChange={e => setUniversity(e.target.value)} />
                            <Input placeholder="Bölüm" className="h-8 text-xs" value={department} onChange={e => setDepartment(e.target.value)} />
                            <select className="w-full text-xs border-slate-200 rounded p-1.5 h-8" value={eduLevel} onChange={e => setEduLevel(e.target.value)}>
                                <option value="">Seviye Seç...</option>
                                <option value="Lisans">Lisans</option>
                                <option value="Ön Lisans">Ön Lisans</option>
                                <option value="Yüksek Lisans">Yüksek Lisans</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* F. Experience */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('exp')} className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-semibold text-slate-700">Deneyim</span>
                        {openSections.exp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {openSections.exp && (
                        <div className="p-3 space-y-3 bg-white border-t border-slate-200">
                            <Input
                                type="number" placeholder="Min. Yıl (Örn: 2)"
                                className="h-8 text-xs"
                                value={minExp} onChange={e => setMinExp(e.target.value)}
                            />
                            <select className="w-full text-xs border-slate-200 rounded p-1.5 h-8" value={workingStatus} onChange={e => setWorkingStatus(e.target.value)}>
                                <option value="">Çalışma Durumu</option>
                                <option value="Çalışıyor">Çalışıyor</option>
                                <option value="Çalışmıyor">Çalışmıyor</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Button onClick={handleApply} disabled={loading} className="w-full bg-[#6A1B9A] hover:bg-[#581581] text-white">
                    {loading ? "Aranıyor..." : "Filtreleri Uygula"}
                </Button>
            </div>
        </aside>
    );
}
