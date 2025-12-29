import { Sidebar } from "@/components/layout/sidebar";

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 w-full min-w-0">
                <main className="pl-10 pr-6 py-8 w-full max-w-[1400px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
