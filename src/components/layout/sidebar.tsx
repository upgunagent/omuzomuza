"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Users, FileText, Settings, LogOut, Shield, ChevronLeft, Mail, User, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";

import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

export function Sidebar() {
    const pathname = usePathname();
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) setUserProfile(data);
            }
        }
        fetchUser();
    }, []);

    return (
        <aside className="bg-[#1498e0] w-64 h-screen sticky top-0 flex-shrink-0 text-white flex flex-col shadow-xl">
            {/* Header with Logo - White Background */}
            <div className="h-20 bg-white flex items-center justify-center border-b border-slate-200">
                {/* Using standard img for simplicity or Next.js Image if preferred, using img to ensure immediate render without config */}
                <img src="/danismanlogo.png" alt="Omuz Omuza & Happy IK" className="h-12 w-auto object-contain" />
            </div>

            <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {/* Admin Links */}
                {pathname?.startsWith('/admin') && (
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">Yönetim</p>
                        <Link href="/admin/dashboard" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/dashboard') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <LayoutDashboard className="w-5 h-5" /> Kontrol Paneli
                        </Link>
                        <Link href="/admin/jobs" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/jobs') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> İlanlarım
                        </Link>
                        <Link href="/admin/applications" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/applications') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <FileText className="w-5 h-5" /> Başvurular
                        </Link>
                        <Link href="/admin/candidates" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/candidates') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Users className="w-5 h-5" /> Üye Havuzu
                        </Link>

                    </div>
                )}

                {/* Feedback Link - Added above CV Bank */}
                {pathname?.startsWith('/admin') && (
                    <div className="space-y-1 mt-6">
                        <Link href="/admin/candidate-feedback" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/candidate-feedback') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Mail className="w-5 h-5" /> Aday'a Dönüş Yap
                        </Link>
                        <Link href="/admin/invite-member" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/invite-member') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <User className="w-5 h-5" /> Üyelik Maili Gönder
                        </Link>
                    </div>
                )}

                {pathname?.startsWith('/admin') && (
                    <div className="space-y-1 mt-6 border-t border-white/10 pt-6">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">CV Bankaları</p>
                        <Link href="/admin/cv-bank/omuzomuza-engelli" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/cv-bank/omuzomuza-engelli') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> Omuz Omuza İK
                        </Link>
                        <Link href="/admin/cv-bank/happy-engelsiz" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/cv-bank/happy-engelsiz') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Users className="w-5 h-5" /> Happy İK
                        </Link>
                        <Link href="/admin/cv-bank/engelli-raporlari" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/cv-bank/engelli-raporlari') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <FileText className="w-5 h-5" /> Engelli Raporları
                        </Link>
                    </div>
                )}

                {/* CRM Links - Admin */}
                {pathname?.startsWith('/admin') && (
                    <div className="space-y-1 mt-6 border-t border-white/10 pt-6">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">CRM Modülü</p>
                        <Link href="/admin/companies" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/companies') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Building2 className="w-5 h-5" /> Firma Bilgileri
                        </Link>
                        <Link href="/admin/positions" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/positions') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> Açık Pozisyonlar
                        </Link>
                    </div>
                )}

                {/* Candidate Links */}
                {pathname?.startsWith('/candidate') && (
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">Aday Menüsü</p>
                        <Link href="/candidate/jobs" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/candidate/jobs') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> İş İlanları
                        </Link>
                        <Link href="/candidate/profile" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/candidate/profile') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Users className="w-5 h-5" /> Profilim
                        </Link>
                        <Link href="/candidate/files" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/candidate/files') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <FileText className="w-5 h-5" /> Dosyalarım
                        </Link>
                        <Link href="/candidate/applications" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/candidate/applications') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> Başvurularım
                        </Link>
                    </div>
                )}

                {/* Consultant Links */}
                {pathname?.startsWith('/consultant') && (
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">İK Uzmanı</p>
                        <Link href="/consultant/dashboard" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/dashboard') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <LayoutDashboard className="w-5 h-5" /> Dashboard
                        </Link>
                        <Link href="/consultant/candidates" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/candidates') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Users className="w-5 h-5" /> Üye Havuzu
                        </Link>
                        <Link href="/consultant/jobs" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/jobs') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> İlanlar
                        </Link>
                        <Link href="/consultant/applications" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/applications') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <FileText className="w-5 h-5" /> Başvuru Süreçleri
                        </Link>
                    </div>
                )}

                {/* Feedback Link - Added above CV Bank */}
                {pathname?.startsWith('/consultant') && (
                    <div className="space-y-1 mt-6">
                        <Link href="/consultant/candidate-feedback" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/candidate-feedback') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Mail className="w-5 h-5" /> Aday'a Dönüş Yap
                        </Link>
                        <Link href="/consultant/invite-member" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/invite-member') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <User className="w-5 h-5" /> Üyelik Maili Gönder
                        </Link>
                    </div>
                )}

                {pathname?.startsWith('/consultant') && (
                    <div className="space-y-1 mt-6 border-t border-white/10 pt-6">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">CV Bankaları</p>
                        <Link href="/consultant/cv-bank/omuzomuza-engelli" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/cv-bank/omuzomuza-engelli') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> Omuz Omuza İK
                        </Link>
                        <Link href="/consultant/cv-bank/happy-engelsiz" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/cv-bank/happy-engelsiz') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Users className="w-5 h-5" /> Happy İK
                        </Link>
                        <Link href="/consultant/cv-bank/engelli-raporlari" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/cv-bank/engelli-raporlari') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <FileText className="w-5 h-5" /> Engelli Raporları
                        </Link>
                    </div>
                )}

                {/* CRM Links - Consultant */}
                {pathname?.startsWith('/consultant') && (
                    <div className="space-y-1 mt-6 border-t border-white/10 pt-6">
                        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white mb-2">CRM Modülü</p>
                        <Link href="/consultant/companies" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/companies') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Building2 className="w-5 h-5" /> Firma Bilgileri
                        </Link>
                        <Link href="/consultant/positions" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/consultant/positions') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                            <Briefcase className="w-5 h-5" /> Açık Pozisyonlar
                        </Link>
                    </div>
                )}

            </nav>

            {/* Logout Button - Pinned to Bottom with extra padding */}
            <div className="mt-auto p-4 pb-8 border-t border-white/10">
                {pathname?.startsWith('/admin') && (
                    <Link href="/admin/consultants" className={cn("flex items-center gap-3 mb-4 px-3 py-2.5 rounded-lg transition-all font-bold text-sm", isActive('/admin/consultants') ? "bg-white text-[#1498e0] shadow-sm" : "text-white hover:bg-white/10 hover:text-white")}>
                        <Shield className="w-5 h-5" /> Danışmanlar
                    </Link>
                )}
                {userProfile && (
                    <div
                        className="mb-4 -mx-2 px-3 py-2 rounded-lg flex items-center gap-3 text-white cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setIsPasswordModalOpen(true)}
                        title="Şifre Değiştir"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">
                                {(userProfile.first_name || userProfile.last_name)
                                    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`
                                    : 'Kullanıcı'}
                            </div>
                            <div className="text-[10px] text-white truncate">{userProfile.email}</div>
                        </div>
                    </div>
                )}
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/10 hover:text-white transition-colors group">
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> <span className="text-sm font-bold">Güvenli Çıkış</span>
                </Link>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </aside>
    );
}
