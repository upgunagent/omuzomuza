"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { JobPosition, PositionCandidate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, FileDown, FileText, CalendarCheck, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import XLSX from 'xlsx-js-style';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CandidateReportPage() {
    const params = useParams();
    const id = params.id as string;

    const [position, setPosition] = useState<JobPosition | null>(null);
    const [candidates, setCandidates] = useState<PositionCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        setLoading(true);
        // Fetch Position
        const { data: posData } = await supabase.from('job_positions').select('*, companies(name)').eq('id', id).single();
        setPosition(posData);

        // Fetch Candidates
        const { data: candData, error } = await supabase
            .from('position_candidates')
            .select('*')
            .eq('position_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Aday listesi alınamadı.");
        } else {
            setCandidates(candData || []);
        }
        setLoading(false);
    }

    async function handleDelete(candidateId: string) {
        try {
            const { error } = await supabase
                .from('position_candidates')
                .delete()
                .eq('id', candidateId);

            if (error) throw error;

            toast.success("Aday silindi.");
            setCandidates(prev => prev.filter(c => c.id !== candidateId));
        } catch (error: any) {
            console.error(error);
            toast.error("Silme işlemi başarısız: " + error.message);
        }
    }

    function exportToExcel() {
        if (!candidates.length || !position) return;

        // 1. Prepare Data
        const companyName = position.companies?.name || "Bilinmeyen Firma";
        const positionTitle = position.title || "Pozisyon";
        const reportDate = new Date().toLocaleDateString('tr-TR');

        const headers = [
            "S.No", "Aday Adı", "Pozisyon / Departman", "Telefon", "Email",
            "Görüşme Gün/Saat", "Danışman Değerlendirmesi", "Engel Durumu",
            "Aday Paylaşım Tarihi", "Ücret Beklentisi", "Oturduğu İl / İlçe",
            "Firma Görüşme Tarihi", "Firma Değerlendirmesi", "Sonuç", "İş Başı Tarihi"
        ];

        const body = candidates.map((c, index) => [
            index + 1,
            c.candidate_name || '-',
            c.position_title_snapshot || '-',
            c.phone || '-',
            c.email || '-',
            c.interview_datetime ? new Date(c.interview_datetime).toLocaleDateString('tr-TR') + ' ' + new Date(c.interview_datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-',
            c.consultant_evaluation || '-',
            c.disability_status || '-',
            c.share_date_with_client ? new Date(c.share_date_with_client).toLocaleDateString('tr-TR') : '-',
            c.salary_expectation || '-',
            `${c.city || ''} / ${c.district || ''}`,
            c.company_interview_date ? new Date(c.company_interview_date).toLocaleDateString('tr-TR') : '-',
            c.company_feedback || '-',
            c.result_status || 'BEKLEMEDE',
            (c as any).job_start_date ? new Date((c as any).job_start_date).toLocaleDateString('tr-TR') : '-'
        ]);

        const sheetData = [
            [`Aday Takip Raporu`], // Row 1: Title
            [`FİRMA :`, `${companyName}`, '', '', '', `Rapor Oluşturma Tarihi: ${reportDate}`], // Row 2: Info
            [], // Row 3: Empty
            headers, // Row 4: Headers
            ...body // Data Rows
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // --- STYLING ---
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

        // Styles
        const borderStyle = { style: "thin", color: { rgb: "000000" } };
        const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

        // A1: Red, Bold, Larger
        const mainTitleStyle = {
            font: { bold: true, color: { rgb: "FF0000" }, sz: 14 },
            alignment: { vertical: "center", horizontal: "left" }
        };

        // A2: Black, Bold
        const labelStyle = {
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { vertical: "center", horizontal: "left" }
        };

        // B2, F2: Blue, Bold
        const infoValueStyle = {
            font: { bold: true, color: { rgb: "4472C4" } },
            alignment: { vertical: "center", horizontal: "left" }
        };

        // Headers: Gray BG, Bold
        const headerStyle = {
            font: { bold: true },
            border: borders,
            alignment: { vertical: "center", horizontal: "center", wrapText: true },
            fill: { fgColor: { rgb: "E7E6E6" } }
        };

        // Data: Centered (Vertical & Horizontal)
        const dataStyle = {
            border: borders,
            alignment: { vertical: "center", horizontal: "center", wrapText: false }
        };
        const wrapDataStyle = {
            border: borders,
            alignment: { vertical: "center", horizontal: "center", wrapText: true }
        };

        // Apply Styles Cell by Cell
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cell_ref]) continue;

                if (R === 0) {
                    // Row 1: Main Title
                    ws[cell_ref].s = mainTitleStyle;
                } else if (R === 1) {
                    // Row 2: Info
                    if (C === 0) ws[cell_ref].s = labelStyle; // A2
                    else if (C === 1 || C === 5) ws[cell_ref].s = infoValueStyle; // B2, F2
                } else if (R === 3) {
                    // Row 4: Headers
                    ws[cell_ref].s = headerStyle;
                } else if (R > 3) {
                    // Data Rows
                    if (C === 6 || C === 12) {
                        ws[cell_ref].s = wrapDataStyle;
                    } else {
                        ws[cell_ref].s = dataStyle;
                    }
                }
            }
        }

        // Column Widths
        ws['!cols'] = [
            { wch: 6 },  // S.No
            { wch: 25 }, // Aday Adı
            { wch: 20 }, // Pozisyon
            { wch: 15 }, // Telefon
            { wch: 25 }, // Email
            { wch: 20 }, // Görüşme Tarihi
            { wch: 50 }, // Danışman Notu
            { wch: 20 }, // Engel Durumu
            { wch: 15 }, // Paylaşım Tarihi
            { wch: 15 }, // Ücret
            { wch: 20 }, // İl/İlçe
            { wch: 15 }, // Firma Görüşme
            { wch: 50 }, // Firma Notu
            { wch: 15 }, // Sonuç
            { wch: 15 }  // İş Başı
        ];

        // Merges
        // Removed merge for A1 to avoid centering issues if not desired, or keep logic.
        // User didn't specify A1 merge but title implies spanning. Default behavior is text overflow if not merged.
        // Let's safe merge A1 across.
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }, // Main Title A1:O1
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Aday Listesi");
        XLSX.writeFile(wb, `Aday_Raporu_${companyName}_${positionTitle}.xlsx`);
    }

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin w-8 h-8 text-[#6A1B9A]" /></div>;
    if (!position) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/consultant/positions/${id}`}>
                        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Aday Takip Raporu</h1>
                        <p className="text-slate-500 text-sm">
                            {position.companies?.name} - {position.title} ({candidates.length} Aday)
                        </p>
                    </div>
                </div>
                <Button onClick={exportToExcel} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                    <FileDown className="w-4 h-4 mr-2" /> Excel İndir
                </Button>
            </div>

            <Card>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">Aday Bilgileri</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Engel / Konum</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Süreç / Beklenti</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Değerlendirme</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Durum</th>
                                    <th className="px-6 py-3 whitespace-nowrap">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {candidates.map((candidate) => (
                                    <tr key={candidate.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{candidate.candidate_name}</div>
                                            <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                                                <span>{candidate.email}</span>
                                                <span>{candidate.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-medium">{candidate.disability_status || '-'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" /> {candidate.city} / {candidate.district}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-700 space-y-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400">MÜLAKAT TARİHİ</span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <CalendarCheck className="w-3 h-3 text-slate-400" />
                                                        {candidate.interview_datetime ? new Date(candidate.interview_datetime).toLocaleDateString() : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400">ÜCRET BEKLENTİSİ</span>
                                                    <span className="font-medium text-slate-900">
                                                        {candidate.salary_expectation || '-'}
                                                    </span>
                                                </div>
                                                {(candidate as any).job_start_date && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-green-600">İŞ BAŞI TARİHİ</span>
                                                        <span className="font-bold text-green-700">
                                                            {new Date((candidate as any).job_start_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-purple-600 mb-1">Danışman Değerlendirmesi</span>
                                                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-2" title={candidate.consultant_evaluation || ''}>
                                                        {candidate.consultant_evaluation || '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1">Firma Değerlendirmesi</span>
                                                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {candidate.company_feedback || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className={`${candidate.result_status === 'BEKLEMEDE' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                candidate.result_status === 'İNCELENDİ' || candidate.result_status === 'INCELENDI' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                    candidate.result_status === 'MÜLAKAT' || candidate.result_status === 'MULAKAT' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                        candidate.result_status === 'TEKLİF' || candidate.result_status === 'TEKLIF' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                                                            candidate.result_status === 'KABUL' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                                candidate.result_status === 'RED' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {candidate.result_status || 'BEKLEMEDE'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* CV View */}
                                                {candidate.cv_file_url && (
                                                    <a href={candidate.cv_file_url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="CV Görüntüle">
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}

                                                {/* Edit */}
                                                <Link href={`/consultant/positions/${id}/candidates/${candidate.id}/edit`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50" title="Düzenle">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </Link>

                                                {/* Delete */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Sil">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Adayı silmek istediğinize emin misiniz?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bu işlem geri alınamaz. Aday bu pozisyon listesinden silinecektir.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(candidate.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {candidates.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Bu pozisyon için henüz aday eklenmemiş.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
