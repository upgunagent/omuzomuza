import InviteMemberForm from "@/components/features/mail/InviteMemberForm";
import { Suspense } from "react";

export default function InviteMemberPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Üyelik Maili Gönder</h1>
                <p className="text-slate-500 mt-2">Adaylara platform üyeliği için davet gönderin.</p>
            </div>

            <Suspense fallback={<div>Yükleniyor...</div>}>
                <InviteMemberForm />
            </Suspense>
        </div>
    );
}
