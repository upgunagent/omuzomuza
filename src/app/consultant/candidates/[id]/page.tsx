"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Candidate, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeSkill, ResumeCertification, ResumeReference } from "@/types";
import { CvView } from "@/components/features/cv/CvView";
import { CvPdfDocument } from "@/components/features/cv/CvPdfDocument";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";

export default function ConsultantCandidateDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [educations, setEducations] = useState<ResumeEducation[]>([]);
    const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
    const [languages, setLanguages] = useState<ResumeLanguage[]>([]);
    const [skills, setSkills] = useState<ResumeSkill[]>([]);
    const [certifications, setCertifications] = useState<ResumeCertification[]>([]);
    const [references, setReferences] = useState<ResumeReference[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAllData(); }, [id]);

    async function fetchAllData() {
        setLoading(true);
        const { data: c } = await supabase.from('candidates').select('*').eq('id', id).single();
        if (c) setCandidate(c);

        const { data: edu } = await supabase.from('resume_educations').select('*').eq('candidate_id', id).order('start_date', { ascending: false });
        if (edu) setEducations(edu);

        const { data: exp } = await supabase.from('resume_experiences').select('*').eq('candidate_id', id).order('start_date', { ascending: false });
        if (exp) setExperiences(exp);

        const { data: lang } = await supabase.from('resume_languages').select('*').eq('candidate_id', id);
        if (lang) setLanguages(lang);

        const { data: skl } = await supabase.from('resume_skills').select('*').eq('candidate_id', id);
        if (skl) setSkills(skl);

        const { data: cert } = await supabase.from('resume_certifications').select('*').eq('candidate_id', id);
        if (cert) setCertifications(cert);

        const { data: ref } = await supabase.from('resume_references').select('*').eq('candidate_id', id);
        if (ref) setReferences(ref);

        setLoading(false);
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!candidate) return <div className="p-8">Candidate not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <Link href="/consultant/candidates" className="flex items-center text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
                </Link>

                <PDFDownloadLink
                    document={
                        <CvPdfDocument
                            candidate={candidate}
                            educations={educations}
                            experiences={experiences}
                            languages={languages}
                            skills={skills}
                            certifications={certifications}
                            references={references}
                        />
                    }
                    fileName={`CV_${candidate.first_name}_${candidate.last_name}.pdf`}
                >
                    {({ blob, url, loading: pdfLoading, error }) => (
                        <Button disabled={pdfLoading}>
                            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {pdfLoading ? "Generating PDF..." : "Download PDF"}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            <CvView
                candidate={candidate}
                educations={educations}
                experiences={experiences}
                languages={languages}
                skills={skills}
                certifications={certifications}
                references={references}
            />
        </div>
    );
}
