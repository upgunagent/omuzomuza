import { Sidebar } from "@/components/layout/sidebar";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                <main className="px-8 py-8 w-full max-w-[1400px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
