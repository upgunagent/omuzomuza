"use client";

import { Modal } from "@/components/ui/modal";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { CvPdfDocument } from "./CvPdfDocument";
import { Candidate, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeSkill, ResumeCertification, ResumeReference } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface CvPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        candidate: Candidate;
        educations: ResumeEducation[];
        experiences: ResumeExperience[];
        languages: ResumeLanguage[];
        skills: ResumeSkill[];
        certifications: ResumeCertification[];
        references: ResumeReference[];
    } | null;
}

export default function CvPreviewModal({ isOpen, onClose, data }: CvPreviewModalProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isOpen || !data || !isClient) return null;

    // Generate filename from candidate name
    const fileName = `${data.candidate.first_name || ''} ${data.candidate.last_name || ''}`.trim() || 'CV';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Özgeçmiş Önizleme ve İndirme" className="max-w-6xl h-[95vh]">
            <div className="w-full flex flex-col gap-3 h-full">
                {/* Download Button */}
                <div className="flex justify-end flex-shrink-0">
                    <PDFDownloadLink
                        document={
                            <CvPdfDocument
                                candidate={data.candidate}
                                educations={data.educations}
                                experiences={data.experiences}
                                languages={data.languages}
                                skills={data.skills}
                                certifications={data.certifications}
                                references={data.references}
                            />
                        }
                        fileName={`${fileName}.pdf`}
                    >
                        {({ loading }) => (
                            <Button
                                disabled={loading}
                                className="bg-[#6A1B9A] hover:bg-[#5b1785] text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Hazırlanıyor...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF İndir
                                    </>
                                )}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>

                {/* PDF Preview */}
                <div style={{ height: 'calc(100% - 60px)', width: '100%' }}>
                    <PDFViewer
                        width="100%"
                        height="100%"
                        className="border rounded-md"
                        showToolbar={true}
                    >
                        <CvPdfDocument
                            candidate={data.candidate}
                            educations={data.educations}
                            experiences={data.experiences}
                            languages={data.languages}
                            skills={data.skills}
                            certifications={data.certifications}
                            references={data.references}
                        />
                    </PDFViewer>
                </div>
            </div>
        </Modal>
    );
}
