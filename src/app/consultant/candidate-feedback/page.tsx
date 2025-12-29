"use client";

import { Suspense } from "react";
import CandidateFeedbackForm from "@/components/features/mail/CandidateFeedbackForm";

export default function ConsultantCandidateFeedbackPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Adaya Geri Dönüş Maili Gönder</h1>
                <p className="text-sm text-slate-500 mt-1">Adaylara otomatik geri dönüş maili gönderin</p>
            </div>

            <Suspense fallback={<div>Yükleniyor...</div>}>
                <CandidateFeedbackForm defaultCompany="" />
            </Suspense>
        </div>
    );
}
