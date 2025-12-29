"use client";

import { CvBankCandidate } from "@/types/cv-bank";
import { CVCandidateCard } from "./CVCandidateCard";
import { Ghost } from "lucide-react";

interface CVCandidateListProps {
    candidates: CvBankCandidate[];
    loading: boolean;
    total: number;
    isOmuzOmuza?: boolean;
}

export function CVCandidateList({ candidates, loading, total, isOmuzOmuza = false }: CVCandidateListProps) {
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (candidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                <Ghost className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-600">Aday Bulunamadı</h3>
                <p className="text-sm">Arama kriterlerinizi değiştirerek tekrar deneyiniz.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
                <span className="text-sm font-bold text-slate-500">{total} Aday Bulundu</span>
            </div>

            {candidates.map((c, i) => (
                <CVCandidateCard key={c.dosya_id || i} candidate={c} isOmuzOmuza={isOmuzOmuza} />
            ))}
        </div>
    );
}
