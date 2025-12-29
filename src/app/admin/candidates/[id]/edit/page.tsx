"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PersonalInformationForm } from "@/components/features/resume/PersonalInformationForm";
import { EducationSection } from "@/components/features/resume/EducationSection";
import { ExperienceSection } from "@/components/features/resume/ExperienceSection";
import { SkillSection } from "@/components/features/resume/SkillSection";
import { LanguageSection } from "@/components/features/resume/LanguageSection";
import { CertificationSection } from "@/components/features/resume/CertificationSection";
import { ReferenceSection } from "@/components/features/resume/ReferenceSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminEditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [candidateName, setCandidateName] = useState<string>("");

    useEffect(() => {
        checkAuthAndFetchName();
    }, [id]);

    async function checkAuthAndFetchName() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Fetch candidate name for header
        const { data } = await supabase.from('candidates').select('first_name, last_name').eq('id', id).single();
        if (data) {
            setCandidateName(`${data.first_name || ''} ${data.last_name || ''}`);
        }
        setLoading(false);
    }

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Aday Düzenle (Admin)</h1>
                    <p className="text-slate-500">{candidateName} adlı adayın CV bilgilerini düzenliyorsunuz.</p>
                </div>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto">
                    <TabsTrigger value="personal">Kişisel Bilgiler</TabsTrigger>
                    <TabsTrigger value="education">Eğitim</TabsTrigger>
                    <TabsTrigger value="experience">Deneyim</TabsTrigger>
                    <TabsTrigger value="skills">Yetenekler</TabsTrigger>
                    <TabsTrigger value="languages">Diller</TabsTrigger>
                    <TabsTrigger value="certs">Sertifikalar</TabsTrigger>
                    <TabsTrigger value="refs">Referanslar</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-6">
                    <PersonalInformationForm candidateId={id} />
                </TabsContent>
                <TabsContent value="education" className="mt-6">
                    <EducationSection candidateId={id} />
                </TabsContent>
                <TabsContent value="experience" className="mt-6">
                    <ExperienceSection candidateId={id} />
                </TabsContent>
                <TabsContent value="skills" className="mt-6">
                    <SkillSection candidateId={id} />
                </TabsContent>
                <TabsContent value="languages" className="mt-6">
                    <LanguageSection candidateId={id} />
                </TabsContent>
                <TabsContent value="certs" className="mt-6">
                    <CertificationSection candidateId={id} />
                </TabsContent>
                <TabsContent value="refs" className="mt-6">
                    <ReferenceSection candidateId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
