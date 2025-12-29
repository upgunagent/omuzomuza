"use client";

import { DisabledReport } from "@/types/cv-bank";
import { ReportCard } from "./ReportCard";
import { Ghost } from "lucide-react";

interface ReportListProps {
    reports: DisabledReport[];
    loading: boolean;
    total: number;
}

export function ReportList({ reports, loading, total }: ReportListProps) {
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                <Ghost className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-600">Rapor Bulunamadı</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
                <span className="text-sm font-bold text-slate-500">{total} Rapor Bulundu</span>
            </div>
            {reports.map((r, i) => (
                <ReportCard key={r.dosya_id || i} report={r} />
            ))}
        </div>
    );
}
