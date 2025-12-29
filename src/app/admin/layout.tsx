import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="pl-64 w-full">
                <main className="px-2 py-8 w-full max-w-[1400px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
