"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Job, Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Briefcase, Building2, CheckCircle, ArrowLeft, Calendar, DollarSign } from "lucide-react";

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [isApplied, setIsApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    async function fetchJobDetails() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch job details
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;
            setJob(jobData);

            // Check if user has already applied
            if (user) {
                const { data: appData, error: appError } = await supabase
                    .from('applications')
                    .select('*')
                    .eq('candidate_id', user.id)
                    .eq('job_id', jobId)
                    .single();

                if (appData) {
                    setIsApplied(true);
                }
            }

        } catch (error) {
            console.error("Error fetching job details:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApply() {
        setApplying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Başvuru yapmak için giriş yapmalısınız.");
                return;
            }

            if (isApplied) {
                alert("Bu ilana zaten başvurdunuz.");
                return;
            }

            const { error } = await supabase
                .from('applications')
                .insert([
                    {
                        job_id: parseInt(jobId),
                        candidate_id: user.id,
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            setIsApplied(true);
            alert("Başvurunuz başarıyla alındı!");

        } catch (error) {
            console.error("Application error:", error);
            alert("Başvuru sırasında bir hata oluştu.");
        } finally {
            setApplying(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1498e0]" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="text-center p-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">İlan Bulunamadı</h2>
                <p className="text-slate-500 mb-6">Aradığınız iş ilanı bulunamadı veya kaldırılmış olabilir.</p>
                <Button onClick={() => router.push('/candidate/jobs')} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> İlanlara Dön
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Back Button */}
            <Button
                onClick={() => router.push('/candidate/jobs')}
                variant="ghost"
                className="mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> İlanlara Dön
            </Button>

            {/* Job Header */}
            <Card className="border-t-4 border-t-[#1498e0]">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
                                {job.title}
                            </CardTitle>
                            <div className="flex items-center text-lg text-slate-600 mb-4">
                                <Building2 className="w-5 h-5 mr-2" />
                                {job.company_name}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    <MapPin className="w-4 h-4 mr-1" /> {job.location}
                                </Badge>
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    <Briefcase className="w-4 h-4 mr-1" /> {job.work_type}
                                </Badge>

                            </div>
                        </div>
                        {isApplied && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-sm px-4 py-2">
                                <CheckCircle className="w-4 h-4 mr-1" /> Başvuruldu
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Job Description */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">İş Tanımı</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {job.description}
                    </p>
                </CardContent>
            </Card>

            {/* Application Section */}
            <Card className="bg-slate-50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {isApplied ? "Başvurunuz Alındı" : "Bu pozisyona başvurmak ister misiniz?"}
                            </h3>
                            <p className="text-sm text-slate-600">
                                {isApplied
                                    ? "Başvurunuz inceleniyor. Başvurularım sayfasından durumunu takip edebilirsiniz."
                                    : "Başvurunuz hemen değerlendirilmeye alınacaktır."
                                }
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className={`${isApplied ? 'bg-slate-300 text-slate-500 hover:bg-slate-300' : 'bg-[#1498e0] hover:bg-[#0d8ad0] text-white'} px-8`}
                            disabled={isApplied || applying}
                            onClick={handleApply}
                        >
                            {applying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Başvuruluyor...
                                </>
                            ) : isApplied ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Başvuruldu
                                </>
                            ) : (
                                "Başvur"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
