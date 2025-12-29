"use client";

import { DisabledReport } from "@/types/cv-bank";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Activity, Clock, User } from "lucide-react";

interface ReportCardProps {
    report: DisabledReport;
}

export function ReportCard({ report }: ReportCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 relative group items-center">

            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6" />
            </div>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{report.ad_soyad}</h3>
                        <p className="text-xs text-slate-400 font-mono">TC: {report.tc_no}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5" title="Doğum Tarihi">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.dogum_tarihi}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded" title="Engel Oranı">
                        <Activity className="w-3.5 h-3.5" />
                        <span>%{report.engelilik_orani}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Geçerlilik">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.gecerlilik}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Veriliş Tarihi">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Veriliş: {report.verilis_tarihi}</span>
                    </div>
                </div>

                <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    <span className="font-semibold">İçerik:</span> {report.engel_icerigi}
                </div>
            </div>

            <div className="flex-shrink-0">
                {report.drive_linki && (
                    <Button
                        onClick={() => window.open(report.drive_linki, '_blank')}
                        className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white"
                        size="sm"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Raporu Görüntüle
                    </Button>
                )}
            </div>

        </div>
    );
}
