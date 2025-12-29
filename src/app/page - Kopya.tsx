import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Shield, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col gap-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            HR Management Platform
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Welcome to the HR portal. Please select your role to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 w-full max-w-4xl mt-8">
          <RoleCard
            title="Candidate"
            description="Manage your profile, CV, and applications."
            href="/candidate/dashboard"
            icon={<Users className="w-10 h-10 mb-4 text-blue-500" />}
          />
          <RoleCard
            title="Consultant"
            description="Search candidates and manage recruitment."
            href="/consultant/dashboard"
            icon={<Briefcase className="w-10 h-10 mb-4 text-emerald-500" />}
          />
          <RoleCard
            title="Admin"
            description="System administration and job management."
            href="/admin/dashboard"
            icon={<Shield className="w-10 h-10 mb-4 text-indigo-500" />}
          />
        </div>
      </div>
    </main>
  );
}

function RoleCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group">
      <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-100 h-full text-center hover:-translate-y-1">
        {icon}
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 mb-6">{description}</p>
        <Button variant="outline" className="mt-auto group-hover:bg-slate-900 group-hover:text-white transition-colors">
          Access Panel
        </Button>
      </div>
    </Link>
  );
}
