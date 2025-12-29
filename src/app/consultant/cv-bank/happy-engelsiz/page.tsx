"use client";

import { CVBankPage } from "@/components/cv-bank/CVBankPage";

export default function ConsultantNonDisabledCVPage() {
    return (
        <CVBankPage
            tableName="happy_engelsiz"
            title="Happy İK (Engelsiz)"
            description="Engelsiz aday havuzunu görüntüleyin ve filtreleyin."
        />
    );
}
