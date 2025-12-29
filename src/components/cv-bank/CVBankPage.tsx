"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CVFilterSidebar } from "./CVFilterSidebar";
import { CVCandidateList } from "./CVCandidateList";
import { CvBankCandidate } from "@/types/cv-bank";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CVBankPageProps {
    tableName: "omuzomuza_engelli" | "happy_engelsiz";
    title: string;
    description: string;
}

const ITEMS_PER_PAGE = 20;

export function CVBankPage({ tableName, title, description }: CVBankPageProps) {
    const [candidates, setCandidates] = useState<CvBankCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<any>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page on filter change
    };

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            let query: any;
            const isSearchMode = !!filters.keyword;

            // 1. Base Query Construction
            if (isSearchMode) {
                const funcName = tableName === "omuzomuza_engelli" ? "search_cvs_omuzomuza_v2" : "search_cvs_happy_v2";
                // In Search Mode, we fetch ALL matches to determine accurate count client-side
                query = supabase.rpc(funcName, { keyword: filters.keyword });
            } else {
                // In Browse Mode, we use server-side counting and pagination
                query = supabase.from(tableName).select('*', { count: 'exact' });
            }

            // 2. Apply Chained Filters (Common to both)

            // B. Name
            if (filters.fullName) {
                query = query.ilike('tam_isim', `%${filters.fullName}%`);
            }

            // C. Location
            if (filters.city && filters.city !== "Tümü" && filters.city !== "İstanbul (Tümü)") {
                if (filters.city === "İstanbul (Asya)") {
                    query = query.eq('adres_il', 'İstanbul');
                    const asiaDistricts = ["Adalar", "Ataşehir", "Beykoz", "Çekmeköy", "Kadıköy", "Kartal", "Maltepe", "Pendik", "Sancaktepe", "Sultanbeyli", "Şile", "Tuzla", "Ümraniye", "Üsküdar"];
                    const districtList = asiaDistricts.map(d => `"${d}"`).join(',');
                    // Note: RPC results are rows, so column filters still work
                    query = query.or(`adres_ilce.in.(${districtList}),adres_ilce.ilike.%Asya%,adres_ilce.ilike.%Anadolu%`);

                } else if (filters.city === "İstanbul (Avrupa)") {
                    query = query.eq('adres_il', 'İstanbul');
                    const europeDistricts = ["Arnavutköy", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kağıthane", "Küçükçekmece", "Sarıyer", "Silivri", "Sultangazi", "Şişli", "Zeytinburnu"];
                    query = query.or(`adres_ilce.in.(${europeDistricts.map(d => `"${d}"`).join(',')}),adres_ilce.ilike.%Avrupa%`);

                } else if (filters.city === "İstanbul (Tümü)") {
                    query = query.eq('adres_il', 'İstanbul');
                } else {
                    query = query.eq('adres_il', filters.city);
                }
            }
            if (filters.district) {
                query = query.eq('adres_ilce', filters.district);
            }

            // D. Personal
            if (filters.ageRange) {
                query = query.gte('yas', filters.ageRange[0]).lte('yas', filters.ageRange[1]);
            }
            const orConditions: string[] = [];
            if (filters.genders && filters.genders.length > 0) {
                filters.genders.forEach((g: string) => {
                    if (g === "Erkek") {
                        // Aggressive matching for Male
                        orConditions.push(
                            'cinsiyet.ilike.%Erkek%',
                            'cinsiyet.ilike.%Male%',
                            'cinsiyet.ilike.%Bay%',
                            'cinsiyet.eq.Erkek',
                            'cinsiyet.eq.Male',
                            'cinsiyet.eq.E',
                            'cinsiyet.eq.♂' // Just in case
                        );
                    } else if (g === "Kadın") {
                        // Aggressive matching for Female
                        orConditions.push(
                            'cinsiyet.ilike.%Kadın%',
                            'cinsiyet.ilike.%Female%',
                            'cinsiyet.ilike.%Bayan%',
                            'cinsiyet.eq.Kadın',
                            'cinsiyet.eq.Female',
                            'cinsiyet.eq.K',
                            'cinsiyet.eq.♀'
                        );
                    } else {
                        orConditions.push(`cinsiyet.eq.${g}`);
                    }
                });
            }
            if (orConditions.length > 0) {
                query = query.or(orConditions.join(','));
            }
            if (filters.nationality === "T.C.") {
                query = query.eq('uyruk', 'T.C.');
            } else if (filters.nationality === "Diğer") {
                query = query.neq('uyruk', 'T.C.');
            }
            if (filters.disabilityStatus === "Var") {
                query = query.not('engel_durumu', 'is', null).neq('engel_durumu', 'Yok').neq('engel_durumu', '');
            } else if (filters.disabilityStatus === "Yok") {
                query = query.or('engel_durumu.is.null,engel_durumu.eq.Yok,engel_durumu.eq.""');
            }

            // E. Education
            if (filters.university) query = query.ilike('universiteler', `%${filters.university}%`);
            if (filters.department) query = query.ilike('bolumler', `%${filters.department}%`);
            if (filters.eduLevel) query = query.ilike('egitim_durumu', `%${filters.eduLevel}%`);

            // F. Experience
            if (filters.workingStatus) {
                query = query.ilike('calisma_durumu', `%${filters.workingStatus}%`);
            }

            // Ordering
            query = query.order('dosya_id', { ascending: false });

            // 3. Execution & Pagination
            if (isSearchMode) {
                // Client-Side Pagination for Accurate Search Counts
                const { data, error } = await query;
                if (error) throw error;

                const fullResults = data as CvBankCandidate[];
                setTotal(fullResults.length);

                const from = (page - 1) * ITEMS_PER_PAGE;
                const to = from + ITEMS_PER_PAGE;
                setCandidates(fullResults.slice(from, to));

            } else {
                // Server-Side Pagination for Browse Mode
                const from = (page - 1) * ITEMS_PER_PAGE;
                const to = from + ITEMS_PER_PAGE - 1;
                query = query.range(from, to);

                const { data, error, count } = await query;
                if (error) throw error;

                setCandidates(data as CvBankCandidate[]);
                if (count !== null) setTotal(count);
            }

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Veri çekilirken hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, page, tableName]);

    // Pagination Controls
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            // Always show first, last, current, and surrounding
            const delta = 2;
            for (let i = 1; i <= totalPages; i++) {
                if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= page - delta && i <= page + delta)
                ) {
                    pages.push(i);
                } else if (
                    (i === page - delta - 1 && i > 1) ||
                    (i === page + delta + 1 && i < totalPages)
                ) {
                    pages.push("...");
                }
            }
            // Filter duplicates just in case logic overlaps
            return [...new Set(pages)];
        };

        const pages = getPageNumbers();

        return (
            <div className="flex items-center justify-center gap-1.5 py-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pages.map((p, idx) => (
                    typeof p === 'number' ? (
                        <Button
                            key={idx}
                            variant={page === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            className={`h-8 min-w-[32px] ${page === p ? "bg-[#6A1B9A] hover:bg-[#581581]" : "text-slate-600"}`}
                        >
                            {p}
                        </Button>
                    ) : (
                        <span key={idx} className="px-1 text-slate-400">...</span>
                    )
                ))}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6">
            <CVFilterSidebar onFilter={handleFilterChange} loading={loading} />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-[#6A1B9A] text-white flex items-center justify-center shadow-md">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                        <p className="text-slate-500 text-sm">{description}</p>
                        {/* Debug Indicator Removed */}
                    </div>
                </div>

                {/* Pagination Controls - Top */}
                <div className="flex-shrink-0 bg-white border-b border-slate-100 z-10">
                    {renderPagination()}
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {errorMsg && (
                        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            <p className="font-bold">Bir hata oluştu:</p>
                            <p className="text-sm">{errorMsg}</p>
                        </div>
                    )}
                    <CVCandidateList
                        candidates={candidates}
                        loading={loading}
                        total={total}
                        isOmuzOmuza={tableName === "omuzomuza_engelli"}
                    />
                </div>

                {/* Pagination Controls - Bottom */}
                <div className="flex-shrink-0 bg-white border-t border-slate-100 mb-4">
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
}
