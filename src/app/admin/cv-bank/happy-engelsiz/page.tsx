"use client";

import { CVBankPage } from "@/components/cv-bank/CVBankPage";

export default function AdminNonDisabledCVPage() {
    return (
        <CVBankPage
            tableName="happy_engelsiz"
            title="Happy İK (Engelsiz)"
            description="Engelsiz aday havuzunu görüntüleyin ve filtreleyin."
        />
    );
}
