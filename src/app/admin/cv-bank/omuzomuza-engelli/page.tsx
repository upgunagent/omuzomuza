"use client";

import { CVBankPage } from "@/components/cv-bank/CVBankPage";

export default function AdminDisabledCVPage() {
    return (
        <CVBankPage
            tableName="omuzomuza_engelli"
            title="Omuz Omuza İK (Engelli)"
            description="Engelli aday havuzunu görüntüleyin ve filtreleyin."
        />
    );
}
