"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";

interface ReportFilterSidebarProps {
    onFilter: (filters: any) => void;
    loading: boolean;
}

export function ReportFilterSidebar({ onFilter, loading }: ReportFilterSidebarProps) {
    const [name, setName] = useState("");
    const [tcNo, setTcNo] = useState("");
    const [minRatio, setMinRatio] = useState("");
    const [maxRatio, setMaxRatio] = useState("");
    const [validity, setValidity] = useState("");

    const handleApply = () => {
        onFilter({
            name,
            tcNo,
            minRatio,
            maxRatio,
            validity
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    const clearFilters = () => {
        setName("");
        setTcNo("");
        setMinRatio("");
        setMaxRatio("");
        setValidity("");
        onFilter({});
    };

    return (
        <aside className="w-[300px] bg-white rounded-xl border border-slate-200 flex flex-col h-full shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#6A1B9A] text-white">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-bold text-sm">Rapor Filtreleri</span>
                </div>
                <button onClick={clearFilters} className="text-xs text-white/80 hover:text-white underline">Temizle</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Ad Soyad</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="İsim ara..."
                            className="pl-9 h-9 text-sm"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">T.C. Kimlik No</Label>
                    <Input
                        placeholder="TC No"
                        className="h-9 text-sm"
                        value={tcNo}
                        onChange={e => setTcNo(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Engel Oranı (%)</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number" placeholder="Min"
                            className="h-9 text-sm"
                            value={minRatio}
                            onChange={e => setMinRatio(e.target.value)}
                        />
                        <Input
                            type="number" placeholder="Max"
                            className="h-9 text-sm"
                            value={maxRatio}
                            onChange={e => setMaxRatio(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Geçerlilik</Label>
                    <select
                        className="w-full text-sm border-slate-200 rounded-md p-2 h-9"
                        value={validity}
                        onChange={e => setValidity(e.target.value)}
                    >
                        <option value="">Tümü</option>
                        <option value="Süresiz">Süresiz</option>

                        <option value="1 Yıl">1 Yıl</option>
                        <option value="2 Yıl">2 Yıl</option>
                        <option value="5 Yıl">5 Yıl</option>
                    </select>
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
