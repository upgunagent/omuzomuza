"use client";

import { Modal } from "@/components/ui/modal";
import { Job } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Building2, CheckCircle, Calendar, Eye, Loader2 } from "lucide-react";

interface JobPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
}

export default function JobPreviewModal({ isOpen, onClose, job }: JobPreviewModalProps) {
    if (!job) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="İlan Ön İzleme (Aday Görünümü)" className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-1">
                <div className="space-y-6">
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
                                        {job.created_at && (
                                            <Badge variant="outline" className="text-sm px-3 py-1">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(job.created_at).toLocaleDateString('tr-TR')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
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

                    {/* Application Section (Mock) */}
                    <Card className="bg-slate-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                        Bu pozisyona başvurmak ister misiniz?
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        Başvurunuz hemen değerlendirilmeye alınacaktır.
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    className="bg-[#1498e0] hover:bg-[#0d8ad0] text-white px-8 cursor-not-allowed opacity-80"
                                    disabled
                                >
                                    <Eye className="w-4 h-4 mr-2" /> Ön İzleme Modu
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-center justify-center">
                        <p><strong>Not:</strong> Bu ekran sadece ön izleme amaçlıdır. Başvuru butonları işlevsizdir.</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
